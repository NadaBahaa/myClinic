<?php

namespace App\Console\Commands;

use App\Models\Appointment;
use App\Models\NotificationRecord;
use App\Models\Setting;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendAppointmentReminders extends Command
{
    protected $signature = 'reminders:send';

    protected $description = 'Send appointment reminders (email) for appointments 1 to N days ahead (N = reminder_days_before setting).';

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

            $status = 'sent';
            try {
                if (! empty($patient->email)) {
                    Mail::raw($body, function ($message) use ($patient, $appointment) {
                        $message->to($patient->email)
                            ->subject('Appointment reminder: ' . $appointment->date->toDateString() . ' at ' . $appointment->start_time);
                    });
                } else {
                    $status = 'failed';
                }
            } catch (\Throwable $e) {
                $status = 'failed';
                Log::warning('Reminder send failed', ['patient' => $patient->id, 'error' => $e->getMessage()]);
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
                'sent_by'        => 'Scheduled job',
                'method'         => 'email',
                'status'         => $status,
            ]);
        }

        $this->info("Reminders: {$sent} sent, {$failed} failed, {$appointments->count()} total.");
        return 0;
    }
}
