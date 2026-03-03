<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('perm_show_activity_log')->default(false)->after('perm_show_settings');
            $table->boolean('perm_show_reports')->default(false)->after('perm_show_activity_log');
            $table->boolean('perm_show_materials_tools')->default(false)->after('perm_show_reports');
            $table->boolean('perm_show_practitioner_types')->default(false)->after('perm_show_materials_tools');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'perm_show_activity_log',
                'perm_show_reports',
                'perm_show_materials_tools',
                'perm_show_practitioner_types',
            ]);
        });
    }
};
