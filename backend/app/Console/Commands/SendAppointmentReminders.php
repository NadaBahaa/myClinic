<?php

namespace App\Console\Commands;

use App\Models\Appointment;
use App\Models\NotificationRecord;
use App\Models\Setting;
use Ghanem\LaravelSmsmisr\Facades\Smsmisr;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendAppointmentReminders extends Command
{
    protected $signature = 'reminders:send {--sms : Also send SMS reminders via SMSMisr}';

    protected $description = 'Send appointment reminders (email, optional SMS) for appointments 1 to N days ahead.';

    private function smsMisrConfigured(): bool
    {
        return ! empty(config('smsmisr.sender'))
            && (! empty(config('smsmisr.token')) || (! empty(config('smsmisr.username')) && ! empty(config('smsmisr.password'))));
    }

    public function handle(): int
    {
        $days = (int) Setting::get('reminder_days_before', 1);
        $days = $days < 1 ? 1 : ($days > 14 ? 14 : $days);
        $dateFrom = now()->addDay()->toDateString();
        $dateTo   = now()->addDays($days)->toDateString();

        $appointments = Appointment::with(['patient', 'doctor', 'services'])
            ->whereBetween('date', [$dateFrom, $dateTo])
            ->where('status', 'scheduled')
            ->whereDoesntHave('notifications', fn ($q) => $q->where('type', 'reminder'))
            ->get();

        $sent = 0;
        $failed = 0;

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

            $emailStatus = 'sent';
            try {
                if (! empty($patient->email)) {
                    Mail::raw($body, function ($message) use ($patient, $appointment) {
                        $message->to($patient->email)
                            ->subject('Appointment reminder: ' . $appointment->date->toDateString() . ' at ' . $appointment->start_time);
                    });
                } else {
                    $emailStatus = 'failed';
                }
            } catch (\Throwable $e) {
                $emailStatus = 'failed';
                Log::warning('Reminder email send failed', ['patient' => $patient->id, 'error' => $e->getMessage()]);
            }

            NotificationRecord::create([
                'patient_id'     => $patient->id,
                'appointment_id' => $appointment->id,
                'type'           => 'reminder',
                'sent_at'        => now(),
                'sent_by'        => 'Scheduled job',
                'method'         => 'email',
                'status'         => $emailStatus,
            ]);
            if ($emailStatus === 'sent') {
                $sent++;
            } else {
                $failed++;
            }

            if ($this->option('sms') && ! empty($patient->phone)) {
                $smsStatus = 'sent';
                try {
                    if (! $this->smsMisrConfigured()) {
                        $smsStatus = 'failed';
                        Log::warning('SMSMisr is not configured; SMS reminder skipped', ['patient' => $patient->id]);
                    } else {
                        $response = Smsmisr::send($body, $patient->phone);
                        if (! $response->isSuccessful()) {
                            $smsStatus = 'failed';
                            Log::warning('SMSMisr returned failure', [
                                'patient' => $patient->id,
                                'code'    => $response->code,
                                'message' => $response->message,
                            ]);
                        }
                    }
                } catch (\Throwable $e) {
                    $smsStatus = 'failed';
                    Log::warning('Reminder SMS send failed', ['patient' => $patient->id, 'error' => $e->getMessage()]);
                }

                NotificationRecord::create([
                    'patient_id'     => $patient->id,
                    'appointment_id' => $appointment->id,
                    'type'           => 'reminder',
                    'sent_at'        => now(),
                    'sent_by'        => 'Scheduled job',
                    'method'         => 'sms',
                    'status'         => $smsStatus,
                ]);
                if ($smsStatus === 'sent') {
                    $sent++;
                } else {
                    $failed++;
                }
            }
        }

        $this->info("Reminders: {$sent} sent, {$failed} failed, {$appointments->count()} total.");
        return 0;
    }
}
