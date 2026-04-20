<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Doctor\StoreDoctorRequest;
use App\Http\Requests\Doctor\UpdateDoctorRequest;
use App\Http\Resources\DoctorResource;
use App\Models\Doctor;
use App\Models\PractitionerType;
use App\Models\Service;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class DoctorController extends Controller
{
    private function canUseDoctorServicePivot(): bool
    {
        return Schema::hasTable('doctor_service');
    }

    private function doctorWithRelations(): array
    {
        $relations = ['practitionerType.services', 'user'];
        if ($this->canUseDoctorServicePivot()) {
            $relations[] = 'services';
        }
        return $relations;
    }

    public function index(Request $request): JsonResponse
    {
        $query = Doctor::with($this->doctorWithRelations());

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
        $practitionerType = null;
        if ($request->practitionerTypeId) {
            $practitionerType = PractitionerType::where('uuid', $request->practitionerTypeId)->with('services')->first();
            $ptId = $practitionerType?->id;
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

        if ($this->canUseDoctorServicePivot() && $request->has('serviceIds')) {
            $serviceUuids = collect($request->serviceIds ?? [])->filter()->values();
            $services = Service::whereIn('uuid', $serviceUuids)->get();
            if ($practitionerType) {
                $allowedIds = $practitionerType->services->pluck('id')->all();
                $services = $services->filter(fn($s) => in_array($s->id, $allowedIds, true))->values();
            }
            $doctor->services()->sync($services->pluck('id')->all());
        }

        $doctor->load($this->doctorWithRelations());

        return response()->json(new DoctorResource($doctor), 201);
    }

    public function show(string $uuid): JsonResponse
    {
        $doctor = Doctor::where('uuid', $uuid)->with($this->doctorWithRelations())->firstOrFail();

        return response()->json(new DoctorResource($doctor));
    }

    public function update(UpdateDoctorRequest $request, string $uuid): JsonResponse
    {
        $doctor = Doctor::where('uuid', $uuid)->with(['practitionerType.services'])->firstOrFail();

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

        if ($this->canUseDoctorServicePivot() && $request->has('serviceIds')) {
            $serviceUuids = collect($request->serviceIds ?? [])->filter()->values();
            $services = Service::whereIn('uuid', $serviceUuids)->get();

            $type = null;
            if ($doctor->practitioner_type_id) {
                $type = PractitionerType::with('services')->find($doctor->practitioner_type_id);
            }
            if ($type) {
                $allowedIds = $type->services->pluck('id')->all();
                $services = $services->filter(fn($s) => in_array($s->id, $allowedIds, true))->values();
            }

            $doctor->services()->sync($services->pluck('id')->all());
        }

        $doctor->load($this->doctorWithRelations());

        return response()->json(new DoctorResource($doctor));
    }

    public function destroy(string $uuid): JsonResponse
    {
        $doctor = Doctor::where('uuid', $uuid)->firstOrFail();
        $doctor->delete();

        return response()->json(['message' => 'Doctor deleted']);
    }
}
