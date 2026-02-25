<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class NotificationRecordResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'            => $this->uuid,
            'patientId'     => $this->patient->uuid,
            'patientName'   => $this->patient->name,
            'appointmentId' => $this->appointment->uuid,
            'type'          => $this->type,
            'sentAt'        => $this->sent_at,
            'sentBy'        => $this->sent_by,
            'method'        => $this->method,
            'status'        => $this->status,
        ];
    }
}
