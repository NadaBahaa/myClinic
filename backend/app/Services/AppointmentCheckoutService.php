<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Appointment;
use App\Models\PatientFile;
use App\Models\Service;
use App\Models\SessionRecord;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AppointmentCheckoutService
{
    public function __construct(private readonly SessionRecordService $sessions)
    {
    }

    public function hasSessionStarted(Appointment $appointment): bool
    {
        $start = Carbon::parse(
            $appointment->date->toDateString().' '.$this->normalizeTime($appointment->start_time),
            config('app.timezone')
        );

        return now(config('app.timezone'))->greaterThanOrEqualTo($start);
    }

    public function isPaid(Appointment $appointment): bool
    {
        return $appointment->relationLoaded('sessionRecord')
            ? $appointment->sessionRecord !== null
            : $appointment->sessionRecord()->exists();
    }

    /**
     * Record payment by creating a session record and marking the appointment completed.
     */
    public function checkout(Appointment $appointment, User $actor): SessionRecord
    {
        $appointment->loadMissing(['patient', 'doctor', 'services', 'sessionRecord']);

        if ($appointment->status === 'cancelled') {
            abort(422, 'Cannot pay for a cancelled appointment.');
        }

        if ($this->isPaid($appointment)) {
            abort(422, 'This appointment has already been paid.');
        }

        if (! $this->hasSessionStarted($appointment)) {
            abort(422, 'Payment is available once the session start time has passed.');
        }

        $service = $appointment->services->first();
        if (! $service) {
            abort(422, 'Appointment has no linked service to bill.');
        }

        return DB::transaction(function () use ($appointment, $service, $actor) {
            $file = PatientFile::getOrCreate($appointment->patient_id, $appointment->doctor_id);

            $session = $this->sessions->createFromCheckout(
                $file,
                $appointment,
                $service,
                $actor->name
            );

            if ($appointment->status !== 'completed') {
                $appointment->update(['status' => 'completed']);
                $appointment->patient->increment('total_visits');
                $appointment->patient->update(['last_visit' => $appointment->date]);
            }

            ActivityLog::log(
                $actor->id,
                'checkout',
                'appointment',
                $appointment->uuid,
                null,
                ['sessionUuid' => $session->uuid, 'servicePrice' => $session->service_price]
            );

            return $session->load(['materialUsages.material', 'service', 'coupon']);
        });
    }

    private function normalizeTime(string $time): string
    {
        $parts = explode(':', trim($time));

        return sprintf('%02d:%02d:00', (int) ($parts[0] ?? 0), (int) ($parts[1] ?? 0));
    }
}
