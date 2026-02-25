<?php

namespace App\Http\Requests\Notification;

use Illuminate\Foundation\Http\FormRequest;

class StoreNotificationRequest extends FormRequest
{
    public function authorize(): bool { return (bool) $this->user(); }

    public function rules(): array
    {
        return [
            'patientId'     => 'required|exists:patients,uuid',
            'appointmentId' => 'required|exists:appointments,uuid',
            'type'          => 'required|in:reminder,confirmation',
            'method'        => 'required|in:email,sms,whatsapp',
            'sentBy'        => 'required|string|max:150',
            'status'        => 'in:sent,failed',
        ];
    }
}
