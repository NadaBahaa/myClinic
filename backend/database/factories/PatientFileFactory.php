<?php

namespace Database\Factories;

use App\Models\Doctor;
use App\Models\Patient;
use App\Models\PatientFile;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<PatientFile> */
class PatientFileFactory extends Factory
{
    protected $model = PatientFile::class;

    public function definition(): array
    {
        return [
            'uuid'       => (string) Str::uuid(),
            'patient_id' => Patient::factory(),
            'doctor_id'  => Doctor::factory(),
        ];
    }
}
