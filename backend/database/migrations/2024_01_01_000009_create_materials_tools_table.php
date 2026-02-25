<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('materials_tools', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('name', 150);
            $table->enum('type', ['material', 'tool'])->default('material');
            $table->decimal('unit_price', 10, 2)->default(0.00);
            $table->string('unit', 30)->default('piece');
            $table->integer('stock_quantity')->nullable(); // null = untracked (tools)
            $table->string('supplier', 150)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('type');
            $table->index('name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('materials_tools');
    }
};
