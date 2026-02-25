<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('name', 150);
            $table->string('email', 191)->nullable();
            $table->string('phone', 30);
            $table->date('date_of_birth')->nullable();
            $table->string('address', 255)->nullable();
            $table->string('emergency_contact', 255)->nullable();
            $table->text('notes')->nullable();
            $table->date('last_visit')->nullable();
            $table->unsignedInteger('total_visits')->default(0);
            $table->timestamps();

            $table->index('name');
            $table->index('email');
            $table->index('phone');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};
