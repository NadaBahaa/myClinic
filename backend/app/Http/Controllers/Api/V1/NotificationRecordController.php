<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Notification\StoreNotificationRequest;
use App\Http\Resources\NotificationRecordResource;
use App\Models\Appointment;
use App\Models\NotificationRecord;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationRecordController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = NotificationRecord::with(['patient', 'appointment'])->latest('sent_at');

        if ($patientUuid = $request->query('patient')) {
            $patient = Patient::where('uuid', $patientUuid)->first();
            if ($patient) $query->where('patient_id', $patient->id);
        }

        return response()->json(NotificationRecordResource::collection($query->get()));
    }

    public function store(StoreNotificationRequest $request): JsonResponse
    {
        $patient     = Patient::where('uuid', $request->patientId)->firstOrFail();
        $appointment = Appointment::where('uuid', $request->appointmentId)->firstOrFail();

        $record = NotificationRecord::create([
            'patient_id'     => $patient->id,
            'appointment_id' => $appointment->id,
            'type'           => $request->type,
            'sent_at'        => now(),
            'sent_by'        => $request->sentBy,
            'method'         => $request->method,
            'status'         => $request->status ?? 'sent',
        ]);

        $record->load(['patient', 'appointment']);

        return response()->json(new NotificationRecordResource($record), 201);
    }

    /**
     * GET /api/v1/notifications/pending
     * Appointments tomorrow that haven't received a reminder yet.
     */
    public function pending(): JsonResponse
    {
        $tomorrow = now()->addDay()->toDateString();

        $appointments = Appointment::with(['patient', 'doctor', 'services'])
            ->whereDate('date', $tomorrow)
            ->where('status', 'scheduled')
            ->whereDoesntHave('notifications', fn($q) => $q->where('type', 'reminder'))
            ->get();

        return response()->json($appointments->map(fn($a) => [
            'id'          => $a->uuid,
            'patientName' => $a->patient->name,
            'patientEmail'=> $a->patient->email,
            'doctorName'  => $a->doctor->name,
            'date'        => $a->date->toDateString(),
            'startTime'   => $a->start_time,
        ]));
    }
}
