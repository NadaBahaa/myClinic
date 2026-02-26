<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_modules', function (Blueprint $table) {
            $table->id();
            $table->string('key', 80)->unique();
            $table->string('name', 150);
            $table->string('description', 255)->nullable();
            $table->boolean('enabled')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        $modules = [
            ['key' => 'calendar', 'name' => 'Calendar', 'description' => 'Appointments and schedule', 'enabled' => true, 'sort_order' => 1],
            ['key' => 'patients', 'name' => 'Patients', 'description' => 'Patient management', 'enabled' => true, 'sort_order' => 2],
            ['key' => 'doctors', 'name' => 'Doctors', 'description' => 'Doctors and practitioners', 'enabled' => true, 'sort_order' => 3],
            ['key' => 'services', 'name' => 'Services', 'description' => 'Services catalog', 'enabled' => true, 'sort_order' => 4],
            ['key' => 'materials_tools', 'name' => 'Materials & Tools', 'description' => 'Inventory and tools', 'enabled' => true, 'sort_order' => 5],
            ['key' => 'practitioner_types', 'name' => 'Practitioner Types', 'description' => 'Practitioner type config', 'enabled' => true, 'sort_order' => 6],
            ['key' => 'users', 'name' => 'Users', 'description' => 'User management', 'enabled' => true, 'sort_order' => 7],
            ['key' => 'reports', 'name' => 'Sales & Reports', 'description' => 'Financial reports and export', 'enabled' => true, 'sort_order' => 8],
            ['key' => 'activity_log', 'name' => 'Activity Log', 'description' => 'Audit trail', 'enabled' => true, 'sort_order' => 9],
            ['key' => 'settings', 'name' => 'Settings', 'description' => 'System settings', 'enabled' => true, 'sort_order' => 10],
            ['key' => 'notifications', 'name' => 'Notifications', 'description' => 'Reminders and notifications', 'enabled' => true, 'sort_order' => 11],
        ];
        foreach ($modules as $m) {
            DB::table('system_modules')->insert(array_merge($m, ['created_at' => now(), 'updated_at' => now()]));
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('system_modules');
    }
};
