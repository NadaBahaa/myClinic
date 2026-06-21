<?php

namespace Tests\Concerns;

use App\Models\Doctor;
use App\Models\Patient;
use App\Models\PatientFile;
use App\Models\Service;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

trait CreatesMedicalFixtures
{
    protected function createDoctorUser(array $userAttrs = []): array
    {
        $user = User::factory()->doctor()->create($userAttrs);
        $doctor = Doctor::factory()->create([
            'user_id' => $user->id,
            'email'   => $user->email,
            'name'    => $user->name,
        ]);

        return ['user' => $user, 'doctor' => $doctor];
    }

    protected function createPatientWithFileForDoctor(Doctor $doctor): array
    {
        $patient = Patient::factory()->create();
        $file = PatientFile::factory()->create([
            'patient_id' => $patient->id,
            'doctor_id'  => $doctor->id,
        ]);

        return compact('patient', 'file');
    }

    protected function actingAsRole(string $role, array $attrs = []): User
    {
        $user = User::factory()->create(array_merge(['role' => $role], $attrs));
        Sanctum::actingAs($user);

        return $user;
    }

    protected function createService(): Service
    {
        return Service::factory()->create();
    }
}
