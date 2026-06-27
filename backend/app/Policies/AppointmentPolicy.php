<?php

namespace App\Policies;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\User;
use App\Policies\Concerns\HandlesMedicalRoles;

class AppointmentPolicy
{
    use HandlesMedicalRoles;

    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'superadmin', 'assistant', 'doctor'], true);
    }

    public function view(User $user, Appointment $appointment): bool
    {
        if ($this->isAdmin($user) || $user->role === 'assistant') {
            return true;
        }

        if ($user->role === 'doctor') {
            $doctor = $this->doctorProfile($user);

            return $doctor && (int) $appointment->doctor_id === (int) $doctor->id;
        }

        return false;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'superadmin', 'assistant', 'doctor'], true);
    }

    public function createForDoctor(User $user, Doctor $doctor): bool
    {
        if ($this->isAdmin($user) || $user->role === 'assistant') {
            return true;
        }

        if ($user->role === 'doctor') {
            $profile = $this->doctorProfile($user);

            return $profile && (int) $profile->id === (int) $doctor->id;
        }

        return false;
    }

    public function createForPatient(User $user, Patient $patient, Doctor $doctor): bool
    {
        if (! $this->createForDoctor($user, $doctor)) {
            return false;
        }

        if ($this->isAdmin($user) || $user->role === 'assistant') {
            return true;
        }

        if ($user->role === 'doctor') {
            return $this->doctorCanBookPatient($user, $patient, $doctor);
        }

        return false;
    }

    public function update(User $user, Appointment $appointment): bool
    {
        return $this->view($user, $appointment);
    }

    public function checkout(User $user, Appointment $appointment): bool
    {
        if (! in_array($user->role, ['admin', 'superadmin', 'assistant', 'doctor'], true)) {
            return false;
        }

        return $this->view($user, $appointment);
    }

    public function delete(User $user, Appointment $appointment): bool
    {
        return $this->view($user, $appointment);
    }
}
