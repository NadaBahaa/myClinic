<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Appointment\StoreAppointmentRequest;
use App\Http\Requests\Appointment\UpdateAppointmentRequest;
use App\Http\Resources\AppointmentResource;
use App\Models\ActivityLog;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AppointmentController extends Controller
{
    /**
     * Admin, superadmin, assistant, accountant: all appointments (subject to query filters).
     * Doctor: only appointments for their linked doctor profile.
     */
    private function restrictQueryToDoctorIfNeeded(\Illuminate\Database\Eloquent\Builder $query, Request $request): void
    {
        if ($request->user()?->role !== 'doctor') {
            return;
        }
        $request->user()->loadMissing('doctor');
        if ($request->user()->doctor) {
            $query->where('doctor_id', $request->user()->doctor->id);
        } else {
            $query->whereRaw('1 = 0');
        }
    }

    private function doctorOwnsAppointment(Request $request, Appointment $appt): bool
    {
        if ($request->user()?->role !== 'doctor') {
            return true;
        }
        $request->user()->loadMissing('doctor');
        if (! $request->user()->doctor) {
            return false;
        }

        return (int) $appt->doctor_id === (int) $request->user()->doctor->id;
    }

    public function index(Request $request): JsonResponse
    {
        $query = Appointment::with(['patient', 'doctor', 'services']);

        $this->restrictQueryToDoctorIfNeeded($query, $request);

        if ($date = $request->query('date')) {
            $query->whereDate('date', $date);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($doctorUuid = $request->query('doctor')) {
            $doctor = Doctor::where('uuid', $doctorUuid)->first();
            if ($doctor) $query->where('doctor_id', $doctor->id);
        }

        if ($patientUuid = $request->query('patient')) {
            $patient = Patient::where('uuid', $patientUuid)->first();
            if ($patient) $query->where('patient_id', $patient->id);
        }

        if ($dateFrom = $request->query('date_from')) {
            $query->whereDate('date', '>=', $dateFrom);
        }
        if ($dateTo = $request->query('date_to')) {
            $query->whereDate('date', '<=', $dateTo);
        }

        return response()->json(AppointmentResource::collection($query->latest('date')->get()));
    }

    public function store(StoreAppointmentRequest $request): JsonResponse
    {
        $patient = Patient::where('uuid', $request->patientId)->firstOrFail();
        $doctor  = Doctor::where('uuid', $request->doctorId)->firstOrFail();

        if ($request->user()?->role === 'doctor') {
            $request->user()->loadMissing('doctor');
            if (! $request->user()->doctor || (int) $request->user()->doctor->id !== (int) $doctor->id) {
                return response()->json(['message' => 'You may only create appointments for yourself.'], 403);
            }
        }

        $appointment = Appointment::create([
            'patient_id' => $patient->id,
            'doctor_id'  => $doctor->id,
            'date'       => $request->date,
            'start_time' => $request->startTime,
            'end_time'   => $request->endTime,
            'duration'   => $request->duration,
            'status'     => $request->status ?? 'scheduled',
            'notes'      => $request->notes,
        ]);

        // Attach services with snapshot names
        $services = Service::whereIn('uuid', $request->services)->get();
        $syncData = $services->mapWithKeys(fn($s) => [$s->id => ['service_name' => $s->name]]);
        $appointment->services()->sync($syncData);

        // Increment patient's visit count if completing an appointment
        if (($request->status ?? 'scheduled') === 'completed') {
            $patient->increment('total_visits');
            $patient->update(['last_visit' => $request->date]);
        }

        $appointment->load(['patient', 'doctor', 'services']);
        ActivityLog::log($request->user()?->id, 'created', 'appointment', $appointment->uuid, null, $appointment->toArray());

        return response()->json(new AppointmentResource($appointment), 201);
    }

    public function show(string $uuid): JsonResponse
    {
        $appt = Appointment::where('uuid', $uuid)->with(['patient', 'doctor', 'services'])->firstOrFail();

        if (! $this->doctorOwnsAppointment(request(), $appt)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json(new AppointmentResource($appt));
    }

    public function update(UpdateAppointmentRequest $request, string $uuid): JsonResponse
    {
        $appt = Appointment::where('uuid', $uuid)->with(['patient', 'doctor'])->firstOrFail();

        if (! $this->doctorOwnsAppointment($request, $appt)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = [];
        if ($request->has('date'))      $data['date']       = $request->date;
        if ($request->has('startTime')) $data['start_time'] = $request->startTime;
        if ($request->has('endTime'))   $data['end_time']   = $request->endTime;
        if ($request->has('duration'))  $data['duration']   = $request->duration;
        if ($request->has('notes'))     $data['notes']      = $request->notes;

        // Handle status change → update patient stats
        if ($request->has('status')) {
            $oldStatus = $appt->status;
            $data['status'] = $request->status;

            if ($request->status === 'completed' && $oldStatus !== 'completed') {
                $appt->patient->increment('total_visits');
                $appt->patient->update(['last_visit' => $appt->date]);
            }
        }

        $old = $appt->toArray();
        $appt->update($data);

        if ($request->has('services')) {
            $services = Service::whereIn('uuid', $request->services)->get();
            $syncData = $services->mapWithKeys(fn($s) => [$s->id => ['service_name' => $s->name]]);
            $appt->services()->sync($syncData);
        }

        $appt->load(['patient', 'doctor', 'services']);
        ActivityLog::log($request->user()?->id, 'updated', 'appointment', $appt->uuid, $old, $appt->fresh()->toArray());

        return response()->json(new AppointmentResource($appt));
    }

    public function destroy(string $uuid): JsonResponse
    {
        $appt = Appointment::where('uuid', $uuid)->firstOrFail();

        if (! $this->doctorOwnsAppointment(request(), $appt)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $snapshot = $appt->toArray();
        $appt->update(['status' => 'cancelled']);
        $appt->delete(); // soft delete
        ActivityLog::log(request()->user()?->id, 'deleted', 'appointment', $uuid, $snapshot, null);

        return response()->json(['message' => 'Appointment cancelled']);
    }

    public function byDate(string $date): JsonResponse
    {
        $query = Appointment::with(['patient', 'doctor', 'services'])->whereDate('date', $date);
        $this->restrictQueryToDoctorIfNeeded($query, request());
        $appts = $query->get();

        return response()->json(AppointmentResource::collection($appts));
    }

    public function byDoctor(string $uuid): JsonResponse
    {
        $doctor = Doctor::where('uuid', $uuid)->firstOrFail();
        // Doctor role: may only request their own appointments
        if (request()->user()?->role === 'doctor' && request()->user()->doctor?->id !== $doctor->id) {
            return response()->json(AppointmentResource::collection(collect()));
        }

        $appts = Appointment::with(['patient', 'doctor', 'services'])
            ->where('doctor_id', $doctor->id)
            ->latest('date')
            ->get();

        return response()->json(AppointmentResource::collection($appts));
    }
}
