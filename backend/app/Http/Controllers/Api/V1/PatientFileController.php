<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PatientFileResource;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\PatientFile;
use App\Policies\AppointmentPolicy;
use App\Services\AppointmentAuthorizationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PatientFileController extends Controller
{
    public function __construct(private readonly AppointmentAuthorizationService $authz)
    {
    }

    public function index(Request $request, string $patientUuid): JsonResponse
    {
        $patient = Patient::where('uuid', $patientUuid)->firstOrFail();
        $this->authorize('viewAny', [PatientFile::class, $patient]);

        $query = PatientFile::where('patient_id', $patient->id);
        $this->authz->scopePatientFilesQuery($query, $request->user());

        $files = $query->with([
            'patient', 'doctor', 'sessions.materialUsages.material',
            'sessions.coupon', 'photos', 'prescriptions',
        ])->get();

        return response()->json(PatientFileResource::collection($files));
    }

    public function show(Request $request, string $patientUuid, string $doctorUuid): JsonResponse
    {
        $patient = Patient::where('uuid', $patientUuid)->firstOrFail();
        $doctor  = Doctor::where('uuid', $doctorUuid)->firstOrFail();
        $user    = $request->user();

        if ($user?->role === 'doctor') {
            $user->loadMissing('doctor');
            if (! $user->doctor || (int) $user->doctor->id !== (int) $doctor->id) {
                abort(403, 'You may only access your own patient file.');
            }
            if (! app(AppointmentPolicy::class)->createForPatient($user, $patient, $doctor)) {
                abort(403, 'You do not have access to this patient.');
            }
        } else {
            $this->authorize('viewAny', [PatientFile::class, $patient]);
        }

        $file = PatientFile::getOrCreate($patient->id, $doctor->id);
        $this->authorize('view', $file);

        $file->load([
            'patient', 'doctor', 'sessions.materialUsages.material',
            'sessions.coupon', 'photos.session', 'prescriptions',
        ]);

        return response()->json(new PatientFileResource($file));
    }
}
