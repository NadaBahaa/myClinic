<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patient_photos', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('patient_file_id')->constrained('patient_files')->cascadeOnDelete();
            $table->foreignId('session_id')->nullable()->constrained('session_records')->nullOnDelete();
            $table->string('url', 500);
            $table->enum('type', ['before', 'after', 'during'])->default('before');
            $table->string('uploaded_by', 150);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('patient_file_id');
            $table->index('type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patient_photos');
    }
};
