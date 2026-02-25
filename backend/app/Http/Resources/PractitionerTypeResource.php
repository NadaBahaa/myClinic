<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class PractitionerTypeResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'                        => $this->uuid,
            'name'                      => $this->name,
            'description'               => $this->description,
            'category'                  => $this->category,
            'color'                     => $this->color,
            'icon'                      => $this->icon,
            'active'                    => $this->active,
            'permissions'               => $this->permissions,          // model accessor
            'features'                  => $this->features,             // model accessor
            'schedulingRules'           => $this->schedulingRules,      // model accessor
            'requiredCertifications'    => $this->required_certifications ?? [],
            'allowedServiceCategories'  => $this->allowed_service_categories ?? [],
        ];
    }
}
