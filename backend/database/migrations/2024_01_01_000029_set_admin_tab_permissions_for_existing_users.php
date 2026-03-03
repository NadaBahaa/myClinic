<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')
            ->where('role', 'admin')
            ->update([
                'perm_show_activity_log' => true,
                'perm_show_reports' => true,
                'perm_show_materials_tools' => true,
                'perm_show_practitioner_types' => true,
            ]);
    }

    public function down(): void
    {
        // No need to revert
    }
};
