<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class MaterialOrToolResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'            => $this->uuid,
            'name'          => $this->name,
            'type'          => $this->type,
            'unitPrice'     => $this->unit_price,
            'unit'          => $this->unit,
            'stockQuantity' => $this->stock_quantity,
            'supplier'      => $this->supplier,
            'notes'         => $this->notes,
        ];
    }
}
