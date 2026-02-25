<?php

namespace Database\Seeders;

use App\Models\PractitionerType;
use App\Models\Service;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        $dermatologist   = PractitionerType::where('uuid', 'pt1-0000-0000-0000-000000000001')->first();
        $laserSpecialist = PractitionerType::where('uuid', 'pt2-0000-0000-0000-000000000002')->first();
        $cosmeticSurgeon = PractitionerType::where('uuid', 'pt5-0000-0000-0000-000000000005')->first();
        $esthetician     = PractitionerType::where('uuid', 'pt7-0000-0000-0000-000000000007')->first();

        $services = [
            [
                'uuid'        => 'svc-00000-0000-0000-000000000001',
                'name'        => 'Facial Treatment',
                'category'    => 'Skincare',
                'duration'    => 60,
                'price'       => 150.00,
                'description' => 'Deep cleansing facial treatment for all skin types',
                'popular'     => true,
                'types'       => [$dermatologist?->id, $esthetician?->id],
            ],
            [
                'uuid'        => 'svc-00000-0000-0000-000000000002',
                'name'        => 'Laser Hair Removal',
                'category'    => 'Hair Removal',
                'duration'    => 60,
                'price'       => 299.00,
                'description' => 'Permanent hair reduction using advanced laser technology',
                'popular'     => true,
                'types'       => [$laserSpecialist?->id],
            ],
            [
                'uuid'        => 'svc-00000-0000-0000-000000000003',
                'name'        => 'Botox Injection',
                'category'    => 'Injectable',
                'duration'    => 30,
                'price'       => 400.00,
                'description' => 'Botulinum toxin injection for wrinkle reduction',
                'popular'     => true,
                'types'       => [$dermatologist?->id, $cosmeticSurgeon?->id],
            ],
            [
                'uuid'        => 'svc-00000-0000-0000-000000000004',
                'name'        => 'Chemical Peel',
                'category'    => 'Skincare',
                'duration'    => 45,
                'price'       => 200.00,
                'description' => 'Chemical exfoliation to improve skin texture and tone',
                'popular'     => false,
                'types'       => [$dermatologist?->id, $esthetician?->id],
            ],
            [
                'uuid'        => 'svc-00000-0000-0000-000000000005',
                'name'        => 'Microdermabrasion',
                'category'    => 'Skincare',
                'duration'    => 60,
                'price'       => 175.00,
                'description' => 'Non-invasive skin resurfacing procedure',
                'popular'     => false,
                'types'       => [$esthetician?->id],
            ],
            [
                'uuid'        => 'svc-00000-0000-0000-000000000006',
                'name'        => 'Dermal Fillers',
                'category'    => 'Injectable',
                'duration'    => 45,
                'price'       => 600.00,
                'description' => 'Hyaluronic acid fillers for volume restoration',
                'popular'     => true,
                'types'       => [$dermatologist?->id, $cosmeticSurgeon?->id],
            ],
        ];

        foreach ($services as $data) {
            $types = $data['types'] ?? [];
            unset($data['types']);

            $service = Service::updateOrCreate(['uuid' => $data['uuid']], $data);
            $service->practitionerTypes()->sync(array_filter($types));
        }
    }
}
