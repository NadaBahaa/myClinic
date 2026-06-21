<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesMedicalFixtures;
use Tests\TestCase;

class AuthLoginTest extends TestCase
{
    use CreatesMedicalFixtures, RefreshDatabase;

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->admin()->create([
            'email'    => 'admin@test.com',
            'password' => 'secret123',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email'    => 'admin@test.com',
            'password' => 'secret123',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['token', 'user' => ['id', 'email', 'role']])
            ->assertJsonPath('user.role', 'admin');
    }

    public function test_login_rejects_invalid_credentials(): void
    {
        User::factory()->admin()->create(['email' => 'admin@test.com']);

        $this->postJson('/api/v1/auth/login', [
            'email'    => 'admin@test.com',
            'password' => 'wrong-password',
        ])->assertUnauthorized();
    }

    public function test_inactive_user_cannot_login(): void
    {
        User::factory()->admin()->inactive()->create([
            'email'    => 'inactive@test.com',
            'password' => 'secret123',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email'    => 'inactive@test.com',
            'password' => 'secret123',
        ])->assertForbidden();
    }
}
