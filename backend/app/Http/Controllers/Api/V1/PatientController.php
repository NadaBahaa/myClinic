<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Patient\StorePatientRequest;
use App\Http\Requests\Patient\UpdatePatientRequest;
use App\Http\Resources\PatientResource;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PatientController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Patient::query();

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

        return response()->json(new PatientResource($patient), 201);
    }

    public function show(string $uuid): JsonResponse
    {
        $patient = Patient::where('uuid', $uuid)->firstOrFail();

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

        $patient->update($data);

        return response()->json(new PatientResource($patient));
    }

    public function destroy(string $uuid): JsonResponse
    {
        $patient = Patient::where('uuid', $uuid)->firstOrFail();
        $patient->delete();

        return response()->json(['message' => 'Patient deleted']);
    }
}
