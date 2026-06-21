<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Patient;
use App\Models\PatientFile;
use App\Models\Service;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesMedicalFixtures;
use Tests\TestCase;

class AppointmentTest extends TestCase
{
    use CreatesMedicalFixtures, RefreshDatabase;

    public function test_assistant_can_create_appointment(): void
    {
        $assistant = $this->actingAsRole('assistant');
        ['doctor' => $doctor] = $this->createDoctorUser();
        $patient = Patient::factory()->create();
        $service = $this->createService();

        $response = $this->postJson('/api/v1/appointments', [
            'patientId'  => $patient->uuid,
            'doctorId'   => $doctor->uuid,
            'date'       => now()->toDateString(),
            'startTime'  => '10:00',
            'endTime'    => '11:00',
            'duration'   => 60,
            'status'     => 'scheduled',
            'services'   => [$service->uuid],
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('appointments', [
            'patient_id' => $patient->id,
            'doctor_id'  => $doctor->id,
        ]);
        $this->assertDatabaseHas('patient_files', [
            'patient_id' => $patient->id,
            'doctor_id'  => $doctor->id,
        ]);
    }

    public function test_doctor_cannot_create_appointment_for_another_doctor(): void
    {
        ['user' => $doctorUser] = $this->createDoctorUser();
        ['doctor' => $otherDoctor] = $this->createDoctorUser();
        $patient = Patient::factory()->create();
        $service = $this->createService();

        Sanctum::actingAs($doctorUser);

        $this->postJson('/api/v1/appointments', [
            'patientId'  => $patient->uuid,
            'doctorId'   => $otherDoctor->uuid,
            'date'       => now()->toDateString(),
            'startTime'  => '10:00',
            'endTime'    => '11:00',
            'duration'   => 60,
            'services'   => [$service->uuid],
        ])->assertForbidden();
    }

    public function test_doctor_cannot_view_other_doctors_appointment(): void
    {
        ['doctor' => $doctorA] = $this->createDoctorUser();
        ['user' => $doctorBUser, 'doctor' => $doctorB] = $this->createDoctorUser();

        $appointment = Appointment::factory()->create(['doctor_id' => $doctorA->id]);

        Sanctum::actingAs($doctorBUser);

        $this->getJson("/api/v1/appointments/{$appointment->uuid}")
            ->assertForbidden();
    }
}
