<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class PatientFileResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'            => $this->uuid,
            'patientId'     => $this->patient->uuid,
            'patientName'   => $this->patient->name,
            'doctorId'      => $this->doctor->uuid,
            'doctorName'    => $this->doctor->name,
            'createdAt'     => $this->created_at,
            'sessions'      => SessionRecordResource::collection($this->whenLoaded('sessions')),
            'photos'        => PatientPhotoResource::collection($this->whenLoaded('photos')),
            'prescriptions' => PrescriptionResource::collection($this->whenLoaded('prescriptions')),
        ];
    }
}
