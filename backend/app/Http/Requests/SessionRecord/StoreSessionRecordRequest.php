<?php

namespace App\Http\Requests\SessionRecord;

use Illuminate\Foundation\Http\FormRequest;

class StoreSessionRecordRequest extends FormRequest
{
    public function authorize(): bool { return (bool) $this->user(); }

    public function rules(): array
    {
        return [
            'date'                          => 'required|date',
            'serviceId'                     => 'nullable|exists:services,uuid',
            'serviceName'                   => 'required|string|max:150',
            'servicePrice'                  => 'required|numeric|min:0',
            'performedBy'                   => 'required|string|max:150',
            'notes'                         => 'nullable|string|max:2000',
            'appointmentId'                 => 'nullable|exists:appointments,uuid',
            'materialsUsed'                 => 'nullable|array',
            'materialsUsed.*.materialId'    => 'required|exists:materials_tools,uuid',
            'materialsUsed.*.quantity'      => 'required|numeric|min:0.001',
            'materialsUsed.*.unitPrice'     => 'required|numeric|min:0',
            'couponCode'                      => 'nullable|string|max:64',
            'originalServicePrice'            => 'nullable|numeric|min:0',
        ];
    }
}
