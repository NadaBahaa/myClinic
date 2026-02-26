<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemModule extends Model
{
    protected $fillable = ['key', 'name', 'description', 'enabled', 'sort_order'];

    protected $casts = ['enabled' => 'boolean'];

    public function featureFlags()
    {
        return $this->hasMany(SystemFeatureFlag::class, 'module_key', 'key');
    }
}
