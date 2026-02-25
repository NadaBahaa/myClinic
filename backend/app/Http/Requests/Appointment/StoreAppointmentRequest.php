<?php

namespace App\Http\Requests\Appointment;

use Illuminate\Foundation\Http\FormRequest;

class StoreAppointmentRequest extends FormRequest
{
    public function authorize(): bool { return (bool) $this->user(); }

    public function rules(): array
    {
        return [
            'patientId'  => 'required|exists:patients,uuid',
            'doctorId'   => 'required|exists:doctors,uuid',
            'date'       => 'required|date|after_or_equal:today',
            'startTime'  => 'required|date_format:H:i',
            'endTime'    => 'required|date_format:H:i|after:startTime',
            'duration'   => 'required|integer|min:5|max:480',
            'status'     => 'in:scheduled,completed,cancelled',
            'notes'      => 'nullable|string|max:1000',
            'services'   => 'required|array|min:1',
            'services.*' => 'exists:services,uuid',
        ];
    }
}
