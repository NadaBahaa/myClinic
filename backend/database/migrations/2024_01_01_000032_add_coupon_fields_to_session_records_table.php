<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('session_records', function (Blueprint $table) {
            $table->foreignId('coupon_id')->nullable()->after('service_id')->constrained('coupons')->nullOnDelete();
            $table->decimal('discount_amount', 10, 2)->default(0.00)->after('service_price');
            $table->decimal('original_service_price', 10, 2)->nullable()->after('discount_amount');
        });
    }

    public function down(): void
    {
        Schema::table('session_records', function (Blueprint $table) {
            $table->dropForeign(['coupon_id']);
            $table->dropColumn(['coupon_id', 'discount_amount', 'original_service_price']);
        });
    }
};
