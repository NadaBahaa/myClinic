<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notification_records', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('patient_id')->constrained('patients')->cascadeOnDelete();
            $table->foreignId('appointment_id')->constrained('appointments')->cascadeOnDelete();
            $table->enum('type', ['reminder', 'confirmation'])->default('reminder');
            $table->timestamp('sent_at')->useCurrent();
            $table->string('sent_by', 150);
            $table->enum('method', ['email', 'sms', 'whatsapp'])->default('email');
            $table->enum('status', ['sent', 'failed'])->default('sent');
            $table->timestamps();

            $table->index('patient_id');
            $table->index('appointment_id');
            $table->index('sent_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_records');
    }
};
