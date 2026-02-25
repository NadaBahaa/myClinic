<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PatientFileResource;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\PatientFile;
use Illuminate\Http\JsonResponse;

class PatientFileController extends Controller
{
    /**
     * GET /api/v1/patients/{patientUuid}/files
     * List all patient files for a given patient.
     */
    public function index(string $patientUuid): JsonResponse
    {
        $patient = Patient::where('uuid', $patientUuid)->firstOrFail();

        $files = PatientFile::where('patient_id', $patient->id)
            ->with(['patient', 'doctor', 'sessions.materialUsages.material', 'photos', 'prescriptions'])
            ->get();

        return response()->json(PatientFileResource::collection($files));
    }

    /**
     * GET /api/v1/patients/{patientUuid}/files/{doctorUuid}
     * Get or create the file for a patient+doctor pair.
     */
    public function show(string $patientUuid, string $doctorUuid): JsonResponse
    {
        $patient = Patient::where('uuid', $patientUuid)->firstOrFail();
        $doctor  = Doctor::where('uuid', $doctorUuid)->firstOrFail();

        $file = PatientFile::getOrCreate($patient->id, $doctor->id);
        $file->load(['patient', 'doctor', 'sessions.materialUsages.material', 'photos.session', 'prescriptions']);

        return response()->json(new PatientFileResource($file));
    }
}
