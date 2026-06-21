<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'uuid'              => (string) Str::uuid(),
            'name'              => fake()->name(),
            'email'             => fake()->unique()->safeEmail(),
            'password'          => static::$password ??= Hash::make('password'),
            'role'              => 'assistant',
            'is_active'         => true,
            'perm_show_calendar' => true,
            'perm_show_patients' => true,
        ];
    }

    public function admin(): static
    {
        return $this->state(fn () => ['role' => 'admin']);
    }

    public function doctor(): static
    {
        return $this->state(fn () => ['role' => 'doctor']);
    }

    public function assistant(): static
    {
        return $this->state(fn () => ['role' => 'assistant']);
    }

    public function accountant(): static
    {
        return $this->state(fn () => ['role' => 'accountant', 'perm_show_reports' => true]);
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
