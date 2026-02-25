<?php

namespace App\Http\Requests\PractitionerType;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePractitionerTypeRequest extends FormRequest
{
    public function authorize(): bool { return $this->user()?->role === 'admin'; }

    public function rules(): array
    {
        return [
            'name'        => 'sometimes|string|max:100',
            'description' => 'nullable|string|max:500',
            'category'    => 'sometimes|in:Medical,Aesthetic,Wellness,Dental,Therapeutic,Other',
            'color'       => 'sometimes|string|max:20',
            'icon'        => 'sometimes|string|max:50',
            'active'      => 'boolean',

            'permissions'                            => 'sometimes|array',
            'permissions.canPrescribe'               => 'boolean',
            'permissions.canPerformSurgery'          => 'boolean',
            'permissions.requiresAssistant'          => 'boolean',
            'permissions.canAccessMedicalRecords'    => 'boolean',
            'permissions.canCreateTreatmentPlans'    => 'boolean',
            'permissions.canManageInventory'         => 'boolean',
            'permissions.canViewAllPatients'         => 'boolean',
            'permissions.canExportData'              => 'boolean',

            'features'                               => 'sometimes|array',
            'features.needsBeforeAfterPhotos'        => 'boolean',
            'features.needsDentalChart'              => 'boolean',
            'features.needsSkinAnalysis'             => 'boolean',
            'features.needsMealPlans'                => 'boolean',
            'features.needsExercisePlans'            => 'boolean',
            'features.needsLaserSettings'            => 'boolean',
            'features.needsXrayManagement'           => 'boolean',
            'features.needsConsentForms'             => 'boolean',
            'features.needsProgressTracking'         => 'boolean',
            'features.needsPrescriptionManagement'   => 'boolean',
            'features.needsInsuranceBilling'         => 'boolean',
            'features.needsProductRecommendations'   => 'boolean',

            'schedulingRules'                            => 'sometimes|array',
            'schedulingRules.defaultAppointmentDuration' => 'integer|min:5|max:480',
            'schedulingRules.bufferTimeBefore'           => 'integer|min:0|max:120',
            'schedulingRules.bufferTimeAfter'            => 'integer|min:0|max:120',
            'schedulingRules.maxAppointmentsPerDay'      => 'integer|min:1|max:50',
            'schedulingRules.allowDoubleBooking'         => 'boolean',
            'schedulingRules.requiresConsultation'       => 'boolean',

            'requiredCertifications'     => 'nullable|array',
            'requiredCertifications.*'   => 'string|max:200',
            'allowedServiceCategories'   => 'nullable|array',
            'allowedServiceCategories.*' => 'string|max:80',
        ];
    }
}
