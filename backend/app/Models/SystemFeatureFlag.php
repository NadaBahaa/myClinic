<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemFeatureFlag extends Model
{
    protected $fillable = ['key', 'module_key', 'label', 'description', 'enabled', 'sort_order'];

    protected $casts = ['enabled' => 'boolean'];
}
