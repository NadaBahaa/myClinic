<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('system_modules', function (Blueprint $table) {
            $table->json('enabled_for_roles')->nullable()->after('enabled');
        });

        $roles = ['admin', 'doctor', 'assistant', 'accountant'];
        foreach (DB::table('system_modules')->get() as $row) {
            $enabled = (bool) $row->enabled;
            $payload = array_combine($roles, array_fill(0, count($roles), $enabled));
            DB::table('system_modules')->where('id', $row->id)->update([
                'enabled_for_roles' => json_encode($payload),
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('system_modules', function (Blueprint $table) {
            $table->dropColumn('enabled_for_roles');
        });
    }
};
