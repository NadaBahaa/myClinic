<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_material', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->constrained('services')->cascadeOnDelete();
            $table->foreignId('material_id')->constrained('materials_tools')->cascadeOnDelete();
            $table->decimal('default_quantity', 12, 3)->default(1);
            $table->timestamps();

            $table->unique(['service_id', 'material_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_material');
    }
};
