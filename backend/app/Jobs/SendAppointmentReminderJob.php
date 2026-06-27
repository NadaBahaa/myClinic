<?php

namespace App\Jobs;

use App\Models\Appointment;
use App\Models\NotificationRecord;
use App\Models\Patient;
use App\Services\SmsMisrService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendAppointmentReminderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(
        public int $appointmentId,
        public string $method,
        public string $body,
        public string $htmlBody,
        public string $senderName,
    ) {
    }

    public function handle(SmsMisrService $smsMisr): void
    {
        $appointment = Appointment::with(['patient', 'doctor', 'services'])->find($this->appointmentId);
        if (! $appointment) {
            return;
        }

        $patient = $appointment->patient;
        $status  = 'sent';

        try {
            if ($this->method === 'email' && ! empty($patient->email)) {
                Mail::send([], [], function ($message) use ($patient, $appointment) {
                    $message->to($patient->email)
                        ->subject('Appointment Reminder: '.$appointment->date->toDateString().' at '.$appointment->start_time)
                        ->setBody($this->htmlBody, 'text/html')
                        ->addPart($this->body, 'text/plain');
                });
            } elseif ($this->method === 'sms' && ! empty($patient->phone)) {
                if (! $smsMisr->isConfigured()) {
                    $status = 'failed';
                    Log::warning('SMSMisr not configured; SMS skipped', ['patient_id' => $patient->id]);
                } else {
                    $result = $smsMisr->send($this->body, $patient->phone);
                    if (! $result['ok']) {
                        $status = 'failed';
                    }
                }
            } elseif ($this->method === 'whatsapp' && ! empty($patient->phone)) {
                Log::info('WhatsApp reminder (provider not configured)', [
                    'patient_id' => $patient->id,
                    'phone'      => $patient->phone,
                ]);
            }
        } catch (\Throwable $e) {
            $status = 'failed';
            Log::warning('Queued reminder send failed', [
                'method'    => $this->method,
                'patient'   => $patient->id,
                'error'     => $e->getMessage(),
            ]);
        }

        NotificationRecord::create([
            'patient_id'     => $patient->id,
            'appointment_id' => $appointment->id,
            'type'           => 'reminder',
            'sent_at'        => now(),
            'sent_by'        => $this->senderName,
            'method'         => $this->method,
            'status'         => $status,
            'message'        => $this->body,
        ]);
    }
}
