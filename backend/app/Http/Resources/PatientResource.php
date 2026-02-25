<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class PatientResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'               => $this->uuid,
            'name'             => $this->name,
            'email'            => $this->email,
            'phone'            => $this->phone,
            'dateOfBirth'      => $this->date_of_birth?->toDateString(),
            'address'          => $this->address,
            'emergencyContact' => $this->emergency_contact,
            'notes'            => $this->notes,
            'lastVisit'        => $this->last_visit?->toDateString(),
            'totalVisits'      => $this->total_visits,
        ];
    }
}
