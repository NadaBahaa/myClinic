<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('session_records', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('patient_file_id')->constrained('patient_files')->cascadeOnDelete();
            $table->foreignId('appointment_id')->nullable()->constrained('appointments')->nullOnDelete();
            $table->date('date');
            $table->foreignId('service_id')->nullable()->constrained('services')->nullOnDelete();
            $table->string('service_name', 150);
            $table->decimal('service_price', 10, 2)->default(0.00);
            $table->decimal('total_materials_cost', 10, 2)->default(0.00);
            $table->decimal('net_profit', 10, 2)->default(0.00);
            $table->string('performed_by', 150);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('patient_file_id');
            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('session_records');
    }
};
