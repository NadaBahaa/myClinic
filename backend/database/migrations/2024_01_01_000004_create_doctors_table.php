<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('doctors', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('practitioner_type_id')->nullable()->constrained('practitioner_types')->nullOnDelete();
            $table->string('name', 150);
            $table->string('email', 191)->unique();
            $table->string('phone', 30)->nullable();
            $table->string('specialty', 100);
            $table->unsignedTinyInteger('experience')->default(0);
            $table->text('qualifications')->nullable();
            $table->string('license_number', 80)->nullable();
            $table->json('availability')->nullable(); // ["Monday","Tuesday",...]
            $table->unsignedInteger('total_patients')->default(0);
            $table->json('custom_permissions')->nullable();
            $table->timestamps();

            $table->index('specialty');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doctors');
    }
};
