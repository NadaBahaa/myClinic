<?php

namespace App\Policies;

use App\Models\MaterialOrTool;
use App\Models\User;
use App\Policies\Concerns\HandlesMedicalRoles;

class MaterialOrToolPolicy
{
    use HandlesMedicalRoles;

    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'superadmin', 'assistant', 'doctor', 'accountant'], true);
    }

    public function view(User $user, MaterialOrTool $materialOrTool): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'superadmin', 'assistant', 'doctor'], true);
    }

    public function update(User $user, MaterialOrTool $materialOrTool): bool
    {
        return $this->create($user);
    }

    public function delete(User $user, MaterialOrTool $materialOrTool): bool
    {
        return $this->isAdmin($user) || $user->role === 'assistant';
    }

    public function import(User $user): bool
    {
        return $this->create($user);
    }

    public function export(User $user): bool
    {
        return $this->viewAny($user);
    }
}
