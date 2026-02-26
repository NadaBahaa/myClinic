<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'                 => $this->uuid,
            'name'               => $this->name,
            'email'              => $this->email,
            'role'               => $this->role,
            'isActive'           => (bool) $this->is_active,
            'practitionerTypeId' => $this->practitionerType?->uuid,
            'doctorId'           => $this->when($this->relationLoaded('doctor') && $this->doctor, fn () => $this->doctor->uuid),
            'permissions'        => $this->permissions, // uses model accessor
        ];
    }
}
