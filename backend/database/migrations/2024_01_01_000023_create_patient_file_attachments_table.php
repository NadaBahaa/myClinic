<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patient_file_attachments', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('patient_file_id')->constrained('patient_files')->cascadeOnDelete();
            $table->foreignId('session_record_id')->nullable()->constrained('session_records')->nullOnDelete();
            $table->string('name', 255);
            $table->string('path', 500);
            $table->string('mime_type', 100)->nullable();
            $table->unsignedBigInteger('uploaded_by_user_id')->nullable();
            $table->timestamps();

            $table->index('patient_file_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patient_file_attachments');
    }
};
