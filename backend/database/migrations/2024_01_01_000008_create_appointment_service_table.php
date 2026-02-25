<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointment_service', function (Blueprint $table) {
            $table->foreignId('appointment_id')->constrained('appointments')->cascadeOnDelete();
            $table->foreignId('service_id')->constrained('services')->restrictOnDelete();
            $table->string('service_name', 150); // snapshot at booking time
            $table->primary(['appointment_id', 'service_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointment_service');
    }
};
