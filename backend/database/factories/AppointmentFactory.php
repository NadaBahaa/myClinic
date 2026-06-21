<?php

namespace Database\Factories;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Appointment> */
class AppointmentFactory extends Factory
{
    protected $model = Appointment::class;

    public function definition(): array
    {
        $start = fake()->time('H:i');

        return [
            'uuid'       => (string) Str::uuid(),
            'patient_id' => Patient::factory(),
            'doctor_id'  => Doctor::factory(),
            'date'       => now()->addDay()->toDateString(),
            'start_time' => $start,
            'end_time'   => date('H:i', strtotime($start) + 3600),
            'duration'   => 60,
            'status'     => 'scheduled',
            'notes'      => null,
        ];
    }
}
