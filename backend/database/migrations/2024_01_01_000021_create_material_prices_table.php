<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('material_prices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('material_id')->constrained('materials_tools')->cascadeOnDelete();
            $table->string('vendor', 150)->nullable();
            $table->string('price_type', 50)->nullable(); // e.g. retail, wholesale, clinic
            $table->decimal('unit_price', 10, 2)->default(0.00);
            $table->date('effective_from')->nullable();
            $table->timestamps();

            $table->index(['material_id', 'vendor', 'price_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('material_prices');
    }
};
