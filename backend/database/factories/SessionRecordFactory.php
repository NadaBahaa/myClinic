<?php

namespace Database\Factories;

use App\Models\PatientFile;
use App\Models\Service;
use App\Models\SessionRecord;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<SessionRecord> */
class SessionRecordFactory extends Factory
{
    protected $model = SessionRecord::class;

    public function definition(): array
    {
        $price = fake()->randomFloat(2, 100, 500);

        return [
            'uuid'                 => (string) Str::uuid(),
            'patient_file_id'      => PatientFile::factory(),
            'date'                 => now()->toDateString(),
            'service_name'         => fake()->words(2, true),
            'service_price'        => $price,
            'discount_amount'      => 0,
            'total_materials_cost' => 0,
            'net_profit'           => $price,
            'performed_by'         => fake()->name(),
            'notes'                => null,
        ];
    }

    public function forService(Service $service): static
    {
        return $this->state(fn () => [
            'service_id'   => $service->id,
            'service_name' => $service->name,
            'service_price'=> $service->price,
            'net_profit'   => $service->price,
        ]);
    }
}
