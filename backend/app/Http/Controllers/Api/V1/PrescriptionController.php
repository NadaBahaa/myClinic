<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Prescription\StorePrescriptionRequest;
use App\Http\Resources\PrescriptionResource;
use App\Models\PatientFile;
use App\Models\Prescription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PrescriptionController extends Controller
{
    public function index(string $fileUuid): JsonResponse
    {
        $file = PatientFile::where('uuid', $fileUuid)->firstOrFail();

        return response()->json(PrescriptionResource::collection($file->prescriptions()->latest()->get()));
    }

    public function store(StorePrescriptionRequest $request, string $fileUuid): JsonResponse
    {
        $file = PatientFile::where('uuid', $fileUuid)->firstOrFail();

        $prescription = $file->prescriptions()->create([
            'name'          => $request->name,
            'dosage'        => $request->dosage,
            'frequency'     => $request->frequency,
            'duration'      => $request->duration,
            'prescribed_by' => $request->prescribedBy,
            'notes'         => $request->notes,
        ]);

        return response()->json(new PrescriptionResource($prescription), 201);
    }

    public function show(string $fileUuid, string $uuid): JsonResponse
    {
        $file         = PatientFile::where('uuid', $fileUuid)->firstOrFail();
        $prescription = Prescription::where('uuid', $uuid)
            ->where('patient_file_id', $file->id)
            ->firstOrFail();

        return response()->json(new PrescriptionResource($prescription));
    }

    public function update(Request $request, string $fileUuid, string $uuid): JsonResponse
    {
        $file         = PatientFile::where('uuid', $fileUuid)->firstOrFail();
        $prescription = Prescription::where('uuid', $uuid)
            ->where('patient_file_id', $file->id)
            ->firstOrFail();

        $data = [];
        foreach (['name', 'dosage', 'frequency', 'duration', 'notes'] as $field) {
            if ($request->has($field)) $data[$field] = $request->$field;
        }
        if ($request->has('prescribedBy')) $data['prescribed_by'] = $request->prescribedBy;

        $prescription->update($data);

        return response()->json(new PrescriptionResource($prescription));
    }

    public function destroy(string $fileUuid, string $uuid): JsonResponse
    {
        $file         = PatientFile::where('uuid', $fileUuid)->firstOrFail();
        $prescription = Prescription::where('uuid', $uuid)
            ->where('patient_file_id', $file->id)
            ->firstOrFail();

        $prescription->delete();

        return response()->json(['message' => 'Prescription deleted']);
    }
}
