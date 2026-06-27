<?php

use App\Models\User;
use App\Services\RolePermissionService;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['admin', 'doctor', 'assistant', 'accountant'] as $role) {
            $defaults = RolePermissionService::roleDefaults($role);
            User::where('role', $role)->update(RolePermissionService::toDatabaseColumns($defaults));
        }
    }

    public function down(): void
    {
        // Non-destructive: permissions remain as-is after rollback.
    }
};
