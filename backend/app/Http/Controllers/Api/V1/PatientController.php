<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Patient\StorePatientRequest;
use App\Http\Requests\Patient\UpdatePatientRequest;
use App\Http\Resources\PatientResource;
use App\Models\ActivityLog;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PatientController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Patient::query();

        // Doctor: only patients that have a file with this doctor
        if ($request->user()?->role === 'doctor' && $request->user()->doctor) {
            $query->whereHas('patientFiles', fn ($q) => $q->where('doctor_id', $request->user()->doctor->id));
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $patients = $query->latest()->get();

        return response()->json(PatientResource::collection($patients));
    }

    public function store(StorePatientRequest $request): JsonResponse
    {
        $patient = Patient::create([
            'name'              => $request->name,
            'email'             => $request->email,
            'phone'             => $request->phone,
            'date_of_birth'     => $request->dateOfBirth,
            'address'           => $request->address,
            'emergency_contact' => $request->emergencyContact,
            'notes'             => $request->notes,
        ]);
        ActivityLog::log($request->user()?->id, 'created', 'patient', $patient->uuid, null, $patient->toArray());

        return response()->json(new PatientResource($patient), 201);
    }

    public function show(Request $request, string $uuid): JsonResponse
    {
        $patient = Patient::where('uuid', $uuid)->firstOrFail();
        if ($request->user()?->role === 'doctor' && $request->user()->doctor) {
            $hasAccess = $patient->patientFiles()->where('doctor_id', $request->user()->doctor->id)->exists();
            if (! $hasAccess) {
                return response()->json(['message' => 'Forbidden: you do not have access to this patient'], 403);
            }
        }

        return response()->json(new PatientResource($patient));
    }

    public function update(UpdatePatientRequest $request, string $uuid): JsonResponse
    {
        $patient = Patient::where('uuid', $uuid)->firstOrFail();

        $data = [];
        if ($request->has('name'))              $data['name']               = $request->name;
        if ($request->has('email'))             $data['email']              = $request->email;
        if ($request->has('phone'))             $data['phone']              = $request->phone;
        if ($request->has('dateOfBirth'))       $data['date_of_birth']      = $request->dateOfBirth;
        if ($request->has('address'))           $data['address']            = $request->address;
        if ($request->has('emergencyContact'))  $data['emergency_contact']  = $request->emergencyContact;
        if ($request->has('notes'))             $data['notes']              = $request->notes;
        if ($request->has('lastVisit'))         $data['last_visit']         = $request->lastVisit;
        if ($request->has('totalVisits'))       $data['total_visits']       = $request->totalVisits;

        $old = $patient->toArray();
        $patient->update($data);
        ActivityLog::log($request->user()?->id, 'updated', 'patient', $patient->uuid, $old, $patient->fresh()->toArray());

        return response()->json(new PatientResource($patient));
    }

    public function destroy(string $uuid): JsonResponse
    {
        $patient = Patient::where('uuid', $uuid)->firstOrFail();
        $snapshot = $patient->toArray();
        $patient->delete();
        ActivityLog::log(request()->user()?->id, 'deleted', 'patient', $uuid, $snapshot, null);

        return response()->json(['message' => 'Patient deleted']);
    }
}
