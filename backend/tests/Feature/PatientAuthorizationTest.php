<?php

namespace Tests\Feature;

use App\Models\Patient;
use App\Models\PatientFile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesMedicalFixtures;
use Tests\TestCase;

class PatientAuthorizationTest extends TestCase
{
    use CreatesMedicalFixtures, RefreshDatabase;

    public function test_doctor_cannot_view_patient_without_shared_file(): void
    {
        ['user' => $doctorUser, 'doctor' => $doctor] = $this->createDoctorUser();
        ['user' => $otherDoctorUser] = $this->createDoctorUser();

        $patient = Patient::factory()->create();
        PatientFile::factory()->create([
            'patient_id' => $patient->id,
            'doctor_id'  => $doctor->id,
        ]);

        Sanctum::actingAs($otherDoctorUser);

        $this->getJson("/api/v1/patients/{$patient->uuid}")
            ->assertForbidden();
    }

    public function test_doctor_can_view_patient_with_shared_file(): void
    {
        ['user' => $doctorUser, 'doctor' => $doctor] = $this->createDoctorUser();
        ['patient' => $patient] = $this->createPatientWithFileForDoctor($doctor);

        Sanctum::actingAs($doctorUser);

        $this->getJson("/api/v1/patients/{$patient->uuid}")
            ->assertOk()
            ->assertJsonPath('id', $patient->uuid);
    }

    public function test_doctor_cannot_update_unrelated_patient(): void
    {
        ['doctor' => $doctor] = $this->createDoctorUser();
        ['user' => $otherDoctorUser] = $this->createDoctorUser();
        $patient = Patient::factory()->create();

        Sanctum::actingAs($otherDoctorUser);

        $this->putJson("/api/v1/patients/{$patient->uuid}", [
            'name' => 'Hacked Name',
        ])->assertForbidden();
    }

    public function test_admin_can_view_any_patient(): void
    {
        $admin = $this->actingAsRole('admin');
        $patient = Patient::factory()->create();

        $this->getJson("/api/v1/patients/{$patient->uuid}")
            ->assertOk();
    }
}
