<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class SessionRecordResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'                  => $this->uuid,
            'appointmentId'       => $this->appointment?->uuid,
            'date'                => $this->date->toDateString(),
            'serviceId'           => $this->service?->uuid,
            'serviceName'         => $this->service_name,
            'servicePrice'        => $this->service_price,
            'materialsUsed'       => $this->whenLoaded('materialUsages', function () {
                return $this->materialUsages->map(fn($u) => [
                    'materialId'   => $u->material->uuid,
                    'materialName' => $u->material_name,
                    'quantity'     => $u->quantity,
                    'unitPrice'    => $u->unit_price,
                    'totalPrice'   => $u->total_price,
                ]);
            }),
            'totalMaterialsCost'  => $this->total_materials_cost,
            'netProfit'           => $this->net_profit,
            'performedBy'         => $this->performed_by,
            'notes'               => $this->notes,
        ];
    }
}
