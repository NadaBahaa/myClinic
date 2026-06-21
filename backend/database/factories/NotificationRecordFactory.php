<?php

namespace Database\Factories;

use App\Models\Appointment;
use App\Models\NotificationRecord;
use App\Models\Patient;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<NotificationRecord> */
class NotificationRecordFactory extends Factory
{
    protected $model = NotificationRecord::class;

    public function definition(): array
    {
        $appointment = Appointment::factory()->create();

        return [
            'uuid'           => (string) Str::uuid(),
            'patient_id'     => $appointment->patient_id,
            'appointment_id' => $appointment->id,
            'type'           => 'reminder',
            'sent_at'        => now(),
            'sent_by'        => fake()->name(),
            'method'         => 'email',
            'status'         => 'sent',
            'message'        => fake()->sentence(),
        ];
    }
}
