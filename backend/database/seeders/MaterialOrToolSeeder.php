<?php

namespace Database\Seeders;

use App\Models\MaterialOrTool;
use Illuminate\Database\Seeder;

class MaterialOrToolSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            [
                'uuid'           => 'mat-00000-0000-0000-000000000001',
                'name'           => 'Hyaluronic Acid Filler',
                'type'           => 'material',
                'unit_price'     => 450.00,
                'unit'           => 'ml',
                'stock_quantity' => 50,
                'supplier'       => 'Allergan Medical',
                'notes'          => 'Keep refrigerated. Check expiry before use.',
            ],
            [
                'uuid'           => 'mat-00000-0000-0000-000000000002',
                'name'           => 'Botox Injectable',
                'type'           => 'material',
                'unit_price'     => 12.00,
                'unit'           => 'unit',
                'stock_quantity' => 500,
                'supplier'       => 'Allergan Medical',
                'notes'          => 'Botulinum toxin type A. Store at 2-8°C.',
            ],
            [
                'uuid'           => 'mat-00000-0000-0000-000000000003',
                'name'           => 'Laser Handpiece',
                'type'           => 'tool',
                'unit_price'     => 0.00,
                'unit'           => 'piece',
                'stock_quantity' => null,
                'supplier'       => 'Lumenis',
                'notes'          => 'Clean after each use. Schedule maintenance every 500 shots.',
            ],
            [
                'uuid'           => 'mat-00000-0000-0000-000000000004',
                'name'           => 'Chemical Peel Solution',
                'type'           => 'material',
                'unit_price'     => 85.00,
                'unit'           => 'ml',
                'stock_quantity' => 30,
                'supplier'       => 'PCA Skin',
                'notes'          => 'TCA peel 30%. Handle with care.',
            ],
            [
                'uuid'           => 'mat-00000-0000-0000-000000000005',
                'name'           => 'Disposable Gloves (Box)',
                'type'           => 'material',
                'unit_price'     => 0.15,
                'unit'           => 'piece',
                'stock_quantity' => 2000,
                'supplier'       => 'Medline',
                'notes'          => 'Nitrile gloves, powder-free.',
            ],
        ];

        foreach ($items as $item) {
            MaterialOrTool::updateOrCreate(['uuid' => $item['uuid']], $item);
        }
    }
}
