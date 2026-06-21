<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\NotificationRecord;
use App\Models\Patient;
use App\Models\PatientFile;
use App\Models\Service;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesMedicalFixtures;
use Tests\TestCase;

class MedicalDataIsolationTest extends TestCase
{
    use CreatesMedicalFixtures, RefreshDatabase;

    public function test_accountant_cannot_list_patients(): void
    {
        $this->actingAsRole('accountant');
        Patient::factory()->create();

        $this->getJson('/api/v1/patients')->assertForbidden();
    }

    public function test_accountant_cannot_view_patient_record(): void
    {
        $this->actingAsRole('accountant');
        $patient = Patient::factory()->create();

        $this->getJson("/api/v1/patients/{$patient->uuid}")->assertForbidden();
    }

    public function test_accountant_cannot_list_appointments_with_pii(): void
    {
        $this->actingAsRole('accountant');
        Appointment::factory()->create();

        $this->getJson('/api/v1/appointments')->assertForbidden();
    }

    public function test_accountant_cannot_access_patient_files(): void
    {
        $this->actingAsRole('accountant');
        $patient = Patient::factory()->create();
        ['doctor' => $doctor] = $this->createDoctorUser();
        PatientFile::factory()->create([
            'patient_id' => $patient->id,
            'doctor_id'  => $doctor->id,
        ]);

        $this->getJson("/api/v1/patients/{$patient->uuid}/files")->assertForbidden();
    }

    public function test_accountant_cannot_access_notification_history(): void
    {
        $this->actingAsRole('accountant');
        NotificationRecord::factory()->create();

        $this->getJson('/api/v1/notifications')->assertForbidden();
    }

    public function test_doctor_cannot_book_patient_assigned_to_another_doctor(): void
    {
        ['doctor' => $doctorA] = $this->createDoctorUser();
        ['user' => $doctorBUser, 'doctor' => $doctorB] = $this->createDoctorUser();

        $patient = Patient::factory()->create();
        PatientFile::factory()->create([
            'patient_id' => $patient->id,
            'doctor_id'  => $doctorA->id,
        ]);
        $service = Service::factory()->create();

        Sanctum::actingAs($doctorBUser);

        $this->postJson('/api/v1/appointments', [
            'patientId'  => $patient->uuid,
            'doctorId'   => $doctorB->uuid,
            'date'       => now()->toDateString(),
            'startTime'  => '10:00',
            'endTime'    => '11:00',
            'duration'   => 60,
            'services'   => [$service->uuid],
        ])->assertForbidden();
    }

    public function test_doctor_sees_only_own_notifications(): void
    {
        ['doctor' => $doctorA] = $this->createDoctorUser();
        ['user' => $doctorBUser, 'doctor' => $doctorB] = $this->createDoctorUser();

        $appointmentA = Appointment::factory()->create(['doctor_id' => $doctorA->id]);
        $appointmentB = Appointment::factory()->create(['doctor_id' => $doctorB->id]);

        NotificationRecord::factory()->create([
            'patient_id'     => $appointmentA->patient_id,
            'appointment_id' => $appointmentA->id,
        ]);
        NotificationRecord::factory()->create([
            'patient_id'     => $appointmentB->patient_id,
            'appointment_id' => $appointmentB->id,
        ]);

        Sanctum::actingAs($doctorBUser);

        $response = $this->getJson('/api/v1/notifications')->assertOk();
        $payload = $response->json();

        $this->assertCount(1, $payload);
    }

    public function test_doctor_cannot_open_other_doctors_patient_file(): void
    {
        ['doctor' => $doctorA] = $this->createDoctorUser();
        ['user' => $doctorBUser, 'doctor' => $doctorB] = $this->createDoctorUser();
        $patient = Patient::factory()->create();
        PatientFile::factory()->create([
            'patient_id' => $patient->id,
            'doctor_id'  => $doctorA->id,
        ]);

        Sanctum::actingAs($doctorBUser);

        $this->getJson("/api/v1/patients/{$patient->uuid}/files/{$doctorA->uuid}")
            ->assertForbidden();
    }
}
