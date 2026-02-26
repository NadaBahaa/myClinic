<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('doctor_material', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_id')->constrained('doctors')->cascadeOnDelete();
            $table->foreignId('material_id')->constrained('materials_tools')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['doctor_id', 'material_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doctor_material');
    }
};
