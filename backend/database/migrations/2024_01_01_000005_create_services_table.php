<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('name', 150);
            $table->string('category', 80);
            $table->unsignedSmallInteger('duration')->default(60); // minutes
            $table->decimal('price', 10, 2)->default(0.00);
            $table->text('description');
            $table->boolean('popular')->default(false);
            $table->timestamps();

            $table->index('category');
            $table->index('popular');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};
