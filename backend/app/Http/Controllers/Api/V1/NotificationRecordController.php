<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Notification\StoreNotificationRequest;
use App\Http\Resources\NotificationRecordResource;
use App\Jobs\SendAppointmentReminderJob;
use App\Models\Appointment;
use App\Models\NotificationRecord;
use App\Models\Patient;
use App\Models\Setting;
use App\Services\AppointmentAuthorizationService;
use App\Services\SmsMisrService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class NotificationRecordController extends Controller
{
    private const ALLOWED_REMINDER_ROLES = ['admin', 'assistant', 'doctor', 'superadmin'];

    public function __construct(
        private readonly SmsMisrService $smsMisr,
        private readonly AppointmentAuthorizationService $authz,
    ) {}

    private function canSendReminders(Request $request): bool
    {
        $role = (string) ($request->user()?->role ?? '');

        return in_array($role, self::ALLOWED_REMINDER_ROLES, true);
    }

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
        $this->authorize('viewAny', NotificationRecord::class);

        $query = NotificationRecord::with(['patient', 'appointment'])->latest('sent_at');
        $this->authz->scopeNotificationsQuery($query, $request->user());

        if ($patientUuid = $request->query('patient')) {
            $patient = Patient::where('uuid', $patientUuid)->first();
            if ($patient) {
                $this->authorize('view', $patient);
                $query->where('patient_id', $patient->id);
            }
        }

        if ($request->query('active_only')) {
            $query->whereHas('appointment', fn ($q) => $q->whereDate('date', '>=', now()->toDateString()));
        }

        return response()->json(NotificationRecordResource::collection($query->get()));
    }

    public function store(StoreNotificationRequest $request): JsonResponse
    {
        $this->authorize('create', NotificationRecord::class);

        $patient     = Patient::where('uuid', $request->patientId)->firstOrFail();
        $appointment = Appointment::where('uuid', $request->appointmentId)->firstOrFail();

        $this->authorize('view', $patient);
        $this->authorize('view', $appointment);

        if ((int) $appointment->patient_id !== (int) $patient->id) {
            abort(422, 'Appointment does not belong to this patient.');
        }

        $record = NotificationRecord::create([
            'patient_id'     => $patient->id,
            'appointment_id' => $appointment->id,
            'type'           => $request->type,
            'sent_at'        => now(),
            'sent_by'        => $request->sentBy,
            'method'         => $request->method,
            'status'         => $request->status ?? 'sent',
            'message'        => $request->message ?? null,
        ]);

        $record->load(['patient', 'appointment']);

        return response()->json(new NotificationRecordResource($record), 201);
    }

    public function patientCounts(Request $request): JsonResponse
    {
        $query = NotificationRecord::with(['patient', 'appointment'])
            ->whereHas('appointment', fn ($q) => $q->whereDate('date', '>=', now()->toDateString()))
            ->select('patient_id')
            ->selectRaw('COUNT(*) as total_count')
            ->selectRaw('MAX(sent_at) as last_sent_at')
            ->groupBy('patient_id');

        $results = $query->get();

        $data = $results->map(function ($row) {
            $patient = $row->patient;
            $last = NotificationRecord::with(['appointment'])
                ->where('patient_id', $row->patient_id)
                ->whereHas('appointment', fn ($q) => $q->whereDate('date', '>=', now()->toDateString()))
                ->latest('sent_at')
                ->first();

            return [
                'patientId'       => $patient?->uuid,
                'patientName'     => $patient?->name,
                'patientEmail'    => $patient?->email,
                'patientPhone'    => $patient?->phone,
                'count'           => (int) $row->total_count,
                'lastSentAt'      => $row->last_sent_at,
                'lastMessage'     => $last?->message,
                'lastSentBy'      => $last?->sent_by,
                'lastMethod'      => $last?->method,
                'appointmentDate' => $last?->appointment?->date?->toDateString(),
                'appointmentTime' => $last?->appointment?->start_time,
            ];
        });

        return response()->json($data);
    }

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
        $queued = 0;
        $senderName = $request->user()?->name ?? 'System';
        $useQueue = config('queue.default') !== 'sync';

        foreach ($appointments as $appointment) {
            $patient = $appointment->patient;
            $doctor  = $appointment->doctor;
            $servicesText = $appointment->services->pluck('name')->implode(', ');

            $clinicName = Setting::get('clinic_name', 'Beauty Clinic');
            $body = "Dear {$patient->name},\n\n"
                . "This is a reminder for your upcoming appointment at {$clinicName}.\n\n"
                . "Date: {$appointment->date->toDateString()}\n"
                . "Time: {$appointment->start_time}\n"
                . "Doctor: {$doctor->name}\n"
                . "Services: {$servicesText}\n"
                . ($appointment->notes ? "Notes: {$appointment->notes}\n" : '')
                . "\nIf you need to reschedule, please contact us as soon as possible.\n\n"
                . "Thank you,\n{$clinicName}";

            $htmlBody = "
                <div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;'>
                <h2 style='color:#e91e8c;'>Appointment Reminder</h2>
                <p>Dear <strong>{$patient->name}</strong>,</p>
                <p>This is a reminder for your upcoming appointment at <strong>{$clinicName}</strong>.</p>
                <table style='width:100%;border-collapse:collapse;margin:20px 0;'>
                  <tr><td style='padding:8px;background:#f9f9f9;font-weight:bold;width:140px;'>Date:</td><td style='padding:8px;'>{$appointment->date->toDateString()}</td></tr>
                  <tr><td style='padding:8px;background:#f9f9f9;font-weight:bold;'>Time:</td><td style='padding:8px;'>{$appointment->start_time}</td></tr>
                  <tr><td style='padding:8px;background:#f9f9f9;font-weight:bold;'>Doctor:</td><td style='padding:8px;'>{$doctor->name}</td></tr>
                  <tr><td style='padding:8px;background:#f9f9f9;font-weight:bold;'>Services:</td><td style='padding:8px;'>{$servicesText}</td></tr>
                  " . ($appointment->notes ? "<tr><td style='padding:8px;background:#f9f9f9;font-weight:bold;'>Notes:</td><td style='padding:8px;'>{$appointment->notes}</td></tr>" : '') . "
                </table>
                <p>If you need to reschedule, please contact us as soon as possible.</p>
                <p>Thank you,<br><strong>{$clinicName}</strong></p>
                </div>";

            $methods = ['email'];
            if ($request->boolean('alsoSms') && ! empty($patient->phone)) {
                $methods[] = 'sms';
            }
            if ($request->boolean('alsoWhatsApp') && ! empty($patient->phone)) {
                $methods[] = 'whatsapp';
            }

            foreach ($methods as $method) {
                if ($useQueue) {
                    SendAppointmentReminderJob::dispatch(
                        $appointment->id,
                        $method,
                        $body,
                        $htmlBody,
                        $senderName
                    );
                    $queued++;

                    continue;
                }

                $status = 'sent';
                try {
                    if ($method === 'email' && ! empty($patient->email)) {
                        Mail::send([], [], function ($message) use ($patient, $appointment, $htmlBody, $body) {
                            $message->to($patient->email)
                                ->subject('Appointment Reminder: ' . $appointment->date->toDateString() . ' at ' . $appointment->start_time)
                                ->setBody($htmlBody, 'text/html')
                                ->addPart($body, 'text/plain');
                        });
                    } elseif ($method === 'sms' && ! empty($patient->phone)) {
                        if (! $this->smsMisr->isConfigured()) {
                            $status = 'failed';
                            Log::warning('SMSMisr not configured; SMS skipped', ['patient_id' => $patient->id]);
                        } else {
                            $result = $this->smsMisr->send($body, $patient->phone);
                            if (! $result['ok']) {
                                $status = 'failed';
                                Log::warning('SMSMisr failure', [
                                    'patient_id' => $patient->id,
                                    'code'       => $result['code'],
                                    'message'    => $result['message'],
                                ]);
                            }
                        }
                    } elseif ($method === 'whatsapp' && ! empty($patient->phone)) {
                        Log::info('WhatsApp reminder (provider not configured)', [
                            'patient_id' => $patient->id,
                            'phone'      => $patient->phone,
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
                    'message'        => $body,
                ]);
            }
        }

        return response()->json([
            'message' => $useQueue ? 'Reminders queued' : 'Reminders processed',
            'sent'    => $sent,
            'failed'  => $failed,
            'queued'  => $queued,
            'total'   => $appointments->count(),
        ]);
    }
}
