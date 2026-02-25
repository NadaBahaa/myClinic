<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('session_material_usages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_record_id')->constrained('session_records')->cascadeOnDelete();
            $table->foreignId('material_id')->constrained('materials_tools')->restrictOnDelete();
            $table->string('material_name', 150); // snapshot
            $table->decimal('quantity', 10, 3)->default(1.000);
            $table->decimal('unit_price', 10, 2)->default(0.00);
            $table->decimal('total_price', 10, 2)->default(0.00);
            $table->timestamps();

            $table->index('session_record_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('session_material_usages');
    }
};
