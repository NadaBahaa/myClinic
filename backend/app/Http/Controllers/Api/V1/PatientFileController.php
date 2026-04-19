<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PatientFileResource;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\PatientFile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PatientFileController extends Controller
{
    /**
     * GET /api/v1/patients/{patientUuid}/files
     * List all patient files for a given patient. Doctor sees only their own file.
     */
    public function index(Request $request, string $patientUuid): JsonResponse
    {
        $patient = Patient::where('uuid', $patientUuid)->firstOrFail();

        $query = PatientFile::where('patient_id', $patient->id);
        if ($request->user()?->role === 'doctor' && $request->user()->doctor) {
            $query->where('doctor_id', $request->user()->doctor->id);
        }
        $files = $query->with(['patient', 'doctor', 'sessions.materialUsages.material', 'sessions.coupon', 'photos', 'prescriptions'])->get();

        return response()->json(PatientFileResource::collection($files));
    }

    /**
     * GET /api/v1/patients/{patientUuid}/files/{doctorUuid}
     * Get or create the file for a patient+doctor pair. Doctor may only access their own file.
     */
    public function show(Request $request, string $patientUuid, string $doctorUuid): JsonResponse
    {
        $patient = Patient::where('uuid', $patientUuid)->firstOrFail();
        $doctor  = Doctor::where('uuid', $doctorUuid)->firstOrFail();

        if ($request->user()?->role === 'doctor' && $request->user()->doctor?->id !== $doctor->id) {
            return response()->json(['message' => 'Forbidden: you may only access your own patient file'], 403);
        }

        $file = PatientFile::getOrCreate($patient->id, $doctor->id);
        $file->load(['patient', 'doctor', 'sessions.materialUsages.material', 'sessions.coupon', 'photos.session', 'prescriptions']);

        return response()->json(new PatientFileResource($file));
    }
}
