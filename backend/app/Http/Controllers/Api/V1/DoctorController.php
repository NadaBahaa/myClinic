<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Doctor\StoreDoctorRequest;
use App\Http\Requests\Doctor\UpdateDoctorRequest;
use App\Http\Resources\DoctorResource;
use App\Models\Doctor;
use App\Models\PractitionerType;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DoctorController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Doctor::with(['practitionerType', 'user']);

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('specialty', 'like', "%{$search}%");
            });
        }
        if ($type = $request->query('practitioner_type')) {
            $query->whereHas('practitionerType', fn($q) => $q->where('uuid', $type));
        }

        $doctors = $query->get();

        return response()->json(DoctorResource::collection($doctors));
    }

    public function store(StoreDoctorRequest $request): JsonResponse
    {
        $ptId = null;
        if ($request->practitionerTypeId) {
            $pt = PractitionerType::where('uuid', $request->practitionerTypeId)->first();
            $ptId = $pt?->id;
        }

        $userId = null;
        if ($request->userId) {
            $user = User::where('uuid', $request->userId)->first();
            $userId = $user?->id;
        }

        $doctor = Doctor::create([
            'name'                  => $request->name,
            'email'                 => $request->email,
            'phone'                 => $request->phone,
            'specialty'             => $request->specialty,
            'experience'            => $request->experience,
            'qualifications'        => $request->qualifications,
            'license_number'        => $request->licenseNumber,
            'availability'          => $request->availability ?? [],
            'practitioner_type_id'  => $ptId,
            'user_id'               => $userId,
        ]);

        $doctor->load(['practitionerType', 'user']);

        return response()->json(new DoctorResource($doctor), 201);
    }

    public function show(string $uuid): JsonResponse
    {
        $doctor = Doctor::where('uuid', $uuid)->with(['practitionerType', 'user'])->firstOrFail();

        return response()->json(new DoctorResource($doctor));
    }

    public function update(UpdateDoctorRequest $request, string $uuid): JsonResponse
    {
        $doctor = Doctor::where('uuid', $uuid)->firstOrFail();

        $data = [];
        if ($request->has('name'))          $data['name']       = $request->name;
        if ($request->has('email'))         $data['email']      = $request->email;
        if ($request->has('phone'))         $data['phone']      = $request->phone;
        if ($request->has('specialty'))     $data['specialty']  = $request->specialty;
        if ($request->has('experience'))    $data['experience'] = $request->experience;
        if ($request->has('qualifications')) $data['qualifications'] = $request->qualifications;
        if ($request->has('licenseNumber')) $data['license_number'] = $request->licenseNumber;
        if ($request->has('availability'))  $data['availability']   = $request->availability;

        if ($request->has('practitionerTypeId')) {
            $pt = PractitionerType::where('uuid', $request->practitionerTypeId)->first();
            $data['practitioner_type_id'] = $pt?->id;
        }

        $doctor->update($data);
        $doctor->load(['practitionerType', 'user']);

        return response()->json(new DoctorResource($doctor));
    }

    public function destroy(string $uuid): JsonResponse
    {
        $doctor = Doctor::where('uuid', $uuid)->firstOrFail();
        $doctor->delete();

        return response()->json(['message' => 'Doctor deleted']);
    }
}
