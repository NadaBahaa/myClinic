<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ActivityLogResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'          => $this->id,
            'userId'      => $this->user?->uuid,
            'userName'    => $this->user?->name,
            'userEmail'   => $this->user?->email,
            'action'      => $this->action,
            'subjectType' => $this->subject_type,
            'subjectId'   => $this->subject_id,
            'oldValues'   => $this->old_values,
            'newValues'   => $this->new_values,
            'ip'          => $this->ip,
            'createdAt'   => $this->created_at?->toIso8601String(),
        ];
    }
}
