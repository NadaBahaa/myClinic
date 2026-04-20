<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class DoctorResource extends JsonResource
{
    public function toArray($request): array
    {
        $services = [];
        if ($this->relationLoaded('services') && $this->services->isNotEmpty()) {
            $services = $this->services->map(fn($s) => [
                'id'       => $s->uuid,
                'name'     => $s->name,
                'duration' => $s->duration,
                'price'    => $s->price,
                'category' => $s->category,
            ])->values()->toArray();
        } elseif ($this->relationLoaded('practitionerType') && $this->practitionerType?->relationLoaded('services')) {
            $services = $this->practitionerType->services->map(fn($s) => [
                'id'       => $s->uuid,
                'name'     => $s->name,
                'duration' => $s->duration,
                'price'    => $s->price,
                'category' => $s->category,
            ])->values()->toArray();
        }

        return [
            'id'                  => $this->uuid,
            'name'                => $this->name,
            'email'               => $this->email,
            'phone'               => $this->phone,
            'specialty'           => $this->specialty,
            'experience'          => $this->experience,
            'qualifications'      => $this->qualifications,
            'licenseNumber'       => $this->license_number,
            'availability'        => $this->availability ?? [],
            'totalPatients'       => $this->total_patients,
            'practitionerTypeId'  => $this->practitionerType?->uuid,
            'practitionerTypeName'=> $this->practitionerType?->name,
            'userId'              => $this->user?->uuid,
            'customPermissions'   => $this->custom_permissions,
            'services'            => $services,
        ];
    }
}
