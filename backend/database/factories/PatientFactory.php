<?php

namespace Database\Factories;

use App\Models\Patient;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Patient> */
class PatientFactory extends Factory
{
    protected $model = Patient::class;

    public function definition(): array
    {
        return [
            'uuid'              => (string) Str::uuid(),
            'name'              => fake()->name(),
            'email'             => fake()->unique()->safeEmail(),
            'phone'             => fake()->phoneNumber(),
            'date_of_birth'     => fake()->date(),
            'address'           => fake()->address(),
            'emergency_contact' => fake()->phoneNumber(),
            'notes'             => null,
            'total_visits'      => 0,
        ];
    }
}
