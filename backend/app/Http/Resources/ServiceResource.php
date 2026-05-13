<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ServiceResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'                         => $this->uuid,
            'name'                       => $this->name,
            'category'                   => $this->category,
            'duration'                   => $this->duration,
            'price'                      => $this->price,
            'description'                => $this->description,
            'popular'                    => $this->popular,
            'allowedPractitionerTypeIds' => $this->whenLoaded('practitionerTypes',
                fn() => $this->practitionerTypes->pluck('uuid')->values()
            ),
            'defaultMaterials' => $this->whenLoaded('materials', function () {
                return $this->materials->map(fn ($m) => [
                    'materialId'      => $m->uuid,
                    'name'            => $m->name,
                    'unitPrice'       => (float) $m->unit_price,
                    'unit'            => $m->unit,
                    'defaultQuantity' => (float) $m->pivot->default_quantity,
                ])->values();
            }),
        ];
    }
}
