<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class PatientPhotoResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'         => $this->uuid,
            'url'        => $this->url,
            'type'       => $this->type,
            'sessionId'  => $this->session?->uuid,
            'uploadedAt' => $this->created_at,
            'uploadedBy' => $this->uploaded_by,
            'notes'      => $this->notes,
        ];
    }
}
