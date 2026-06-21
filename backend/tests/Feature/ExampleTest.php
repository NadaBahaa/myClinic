<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    public function test_api_login_route_is_registered(): void
    {
        $this->postJson('/api/v1/auth/login', [
            'email'    => 'missing@test.com',
            'password' => 'wrong-password',
        ])->assertUnauthorized();
    }
}
