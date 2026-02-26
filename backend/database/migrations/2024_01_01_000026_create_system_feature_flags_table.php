<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_feature_flags', function (Blueprint $table) {
            $table->id();
            $table->string('key', 80)->unique();
            $table->string('module_key', 80);
            $table->string('label', 150);
            $table->string('description', 255)->nullable();
            $table->boolean('enabled')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        $flags = [
            ['key' => 'calendar_drag_drop', 'module_key' => 'calendar', 'label' => 'Drag & drop appointments', 'description' => 'Reschedule by dragging', 'enabled' => true, 'sort_order' => 1],
            ['key' => 'patients_export', 'module_key' => 'patients', 'label' => 'Export patients', 'description' => 'Export patient list', 'enabled' => true, 'sort_order' => 1],
            ['key' => 'reports_edit_session', 'module_key' => 'reports', 'label' => 'Edit session amounts', 'description' => 'Accountant can correct session prices', 'enabled' => true, 'sort_order' => 1],
            ['key' => 'reports_export_csv', 'module_key' => 'reports', 'label' => 'Export CSV', 'description' => 'Download sales as CSV', 'enabled' => true, 'sort_order' => 2],
            ['key' => 'doctor_attachments', 'module_key' => 'patients', 'label' => 'Patient file attachments', 'description' => 'Doctors can upload attachments per patient', 'enabled' => true, 'sort_order' => 2],
            ['key' => 'appointment_notifications', 'module_key' => 'notifications', 'label' => 'Appointment reminders', 'description' => 'Send reminders before appointments', 'enabled' => true, 'sort_order' => 1],
        ];
        foreach ($flags as $f) {
            DB::table('system_feature_flags')->insert(array_merge($f, ['created_at' => now(), 'updated_at' => now()]));
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('system_feature_flags');
    }
};
