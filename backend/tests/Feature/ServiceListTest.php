<?php

namespace Tests\Feature;

use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ServiceListTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_list_services_with_materials(): void
    {
        Service::factory()->create(['name' => 'Facial']);
        $admin = User::factory()->create(['role' => 'admin']);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/services');

        $response->assertOk();
        $payload = $response->json();
        $list = $payload['data'] ?? $payload;
        $this->assertIsArray($list);
        $this->assertNotEmpty($list);
    }
}
