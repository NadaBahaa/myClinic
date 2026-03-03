<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemModule extends Model
{
    protected $fillable = ['key', 'name', 'description', 'enabled', 'enabled_for_roles', 'sort_order'];

    protected $casts = [
        'enabled' => 'boolean',
        'enabled_for_roles' => 'array',
    ];

    public static function visibilityForRole(string $role): array
    {
        $out = [];
        foreach (self::orderBy('sort_order')->get() as $m) {
            $byRole = $m->enabled_for_roles;
            $out[$m->key] = is_array($byRole) && array_key_exists($role, $byRole)
                ? (bool) $byRole[$role]
                : (bool) $m->enabled;
        }
        return $out;
    }

    public function featureFlags()
    {
        return $this->hasMany(SystemFeatureFlag::class, 'module_key', 'key');
    }
}
