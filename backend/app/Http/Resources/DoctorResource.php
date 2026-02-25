<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class DoctorResource extends JsonResource
{
    public function toArray($request): array
    {
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
            'userId'              => $this->user?->uuid,
            'customPermissions'   => $this->custom_permissions,
        ];
    }
}
