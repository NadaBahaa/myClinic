<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prescriptions', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('patient_file_id')->constrained('patient_files')->cascadeOnDelete();
            $table->string('name', 200);
            $table->string('dosage', 100)->nullable();
            $table->string('frequency', 100)->nullable();
            $table->string('duration', 100)->nullable();
            $table->string('url', 500)->nullable(); // uploaded file
            $table->string('prescribed_by', 150);
            $table->text('notes')->nullable();
            $table->timestamps(); // created_at = prescribed_at

            $table->index('patient_file_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prescriptions');
    }
};
