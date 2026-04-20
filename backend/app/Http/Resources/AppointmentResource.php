<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class AppointmentResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'          => $this->uuid,
            'patientId'   => $this->patient->uuid,
            'patientName' => $this->patient->name,
            'patientEmail'=> $this->patient->email,
            'doctorId'    => $this->doctor->uuid,
            'doctorName'  => $this->doctor->name,
            'services'    => $this->whenLoaded('services',
                fn() => $this->services->pluck('name')->values()
            ),
            'serviceIds'  => $this->whenLoaded('services',
                fn() => $this->services->pluck('uuid')->values()
            ),
            'date'        => $this->date->toDateString(),
            'startTime'   => $this->start_time,
            'endTime'     => $this->end_time,
            'duration'    => $this->duration,
            'status'      => $this->status,
            'notes'       => $this->notes,
        ];
    }
}
