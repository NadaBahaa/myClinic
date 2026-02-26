<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // MySQL: modify enum to add 'accountant'
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'doctor', 'assistant', 'accountant') DEFAULT 'assistant'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'doctor', 'assistant') DEFAULT 'assistant'");
    }
};
