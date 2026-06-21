<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\PatientFile;
use App\Models\Service;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;

class AppointmentService
{
    public function __construct(private readonly AppointmentAuthorizationService $authz)
    {
    }

    public function buildListQuery(Request $request): Builder
    {
        $query = Appointment::with(['patient', 'doctor', 'services']);
        $this->authz->scopeAppointmentsQuery($query, $request);

        if ($date = $request->query('date')) {
            $query->whereDate('date', $date);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($doctorUuid = $request->query('doctor')) {
            $doctor = Doctor::where('uuid', $doctorUuid)->first();
            if ($doctor) {
                $query->where('doctor_id', $doctor->id);
            }
        }

        if ($patientUuid = $request->query('patient')) {
            $patient = Patient::where('uuid', $patientUuid)->first();
            if ($patient) {
                $query->where('patient_id', $patient->id);
            }
        }

        if ($dateFrom = $request->query('date_from')) {
            $query->whereDate('date', '>=', $dateFrom);
        }
        if ($dateTo = $request->query('date_to')) {
            $query->whereDate('date', '<=', $dateTo);
        }

        return $query->latest('date');
    }

    public function list(Request $request): Collection
    {
        return $this->buildListQuery($request)->get();
    }

    public function create(array $validated, User $actor): Appointment
    {
        $patient = Patient::where('uuid', $validated['patientId'])->firstOrFail();
        $doctor  = Doctor::where('uuid', $validated['doctorId'])->firstOrFail();

        $appointment = Appointment::create([
            'patient_id' => $patient->id,
            'doctor_id'  => $doctor->id,
            'date'       => $validated['date'],
            'start_time' => $validated['startTime'],
            'end_time'   => $validated['endTime'],
            'duration'   => $validated['duration'],
            'status'     => $validated['status'] ?? 'scheduled',
            'notes'      => $validated['notes'] ?? null,
        ]);

        $services = Service::whereIn('uuid', $validated['services'] ?? [])->get();
        $syncData = $services->mapWithKeys(fn ($s) => [$s->id => ['service_name' => $s->name]]);
        $appointment->services()->sync($syncData);

        PatientFile::getOrCreate($patient->id, $doctor->id);

        if (($validated['status'] ?? 'scheduled') === 'completed') {
            $patient->increment('total_visits');
            $patient->update(['last_visit' => $validated['date']]);
        }

        $appointment->load(['patient', 'doctor', 'services']);
        ActivityLog::log($actor->id, 'created', 'appointment', $appointment->uuid, null, $appointment->toArray());

        return $appointment;
    }

    public function update(Appointment $appointment, array $validated, User $actor): Appointment
    {
        $data = [];
        foreach (['date', 'startTime', 'endTime', 'duration', 'notes'] as $field) {
            if (array_key_exists($field, $validated)) {
                $data[match ($field) {
                    'startTime' => 'start_time',
                    'endTime'   => 'end_time',
                    default     => $field,
                }] = $validated[$field];
            }
        }

        if (array_key_exists('status', $validated)) {
            $oldStatus = $appointment->status;
            $data['status'] = $validated['status'];

            if ($validated['status'] === 'completed' && $oldStatus !== 'completed') {
                $appointment->patient->increment('total_visits');
                $appointment->patient->update(['last_visit' => $appointment->date]);
            }
        }

        $old = $appointment->toArray();
        $appointment->update($data);

        if (array_key_exists('services', $validated)) {
            $services = Service::whereIn('uuid', $validated['services'])->get();
            $syncData = $services->mapWithKeys(fn ($s) => [$s->id => ['service_name' => $s->name]]);
            $appointment->services()->sync($syncData);
        }

        $appointment->load(['patient', 'doctor', 'services']);
        ActivityLog::log($actor->id, 'updated', 'appointment', $appointment->uuid, $old, $appointment->fresh()->toArray());

        return $appointment;
    }

    public function cancel(Appointment $appointment, User $actor): void
    {
        $snapshot = $appointment->toArray();
        $appointment->update(['status' => 'cancelled']);
        $appointment->delete();
        ActivityLog::log($actor->id, 'deleted', 'appointment', $appointment->uuid, $snapshot, null);
    }

    public function byDate(string $date, Request $request): Collection
    {
        $query = Appointment::with(['patient', 'doctor', 'services'])->whereDate('date', $date);
        $this->authz->scopeAppointmentsQuery($query, $request);

        return $query->get();
    }

    public function byDoctor(Doctor $doctor, Request $request): Collection
    {
        if ($request->user()?->role === 'doctor') {
            $request->user()->loadMissing('doctor');
            if ($request->user()->doctor?->id !== $doctor->id) {
                return collect();
            }
        }

        return Appointment::with(['patient', 'doctor', 'services'])
            ->where('doctor_id', $doctor->id)
            ->latest('date')
            ->get();
    }
}
