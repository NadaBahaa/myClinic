<?php

namespace App\Console\Commands;

use App\Services\RolePermissionService;
use Illuminate\Console\Command;

class SyncRolePermissionsCommand extends Command
{
    protected $signature = 'permissions:sync-role-defaults {--role= : Sync only this role (admin, doctor, assistant, accountant)}';

    protected $description = 'Apply super-admin role tab defaults to all users of each role (fixes stale perm_* columns)';

    public function handle(): int
    {
        $only = $this->option('role');
        $roles = $only ? [$only] : ['admin', 'doctor', 'assistant', 'accountant'];

        foreach ($roles as $role) {
            if ($role === 'superadmin') {
                continue;
            }
            $defaults = RolePermissionService::roleDefaults($role);
            RolePermissionService::syncUsersOfRole($role, $defaults);
            $this->info("Synced {$role} users to role tab defaults.");
        }

        $this->info('Done. Users should re-login or refocus the browser to refresh navigation.');

        return self::SUCCESS;
    }
}
