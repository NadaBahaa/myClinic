<?php

namespace App\Policies;

use App\Models\PatientFile;
use App\Models\SessionRecord;
use App\Models\User;
use App\Policies\Concerns\HandlesMedicalRoles;

class SessionRecordPolicy
{
    use HandlesMedicalRoles;

    public function viewAny(User $user, PatientFile $patientFile): bool
    {
        return (new PatientFilePolicy)->view($user, $patientFile);
    }

    public function view(User $user, SessionRecord $sessionRecord): bool
    {
        $sessionRecord->loadMissing('patientFile');

        return $sessionRecord->patientFile
            && (new PatientFilePolicy)->view($user, $sessionRecord->patientFile);
    }

    public function create(User $user, PatientFile $patientFile): bool
    {
        return in_array($user->role, ['admin', 'superadmin', 'assistant', 'doctor'], true)
            && (new PatientFilePolicy)->view($user, $patientFile);
    }

    public function update(User $user, SessionRecord $sessionRecord): bool
    {
        return $this->view($user, $sessionRecord);
    }

    public function delete(User $user, SessionRecord $sessionRecord): bool
    {
        if ($this->isAdmin($user)) {
            return true;
        }

        return $this->view($user, $sessionRecord) && in_array($user->role, ['assistant', 'doctor'], true);
    }
}
