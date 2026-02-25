<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class PrescriptionResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'           => $this->uuid,
            'name'         => $this->name,
            'dosage'       => $this->dosage,
            'frequency'    => $this->frequency,
            'duration'     => $this->duration,
            'url'          => $this->url,
            'prescribedAt' => $this->created_at,
            'prescribedBy' => $this->prescribed_by,
            'notes'        => $this->notes,
        ];
    }
}
