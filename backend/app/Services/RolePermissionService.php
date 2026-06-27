<?php

namespace App\Services;

use App\Models\Setting;
use App\Models\User;

class RolePermissionService
{
    /** @var array<string, array<string, bool>> */
    public const DEFAULT_ROLE_TAB_VISIBILITY = [
        'admin'      => ['showCalendar' => true, 'showPatients' => true, 'showDoctors' => true, 'showServices' => true, 'showUsers' => true, 'showSettings' => true, 'showActivityLog' => true, 'showReports' => true, 'showMaterialsTools' => true, 'showPractitionerTypes' => true],
        'doctor'     => ['showCalendar' => true, 'showPatients' => true, 'showDoctors' => false, 'showServices' => true, 'showUsers' => false, 'showSettings' => false, 'showActivityLog' => false, 'showReports' => false, 'showMaterialsTools' => false, 'showPractitionerTypes' => false],
        'assistant'  => ['showCalendar' => true, 'showPatients' => true, 'showDoctors' => true, 'showServices' => true, 'showUsers' => false, 'showSettings' => false, 'showActivityLog' => false, 'showReports' => false, 'showMaterialsTools' => false, 'showPractitionerTypes' => false],
        'accountant' => ['showCalendar' => false, 'showPatients' => false, 'showDoctors' => false, 'showServices' => false, 'showUsers' => false, 'showSettings' => false, 'showActivityLog' => false, 'showReports' => false, 'showMaterialsTools' => false, 'showPractitionerTypes' => false],
    ];

    public const TAB_VISIBILITY_KEYS = [
        'showCalendar', 'showPatients', 'showDoctors', 'showServices', 'showUsers',
        'showSettings', 'showActivityLog', 'showReports', 'showMaterialsTools', 'showPractitionerTypes',
    ];

    /** @var array<string, string> */
    public const PERMISSION_COLUMNS = [
        'showCalendar'         => 'perm_show_calendar',
        'showPatients'         => 'perm_show_patients',
        'showDoctors'          => 'perm_show_doctors',
        'showServices'         => 'perm_show_services',
        'showUsers'            => 'perm_show_users',
        'showSettings'         => 'perm_show_settings',
        'showActivityLog'      => 'perm_show_activity_log',
        'showReports'          => 'perm_show_reports',
        'showMaterialsTools'   => 'perm_show_materials_tools',
        'showPractitionerTypes'=> 'perm_show_practitioner_types',
    ];

    /**
     * Saved role defaults from super-admin settings, merged with built-in defaults.
     *
     * @return array<string, bool>
     */
    public static function roleDefaults(string $role): array
    {
        $raw = Setting::get('role_default_permissions');
        $saved = $raw ? (json_decode($raw, true) ?: []) : [];
        $base = self::DEFAULT_ROLE_TAB_VISIBILITY[$role] ?? array_fill_keys(self::TAB_VISIBILITY_KEYS, false);

        return array_merge($base, $saved[$role] ?? []);
    }

    /**
     * Merge request permissions with role defaults (for new users).
     *
     * @param  array<string, bool|null>  $requestPerms
     * @return array<string, bool>
     */
    public static function mergeWithRoleDefaults(string $role, array $requestPerms): array
    {
        $defaults = self::roleDefaults($role);
        $out = [];
        foreach (self::TAB_VISIBILITY_KEYS as $key) {
            $out[$key] = array_key_exists($key, $requestPerms)
                ? (bool) $requestPerms[$key]
                : (bool) ($defaults[$key] ?? false);
        }

        return $out;
    }

    /**
     * @param  array<string, bool>  $permissions
     * @return array<string, bool>
     */
    public static function toDatabaseColumns(array $permissions): array
    {
        $data = [];
        foreach (self::PERMISSION_COLUMNS as $key => $column) {
            if (array_key_exists($key, $permissions)) {
                $data[$column] = (bool) $permissions[$key];
            }
        }

        return $data;
    }

    /**
     * Apply role tab visibility to every user with that role (after super-admin saves).
     *
     * @param  array<string, bool>  $permissions
     */
    public static function syncUsersOfRole(string $role, array $permissions): void
    {
        if ($role === 'superadmin') {
            return;
        }

        User::where('role', $role)->update(self::toDatabaseColumns($permissions));
    }
}
