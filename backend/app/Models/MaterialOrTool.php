<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class MaterialOrTool extends Model
{
    use SoftDeletes;
    protected $table = 'materials_tools';

    protected $fillable = [
        'uuid', 'name', 'type', 'unit_price', 'unit',
        'stock_quantity', 'supplier', 'notes',
    ];

    protected $casts = [
        'unit_price'     => 'float',
        'stock_quantity' => 'integer',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(static fn($m) => $m->uuid ??= (string) Str::uuid());
    }

    public function sessionUsages()
    {
        return $this->hasMany(SessionMaterialUsage::class, 'material_id');
    }
}
