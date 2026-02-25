<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('practitioner_types', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->enum('category', ['Medical', 'Aesthetic', 'Wellness', 'Dental', 'Therapeutic', 'Other'])->default('Other');
            $table->string('color', 20)->default('#6b7280');
            $table->string('icon', 50)->default('Stethoscope');
            $table->boolean('active')->default(true);

            // Permissions
            $table->boolean('perm_can_prescribe')->default(false);
            $table->boolean('perm_can_perform_surgery')->default(false);
            $table->boolean('perm_requires_assistant')->default(false);
            $table->boolean('perm_can_access_medical_records')->default(false);
            $table->boolean('perm_can_create_treatment_plans')->default(false);
            $table->boolean('perm_can_manage_inventory')->default(false);
            $table->boolean('perm_can_view_all_patients')->default(false);
            $table->boolean('perm_can_export_data')->default(false);

            // Features
            $table->boolean('feat_needs_before_after_photos')->default(false);
            $table->boolean('feat_needs_dental_chart')->default(false);
            $table->boolean('feat_needs_skin_analysis')->default(false);
            $table->boolean('feat_needs_meal_plans')->default(false);
            $table->boolean('feat_needs_exercise_plans')->default(false);
            $table->boolean('feat_needs_laser_settings')->default(false);
            $table->boolean('feat_needs_xray_management')->default(false);
            $table->boolean('feat_needs_consent_forms')->default(false);
            $table->boolean('feat_needs_progress_tracking')->default(false);
            $table->boolean('feat_needs_prescription_management')->default(false);
            $table->boolean('feat_needs_insurance_billing')->default(false);
            $table->boolean('feat_needs_product_recommendations')->default(false);

            // Scheduling rules
            $table->smallInteger('sched_default_appointment_duration')->default(60);
            $table->smallInteger('sched_buffer_time_before')->default(0);
            $table->smallInteger('sched_buffer_time_after')->default(0);
            $table->smallInteger('sched_max_appointments_per_day')->default(10);
            $table->boolean('sched_allow_double_booking')->default(false);
            $table->boolean('sched_requires_consultation')->default(false);

            // JSON arrays
            $table->json('required_certifications')->nullable();
            $table->json('allowed_service_categories')->nullable();

            $table->timestamps();

            $table->index('active');
            $table->index('category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('practitioner_types');
    }
};
