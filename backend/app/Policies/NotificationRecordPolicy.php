<?php

namespace App\Policies;

use App\Models\NotificationRecord;
use App\Models\User;
use App\Policies\Concerns\HandlesMedicalRoles;

class NotificationRecordPolicy
{
    use HandlesMedicalRoles;

    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'superadmin', 'assistant', 'doctor'], true);
    }

    public function view(User $user, NotificationRecord $record): bool
    {
        if (! $this->viewAny($user)) {
            return false;
        }

        if ($this->isAdmin($user) || $user->role === 'assistant') {
            return true;
        }

        if ($user->role === 'doctor') {
            $record->loadMissing('appointment');
            $doctor = $this->doctorProfile($user);

            return $doctor
                && $record->appointment
                && (int) $record->appointment->doctor_id === (int) $doctor->id;
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $this->viewAny($user);
    }
}
