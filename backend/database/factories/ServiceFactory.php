<?php

namespace Database\Factories;

use App\Models\Service;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Service> */
class ServiceFactory extends Factory
{
    protected $model = Service::class;

    public function definition(): array
    {
        return [
            'uuid'        => (string) Str::uuid(),
            'name'        => fake()->words(2, true),
            'category'    => fake()->word(),
            'duration'    => 60,
            'price'       => fake()->randomFloat(2, 50, 500),
            'description' => fake()->sentence(),
            'popular'     => false,
        ];
    }
}
