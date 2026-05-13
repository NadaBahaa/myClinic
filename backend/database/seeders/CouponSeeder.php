<?php

namespace Database\Seeders;

use App\Models\Coupon;
use Illuminate\Database\Seeder;

class CouponSeeder extends Seeder
{
    public function run(): void
    {
        Coupon::updateOrCreate(
            ['code' => 'TEST10'],
            [
                'uuid'             => 'coupon-0000-0000-0000-000000000001',
                'description'      => 'Seeded test coupon (10% off)',
                'discount_type'    => Coupon::TYPE_PERCENT,
                'discount_value'   => 10,
                'max_discount_amount' => null,
                'starts_at'        => null,
                'ends_at'          => null,
                'max_uses'         => null,
                'uses_count'       => 0,
                'is_active'        => true,
            ]
        );
    }
}
