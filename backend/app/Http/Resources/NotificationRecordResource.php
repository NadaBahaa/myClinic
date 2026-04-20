<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class NotificationRecordResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'              => $this->uuid,
            'patientId'       => $this->patient?->uuid,
            'patientName'     => $this->patient?->name,
            'patientEmail'    => $this->patient?->email,
            'patientPhone'    => $this->patient?->phone,
            'appointmentId'   => $this->appointment?->uuid,
            'appointmentDate' => $this->appointment?->date?->toDateString(),
            'appointmentTime' => $this->appointment?->start_time,
            'type'            => $this->type,
            'sentAt'          => $this->sent_at,
            'sentBy'          => $this->sent_by,
            'method'          => $this->method,
            'status'          => $this->status,
            'message'         => $this->message,
        ];
    }
}
