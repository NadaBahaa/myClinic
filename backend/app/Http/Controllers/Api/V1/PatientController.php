<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Patient\StorePatientRequest;
use App\Http\Requests\Patient\UpdatePatientRequest;
use App\Http\Resources\PatientResource;
use App\Models\ActivityLog;
use App\Models\Patient;
use App\Services\AppointmentAuthorizationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PatientController extends Controller
{
    public function __construct(private readonly AppointmentAuthorizationService $authz)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Patient::class);

        $query = Patient::query();
        $this->authz->scopePatientsQueryForDoctor($query, $request->user());

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        return response()->json(PatientResource::collection($query->latest()->get()));
    }

    public function store(StorePatientRequest $request): JsonResponse
    {
        $this->authorize('create', Patient::class);

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
        $this->authorize('view', $patient);

        return response()->json(new PatientResource($patient));
    }

    public function update(UpdatePatientRequest $request, string $uuid): JsonResponse
    {
        $patient = Patient::where('uuid', $uuid)->firstOrFail();
        $this->authorize('update', $patient);

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
        $this->authorize('delete', $patient);

        $snapshot = $patient->toArray();
        $patient->delete();
        ActivityLog::log(request()->user()?->id, 'deleted', 'patient', $uuid, $snapshot, null);

        return response()->json(['message' => 'Patient deleted']);
    }
}
