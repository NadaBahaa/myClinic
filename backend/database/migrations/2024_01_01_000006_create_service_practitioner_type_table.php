<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_practitioner_type', function (Blueprint $table) {
            $table->foreignId('service_id')->constrained('services')->cascadeOnDelete();
            $table->foreignId('practitioner_type_id')->constrained('practitioner_types')->cascadeOnDelete();
            $table->primary(['service_id', 'practitioner_type_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_practitioner_type');
    }
};
