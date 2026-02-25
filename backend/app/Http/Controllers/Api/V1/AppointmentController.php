<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Appointment\StoreAppointmentRequest;
use App\Http\Requests\Appointment\UpdateAppointmentRequest;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AppointmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Appointment::with(['patient', 'doctor', 'services']);

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

        return response()->json(AppointmentResource::collection($query->latest('date')->get()));
    }

    public function store(StoreAppointmentRequest $request): JsonResponse
    {
        $patient = Patient::where('uuid', $request->patientId)->firstOrFail();
        $doctor  = Doctor::where('uuid', $request->doctorId)->firstOrFail();

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

        return response()->json(new AppointmentResource($appointment), 201);
    }

    public function show(string $uuid): JsonResponse
    {
        $appt = Appointment::where('uuid', $uuid)->with(['patient', 'doctor', 'services'])->firstOrFail();

        return response()->json(new AppointmentResource($appt));
    }

    public function update(UpdateAppointmentRequest $request, string $uuid): JsonResponse
    {
        $appt = Appointment::where('uuid', $uuid)->with(['patient', 'doctor'])->firstOrFail();

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

        $appt->update($data);

        if ($request->has('services')) {
            $services = Service::whereIn('uuid', $request->services)->get();
            $syncData = $services->mapWithKeys(fn($s) => [$s->id => ['service_name' => $s->name]]);
            $appt->services()->sync($syncData);
        }

        $appt->load(['patient', 'doctor', 'services']);

        return response()->json(new AppointmentResource($appt));
    }

    public function destroy(string $uuid): JsonResponse
    {
        $appt = Appointment::where('uuid', $uuid)->firstOrFail();
        $appt->update(['status' => 'cancelled']);

        return response()->json(['message' => 'Appointment cancelled']);
    }

    public function byDate(string $date): JsonResponse
    {
        $appts = Appointment::with(['patient', 'doctor', 'services'])
            ->whereDate('date', $date)
            ->get();

        return response()->json(AppointmentResource::collection($appts));
    }

    public function byDoctor(string $uuid): JsonResponse
    {
        $doctor = Doctor::where('uuid', $uuid)->firstOrFail();

        $appts = Appointment::with(['patient', 'doctor', 'services'])
            ->where('doctor_id', $doctor->id)
            ->latest('date')
            ->get();

        return response()->json(AppointmentResource::collection($appts));
    }
}
