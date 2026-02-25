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
            'practitionerTypeId' => $this->practitionerType?->uuid,
            'permissions'        => $this->permissions, // uses model accessor
        ];
    }
}
