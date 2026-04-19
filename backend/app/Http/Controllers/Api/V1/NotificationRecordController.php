<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Notification\StoreNotificationRequest;
use App\Http\Resources\NotificationRecordResource;
use App\Models\Appointment;
use App\Models\NotificationRecord;
use App\Models\Patient;
use App\Models\Setting;
use Ghanem\LaravelSmsmisr\Facades\Smsmisr;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class NotificationRecordController extends Controller
{
    private const ALLOWED_REMINDER_ROLES = ['admin', 'assistant', 'doctor', 'superadmin'];

    private function smsMisrConfigured(): bool
    {
        return ! empty(config('smsmisr.sender'))
            && (! empty(config('smsmisr.token')) || (! empty(config('smsmisr.username')) && ! empty(config('smsmisr.password'))));
    }

    private function canSendReminders(Request $request): bool
    {
        $role = (string) ($request->user()?->role ?? '');
        return in_array($role, self::ALLOWED_REMINDER_ROLES, true);
    }

    /**
     * Doctors are restricted to their own appointments.
     * Admin/assistant/superadmin can process clinic-wide reminders.
     */
    private function applyRoleScopeToReminderQuery(Builder $query, Request $request): void
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
     * Appointments 1 to N days ahead (N = reminder_days_before) that haven't received a reminder yet.
     */
    public function pending(): JsonResponse
    {
        if (! $this->canSendReminders(request())) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $days = (int) Setting::get('reminder_days_before', 1);
        $days = $days < 1 ? 1 : ($days > 14 ? 14 : $days);

        $dateFrom = now()->addDay()->toDateString();
        $dateTo   = now()->addDays($days)->toDateString();

        $appointments = Appointment::with(['patient', 'doctor', 'services'])
            ->whereBetween('date', [$dateFrom, $dateTo])
            ->where('status', 'scheduled')
            ->whereDoesntHave('notifications', fn ($q) => $q->where('type', 'reminder'));
        $this->applyRoleScopeToReminderQuery($appointments, request());
        $appointments = $appointments
            ->orderBy('date')
            ->orderBy('start_time')
            ->get();

        return response()->json($appointments->map(fn ($a) => [
            'id'           => $a->uuid,
            'patientName'  => $a->patient->name,
            'patientEmail' => $a->patient->email ?? '',
            'patientPhone' => $a->patient->phone ?? '',
            'doctorName'   => $a->doctor->name,
            'date'         => $a->date->toDateString(),
            'startTime'    => $a->start_time,
            'services'     => $a->services->pluck('name')->implode(', '),
            'notes'        => $a->notes,
        ]));
    }

    /**
     * POST /api/v1/notifications/send-reminders
     * Send reminder (email + optional SMS via SMSMisr; WhatsApp is currently logged-only).
     */
    public function sendReminders(Request $request): JsonResponse
    {
        if (! $this->canSendReminders($request)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $days = (int) Setting::get('reminder_days_before', 1);
        $days = $days < 1 ? 1 : ($days > 14 ? 14 : $days);
        $dateFrom = now()->addDay()->toDateString();
        $dateTo   = now()->addDays($days)->toDateString();

        $query = Appointment::with(['patient', 'doctor', 'services'])
            ->whereBetween('date', [$dateFrom, $dateTo])
            ->where('status', 'scheduled')
            ->whereDoesntHave('notifications', fn ($q) => $q->where('type', 'reminder'));
        $this->applyRoleScopeToReminderQuery($query, $request);

        if ($request->has('appointmentIds') && is_array($request->appointmentIds)) {
            $query->whereIn('uuid', $request->appointmentIds);
        }

        $appointments = $query->get();
        $sent = 0;
        $failed = 0;
        $senderName = $request->user()?->name ?? 'System';

        foreach ($appointments as $appointment) {
            $patient = $appointment->patient;
            $doctor  = $appointment->doctor;
            $servicesText = $appointment->services->pluck('name')->implode(', ');
            $body = "Appointment reminder\n\n"
                . "Patient: {$patient->name}\n"
                . "Date: {$appointment->date->toDateString()} at {$appointment->start_time}\n"
                . "Doctor: {$doctor->name}\n"
                . "Services: {$servicesText}\n"
                . ($appointment->notes ? "Notes: {$appointment->notes}\n" : '')
                . "\nPlease confirm or reschedule if needed.";

            $methods = ['email'];
            if ($request->boolean('alsoSms') && ! empty($patient->phone)) {
                $methods[] = 'sms';
            }
            if ($request->boolean('alsoWhatsApp') && ! empty($patient->phone)) {
                $methods[] = 'whatsapp';
            }

            foreach ($methods as $method) {
                $status = 'sent';
                try {
                    if ($method === 'email' && ! empty($patient->email)) {
                        Mail::raw($body, function ($message) use ($patient, $appointment) {
                            $message->to($patient->email)
                                ->subject('Appointment reminder: ' . $appointment->date->toDateString() . ' at ' . $appointment->start_time);
                        });
                    } elseif ($method === 'sms' && ! empty($patient->phone)) {
                        if (! $this->smsMisrConfigured()) {
                            $status = 'failed';
                            Log::warning('SMSMisr is not configured; SMS reminder skipped', [
                                'patient_id' => $patient->id,
                                'phone'      => $patient->phone,
                            ]);
                        } else {
                            $response = Smsmisr::send($body, $patient->phone);
                            if (! $response->isSuccessful()) {
                                $status = 'failed';
                                Log::warning('SMSMisr returned failure', [
                                    'patient_id' => $patient->id,
                                    'phone'      => $patient->phone,
                                    'code'       => $response->code,
                                    'message'    => $response->message,
                                ]);
                            }
                        }
                    } elseif ($method === 'whatsapp' && ! empty($patient->phone)) {
                        Log::info('WhatsApp reminder requested (provider not configured yet)', [
                            'patient_id' => $patient->id,
                            'phone'      => $patient->phone,
                            'body'       => $body,
                        ]);
                    }
                } catch (\Throwable $e) {
                    $status = 'failed';
                    Log::warning('Reminder send failed', ['method' => $method, 'patient' => $patient->id, 'error' => $e->getMessage()]);
                }
                if ($status === 'sent') {
                    $sent++;
                } else {
                    $failed++;
                }
                NotificationRecord::create([
                    'patient_id'     => $patient->id,
                    'appointment_id' => $appointment->id,
                    'type'           => 'reminder',
                    'sent_at'        => now(),
                    'sent_by'        => $senderName,
                    'method'         => $method,
                    'status'         => $status,
                ]);
            }
        }

        return response()->json([
            'message' => 'Reminders processed',
            'sent'    => $sent,
            'failed'  => $failed,
            'total'   => $appointments->count(),
        ]);
    }
}
