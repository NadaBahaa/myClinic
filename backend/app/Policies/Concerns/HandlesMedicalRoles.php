<?php

namespace App\Policies\Concerns;

use App\Models\Patient;
use App\Models\PatientFile;
use App\Models\User;

trait HandlesMedicalRoles
{
    protected function isAdmin(User $user): bool
    {
        return in_array($user->role, ['admin', 'superadmin'], true);
    }

    protected function isClinicalStaff(User $user): bool
    {
        return in_array($user->role, ['admin', 'superadmin', 'assistant', 'doctor'], true);
    }

    protected function isFinanceStaff(User $user): bool
    {
        return in_array($user->role, ['admin', 'superadmin', 'accountant'], true);
    }

    protected function doctorProfile(User $user): ?\App\Models\Doctor
    {
        $user->loadMissing('doctor');

        return $user->doctor;
    }

    protected function doctorHasPatientAccess(User $user, Patient $patient): bool
    {
        if ($user->role !== 'doctor') {
            return false;
        }

        $doctor = $this->doctorProfile($user);
        if (! $doctor) {
            return false;
        }

        return $patient->patientFiles()->where('doctor_id', $doctor->id)->exists();
    }

    /**
     * Doctors may book only their existing patients, or patients with no clinical file yet.
     */
    protected function doctorCanBookPatient(User $user, Patient $patient, \App\Models\Doctor $doctor): bool
    {
        if ($user->role !== 'doctor') {
            return true;
        }

        $profile = $this->doctorProfile($user);
        if (! $profile || (int) $profile->id !== (int) $doctor->id) {
            return false;
        }

        if ($patient->patientFiles()->where('doctor_id', $doctor->id)->exists()) {
            return true;
        }

        return ! $patient->patientFiles()->exists();
    }

    protected function doctorOwnsPatientFile(User $user, PatientFile $file): bool
    {
        if ($user->role !== 'doctor') {
            return true;
        }

        $doctor = $this->doctorProfile($user);

        return $doctor && (int) $file->doctor_id === (int) $doctor->id;
    }
}
