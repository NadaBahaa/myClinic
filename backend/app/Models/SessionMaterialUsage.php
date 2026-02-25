<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SessionMaterialUsage extends Model
{
    protected $fillable = [
        'session_record_id', 'material_id', 'material_name',
        'quantity', 'unit_price', 'total_price',
    ];

    protected $casts = [
        'quantity'    => 'float',
        'unit_price'  => 'float',
        'total_price' => 'float',
    ];

    public function sessionRecord()
    {
        return $this->belongsTo(SessionRecord::class);
    }

    public function material()
    {
        return $this->belongsTo(MaterialOrTool::class, 'material_id');
    }
}
