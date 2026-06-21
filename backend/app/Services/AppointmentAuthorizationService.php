<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\NotificationRecord;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class AppointmentAuthorizationService
{
    public function scopeAppointmentsQuery(Builder $query, Request $request): void
    {
        if ($request->user()?->role !== 'doctor') {
            return;
        }

        $request->user()->loadMissing('doctor');
        if ($request->user()->doctor) {
            $query->where('doctor_id', $request->user()->doctor->id);
        } else {
            $query->whereRaw('1 = 0');
        }
    }

    public function scopeNotificationsQuery(Builder $query, User $user): void
    {
        if (in_array($user->role, ['admin', 'superadmin', 'assistant'], true)) {
            return;
        }

        if ($user->role === 'doctor') {
            $user->loadMissing('doctor');
            if ($user->doctor) {
                $query->whereHas('appointment', fn (Builder $q) => $q->where('doctor_id', $user->doctor->id));
            } else {
                $query->whereRaw('1 = 0');
            }

            return;
        }

        $query->whereRaw('1 = 0');
    }

    public function scopePatientFilesQuery(Builder $query, User $user): void
    {
        if ($user->role !== 'doctor') {
            return;
        }

        $user->loadMissing('doctor');
        if ($user->doctor) {
            $query->where('doctor_id', $user->doctor->id);
        } else {
            $query->whereRaw('1 = 0');
        }
    }

    public function doctorOwnsAppointment(Request $request, Appointment $appointment): bool
    {
        if ($request->user()?->role !== 'doctor') {
            return true;
        }

        $request->user()->loadMissing('doctor');
        if (! $request->user()->doctor) {
            return false;
        }

        return (int) $appointment->doctor_id === (int) $request->user()->doctor->id;
    }

    public function scopePatientsQueryForDoctor(Builder $query, User $user): void
    {
        if ($user->role !== 'doctor') {
            return;
        }

        $user->loadMissing('doctor');
        if ($user->doctor) {
            $query->whereHas('patientFiles', fn ($q) => $q->where('doctor_id', $user->doctor->id));
        } else {
            $query->whereRaw('1 = 0');
        }
    }
}
