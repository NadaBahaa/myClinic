<?php

namespace Tests\Feature;

use App\Models\PatientFile;
use App\Models\SessionRecord;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesMedicalFixtures;
use Tests\TestCase;

class SessionRecordTest extends TestCase
{
    use CreatesMedicalFixtures, RefreshDatabase;

    public function test_doctor_can_create_session_on_own_patient_file(): void
    {
        ['user' => $doctorUser, 'doctor' => $doctor] = $this->createDoctorUser();
        ['patient' => $patient, 'file' => $file] = $this->createPatientWithFileForDoctor($doctor);
        $service = $this->createService();

        Sanctum::actingAs($doctorUser);

        $this->postJson("/api/v1/patient-files/{$file->uuid}/sessions", [
            'date'         => now()->toDateString(),
            'serviceId'    => $service->uuid,
            'serviceName'  => $service->name,
            'servicePrice' => $service->price,
            'performedBy'  => $doctor->name,
            'materialsUsed'=> [],
        ])->assertCreated();

        $this->assertDatabaseHas('session_records', [
            'patient_file_id' => $file->id,
            'service_name'    => $service->name,
        ]);
    }

    public function test_doctor_cannot_list_sessions_on_other_doctors_file(): void
    {
        ['doctor' => $doctorA] = $this->createDoctorUser();
        ['user' => $doctorBUser, 'doctor' => $doctorB] = $this->createDoctorUser();
        ['file' => $fileA] = $this->createPatientWithFileForDoctor($doctorA);

        Sanctum::actingAs($doctorBUser);

        $this->getJson("/api/v1/patient-files/{$fileA->uuid}/sessions")
            ->assertForbidden();
    }

    public function test_doctor_cannot_view_session_on_other_doctors_file(): void
    {
        ['doctor' => $doctorA] = $this->createDoctorUser();
        ['user' => $doctorBUser] = $this->createDoctorUser();
        ['file' => $fileA] = $this->createPatientWithFileForDoctor($doctorA);

        $session = SessionRecord::factory()->create(['patient_file_id' => $fileA->id]);

        Sanctum::actingAs($doctorBUser);

        $this->getJson("/api/v1/patient-files/{$fileA->uuid}/sessions/{$session->uuid}")
            ->assertForbidden();
    }
}
