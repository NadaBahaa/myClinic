<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_staff_users(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        User::factory()->create(['role' => 'doctor']);
        User::factory()->create(['role' => 'superadmin']);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/users');

        $response->assertOk();
        $payload = $response->json();
        $list = $payload['data'] ?? $payload;
        $this->assertIsArray($list);
        $this->assertNotEmpty($list);
        $roles = collect($list)->pluck('role');
        $this->assertFalse($roles->contains('superadmin'));
    }
}
