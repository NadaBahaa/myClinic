<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class PractitionerType extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'uuid', 'name', 'description', 'category', 'color', 'icon', 'active',
        // permissions
        'perm_can_prescribe', 'perm_can_perform_surgery', 'perm_requires_assistant',
        'perm_can_access_medical_records', 'perm_can_create_treatment_plans',
        'perm_can_manage_inventory', 'perm_can_view_all_patients', 'perm_can_export_data',
        // features
        'feat_needs_before_after_photos', 'feat_needs_dental_chart', 'feat_needs_skin_analysis',
        'feat_needs_meal_plans', 'feat_needs_exercise_plans', 'feat_needs_laser_settings',
        'feat_needs_xray_management', 'feat_needs_consent_forms', 'feat_needs_progress_tracking',
        'feat_needs_prescription_management', 'feat_needs_insurance_billing',
        'feat_needs_product_recommendations',
        // scheduling
        'sched_default_appointment_duration', 'sched_buffer_time_before', 'sched_buffer_time_after',
        'sched_max_appointments_per_day', 'sched_allow_double_booking', 'sched_requires_consultation',
        // json
        'required_certifications', 'allowed_service_categories',
    ];

    protected $casts = [
        'active'                              => 'boolean',
        'required_certifications'             => 'array',
        'allowed_service_categories'          => 'array',
        'perm_can_prescribe'                  => 'boolean',
        'perm_can_perform_surgery'            => 'boolean',
        'perm_requires_assistant'             => 'boolean',
        'perm_can_access_medical_records'     => 'boolean',
        'perm_can_create_treatment_plans'     => 'boolean',
        'perm_can_manage_inventory'           => 'boolean',
        'perm_can_view_all_patients'          => 'boolean',
        'perm_can_export_data'                => 'boolean',
        'feat_needs_before_after_photos'      => 'boolean',
        'feat_needs_dental_chart'             => 'boolean',
        'feat_needs_skin_analysis'            => 'boolean',
        'feat_needs_meal_plans'               => 'boolean',
        'feat_needs_exercise_plans'           => 'boolean',
        'feat_needs_laser_settings'           => 'boolean',
        'feat_needs_xray_management'          => 'boolean',
        'feat_needs_consent_forms'            => 'boolean',
        'feat_needs_progress_tracking'        => 'boolean',
        'feat_needs_prescription_management'  => 'boolean',
        'feat_needs_insurance_billing'        => 'boolean',
        'feat_needs_product_recommendations'  => 'boolean',
        'sched_allow_double_booking'          => 'boolean',
        'sched_requires_consultation'         => 'boolean',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(static function ($model) {
            $model->uuid ??= (string) Str::uuid();
        });
    }

    // Accessors that map flat DB columns to nested objects matching TypeScript interfaces

    public function getPermissionsAttribute(): array
    {
        return [
            'canPrescribe'            => $this->perm_can_prescribe,
            'canPerformSurgery'       => $this->perm_can_perform_surgery,
            'requiresAssistant'       => $this->perm_requires_assistant,
            'canAccessMedicalRecords' => $this->perm_can_access_medical_records,
            'canCreateTreatmentPlans' => $this->perm_can_create_treatment_plans,
            'canManageInventory'      => $this->perm_can_manage_inventory,
            'canViewAllPatients'      => $this->perm_can_view_all_patients,
            'canExportData'           => $this->perm_can_export_data,
        ];
    }

    public function getFeaturesAttribute(): array
    {
        return [
            'needsBeforeAfterPhotos'      => $this->feat_needs_before_after_photos,
            'needsDentalChart'            => $this->feat_needs_dental_chart,
            'needsSkinAnalysis'           => $this->feat_needs_skin_analysis,
            'needsMealPlans'              => $this->feat_needs_meal_plans,
            'needsExercisePlans'          => $this->feat_needs_exercise_plans,
            'needsLaserSettings'          => $this->feat_needs_laser_settings,
            'needsXrayManagement'         => $this->feat_needs_xray_management,
            'needsConsentForms'           => $this->feat_needs_consent_forms,
            'needsProgressTracking'       => $this->feat_needs_progress_tracking,
            'needsPrescriptionManagement' => $this->feat_needs_prescription_management,
            'needsInsuranceBilling'       => $this->feat_needs_insurance_billing,
            'needsProductRecommendations' => $this->feat_needs_product_recommendations,
        ];
    }

    public function getSchedulingRulesAttribute(): array
    {
        return [
            'defaultAppointmentDuration' => $this->sched_default_appointment_duration,
            'bufferTimeBefore'           => $this->sched_buffer_time_before,
            'bufferTimeAfter'            => $this->sched_buffer_time_after,
            'maxAppointmentsPerDay'      => $this->sched_max_appointments_per_day,
            'allowDoubleBooking'         => $this->sched_allow_double_booking,
            'requiresConsultation'       => $this->sched_requires_consultation,
        ];
    }

    public function services()
    {
        return $this->belongsToMany(Service::class, 'service_practitioner_type');
    }

    public function doctors()
    {
        return $this->hasMany(Doctor::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }
}
