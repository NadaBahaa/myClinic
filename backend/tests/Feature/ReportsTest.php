<?php

namespace Tests\Feature;

use App\Models\SessionRecord;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\CreatesMedicalFixtures;
use Tests\TestCase;

class ReportsTest extends TestCase
{
    use CreatesMedicalFixtures, RefreshDatabase;

    public function test_accountant_can_access_financial_reports(): void
    {
        $this->actingAsRole('accountant');
        SessionRecord::factory()->create();

        $this->getJson('/api/v1/reports/financial')
            ->assertOk()
            ->assertJsonStructure(['summary', 'by_doctor', 'by_service']);
    }

    public function test_doctor_cannot_access_financial_reports(): void
    {
        ['user' => $doctorUser] = $this->createDoctorUser();
        Sanctum::actingAs($doctorUser);

        $this->getJson('/api/v1/reports/financial')
            ->assertForbidden();
    }

    public function test_assistant_cannot_export_sessions(): void
    {
        $this->actingAsRole('assistant');

        $this->getJson('/api/v1/reports/sessions/export')
            ->assertForbidden();
    }
}
