<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\PractitionerType\StorePractitionerTypeRequest;
use App\Http\Requests\PractitionerType\UpdatePractitionerTypeRequest;
use App\Http\Resources\PractitionerTypeResource;
use App\Models\PractitionerType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PractitionerTypeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = PractitionerType::query();

        if ($request->boolean('active_only', false)) {
            $query->where('active', true);
        }

        return response()->json(PractitionerTypeResource::collection($query->get()));
    }

    public function store(StorePractitionerTypeRequest $request): JsonResponse
    {
        $pt = PractitionerType::create($this->mapRequestToColumns($request));

        return response()->json(new PractitionerTypeResource($pt), 201);
    }

    public function show(string $uuid): JsonResponse
    {
        $pt = PractitionerType::where('uuid', $uuid)->firstOrFail();

        return response()->json(new PractitionerTypeResource($pt));
    }

    public function update(UpdatePractitionerTypeRequest $request, string $uuid): JsonResponse
    {
        $pt = PractitionerType::where('uuid', $uuid)->firstOrFail();
        $pt->update($this->mapRequestToColumns($request));

        return response()->json(new PractitionerTypeResource($pt));
    }

    public function destroy(string $uuid): JsonResponse
    {
        $pt = PractitionerType::where('uuid', $uuid)->firstOrFail();
        $pt->delete();

        return response()->json(['message' => 'Practitioner type deleted']);
    }

    private function mapRequestToColumns($request): array
    {
        $data = [];

        // Top-level fields
        foreach (['name', 'description', 'category', 'color', 'icon', 'active'] as $field) {
            if ($request->has($field)) $data[$field] = $request->$field;
        }

        // Permissions
        if ($request->has('permissions')) {
            $p = $request->permissions;
            $data['perm_can_prescribe']               = $p['canPrescribe']             ?? false;
            $data['perm_can_perform_surgery']         = $p['canPerformSurgery']        ?? false;
            $data['perm_requires_assistant']          = $p['requiresAssistant']        ?? false;
            $data['perm_can_access_medical_records']  = $p['canAccessMedicalRecords']  ?? false;
            $data['perm_can_create_treatment_plans']  = $p['canCreateTreatmentPlans']  ?? false;
            $data['perm_can_manage_inventory']        = $p['canManageInventory']       ?? false;
            $data['perm_can_view_all_patients']       = $p['canViewAllPatients']       ?? false;
            $data['perm_can_export_data']             = $p['canExportData']            ?? false;
        }

        // Features
        if ($request->has('features')) {
            $f = $request->features;
            $data['feat_needs_before_after_photos']     = $f['needsBeforeAfterPhotos']      ?? false;
            $data['feat_needs_dental_chart']            = $f['needsDentalChart']             ?? false;
            $data['feat_needs_skin_analysis']           = $f['needsSkinAnalysis']            ?? false;
            $data['feat_needs_meal_plans']              = $f['needsMealPlans']               ?? false;
            $data['feat_needs_exercise_plans']          = $f['needsExercisePlans']           ?? false;
            $data['feat_needs_laser_settings']          = $f['needsLaserSettings']           ?? false;
            $data['feat_needs_xray_management']         = $f['needsXrayManagement']          ?? false;
            $data['feat_needs_consent_forms']           = $f['needsConsentForms']            ?? false;
            $data['feat_needs_progress_tracking']       = $f['needsProgressTracking']        ?? false;
            $data['feat_needs_prescription_management'] = $f['needsPrescriptionManagement']  ?? false;
            $data['feat_needs_insurance_billing']       = $f['needsInsuranceBilling']        ?? false;
            $data['feat_needs_product_recommendations'] = $f['needsProductRecommendations']  ?? false;
        }

        // Scheduling rules
        if ($request->has('schedulingRules')) {
            $s = $request->schedulingRules;
            $data['sched_default_appointment_duration'] = $s['defaultAppointmentDuration'] ?? 60;
            $data['sched_buffer_time_before']           = $s['bufferTimeBefore']           ?? 0;
            $data['sched_buffer_time_after']            = $s['bufferTimeAfter']            ?? 0;
            $data['sched_max_appointments_per_day']     = $s['maxAppointmentsPerDay']      ?? 10;
            $data['sched_allow_double_booking']         = $s['allowDoubleBooking']         ?? false;
            $data['sched_requires_consultation']        = $s['requiresConsultation']       ?? false;
        }

        // JSON arrays
        if ($request->has('requiredCertifications'))   $data['required_certifications']    = $request->requiredCertifications ?? [];
        if ($request->has('allowedServiceCategories')) $data['allowed_service_categories'] = $request->allowedServiceCategories ?? [];

        return $data;
    }
}
