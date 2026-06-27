<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Service;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesMedicalFixtures;
use Tests\TestCase;

class AppointmentCheckoutTest extends TestCase
{
    use CreatesMedicalFixtures, RefreshDatabase;

    public function test_assistant_can_checkout_when_session_started(): void
    {
        $assistant = $this->actingAsRole('assistant');
        ['doctor' => $doctor] = $this->createDoctorUser();
        $patient = \App\Models\Patient::factory()->create();
        $service = Service::factory()->create(['price' => 150]);

        $appointment = Appointment::factory()->create([
            'patient_id' => $patient->id,
            'doctor_id'  => $doctor->id,
            'date'       => now()->toDateString(),
            'start_time' => now()->subHour()->format('H:i'),
            'end_time'   => now()->addHour()->format('H:i'),
            'status'     => 'scheduled',
        ]);
        $appointment->services()->attach($service->id, ['service_name' => $service->name]);

        $response = $this->postJson("/api/v1/appointments/{$appointment->uuid}/checkout");

        $response->assertOk()
            ->assertJsonPath('sessionRecord.servicePrice', 150)
            ->assertJsonPath('appointment.isPaid', true);

        $this->assertDatabaseHas('session_records', [
            'appointment_id' => $appointment->id,
            'service_price'  => 150,
        ]);
        $this->assertDatabaseHas('appointments', [
            'id'     => $appointment->id,
            'status' => 'completed',
        ]);
    }

    public function test_checkout_rejected_before_session_start(): void
    {
        $this->actingAsRole('assistant');
        ['doctor' => $doctor] = $this->createDoctorUser();
        $patient = \App\Models\Patient::factory()->create();
        $service = $this->createService();

        $appointment = Appointment::factory()->create([
            'patient_id' => $patient->id,
            'doctor_id'  => $doctor->id,
            'date'       => now()->toDateString(),
            'start_time' => now()->addHours(2)->format('H:i'),
            'end_time'   => now()->addHours(3)->format('H:i'),
            'status'     => 'scheduled',
        ]);
        $appointment->services()->attach($service->id, ['service_name' => $service->name]);

        $this->postJson("/api/v1/appointments/{$appointment->uuid}/checkout")
            ->assertStatus(422);
    }

    public function test_cannot_checkout_twice(): void
    {
        $this->actingAsRole('assistant');
        ['doctor' => $doctor] = $this->createDoctorUser();
        $patient = \App\Models\Patient::factory()->create();
        $service = $this->createService();

        $appointment = Appointment::factory()->create([
            'patient_id' => $patient->id,
            'doctor_id'  => $doctor->id,
            'date'       => now()->toDateString(),
            'start_time' => now()->subHour()->format('H:i'),
            'end_time'   => now()->addHour()->format('H:i'),
            'status'     => 'scheduled',
        ]);
        $appointment->services()->attach($service->id, ['service_name' => $service->name]);

        $this->postJson("/api/v1/appointments/{$appointment->uuid}/checkout")->assertOk();
        $this->postJson("/api/v1/appointments/{$appointment->uuid}/checkout")->assertStatus(422);
    }

    public function test_assistant_can_update_and_cancel_appointment(): void
    {
        $this->actingAsRole('assistant');
        ['doctor' => $doctor] = $this->createDoctorUser();
        $patient = \App\Models\Patient::factory()->create();
        $service = $this->createService();

        $appointment = Appointment::factory()->create([
            'patient_id' => $patient->id,
            'doctor_id'  => $doctor->id,
            'status'     => 'scheduled',
        ]);
        $appointment->services()->attach($service->id, ['service_name' => $service->name]);

        $this->putJson("/api/v1/appointments/{$appointment->uuid}", [
            'notes' => 'Updated by assistant',
        ])->assertOk()->assertJsonPath('notes', 'Updated by assistant');

        $this->deleteJson("/api/v1/appointments/{$appointment->uuid}")
            ->assertOk();

        $this->assertSoftDeleted('appointments', ['id' => $appointment->id]);
    }
}
