<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('name', 150);
            $table->string('email', 191)->unique();
            $table->string('password');
            $table->enum('role', ['admin', 'doctor', 'assistant'])->default('assistant');
            $table->foreignId('practitioner_type_id')->nullable()->constrained('practitioner_types')->nullOnDelete();

            // UI permissions
            $table->boolean('perm_show_calendar')->default(false);
            $table->boolean('perm_show_patients')->default(false);
            $table->boolean('perm_show_doctors')->default(false);
            $table->boolean('perm_show_services')->default(false);
            $table->boolean('perm_show_users')->default(false);
            $table->boolean('perm_show_settings')->default(false);

            $table->rememberToken();
            $table->timestamps();

            $table->index('role');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
