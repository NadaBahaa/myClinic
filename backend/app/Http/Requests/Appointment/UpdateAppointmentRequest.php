<?php

namespace App\Http\Requests\Appointment;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAppointmentRequest extends FormRequest
{
    public function authorize(): bool { return (bool) $this->user(); }

    public function rules(): array
    {
        return [
            'date'       => 'sometimes|date',
            'startTime'  => 'sometimes|date_format:H:i',
            'endTime'    => 'sometimes|date_format:H:i',
            'duration'   => 'sometimes|integer|min:5|max:480',
            'status'     => 'sometimes|in:scheduled,completed,cancelled',
            'notes'      => 'nullable|string|max:1000',
            'services'   => 'sometimes|array|min:1',
            'services.*' => 'exists:services,uuid',
        ];
    }
}
