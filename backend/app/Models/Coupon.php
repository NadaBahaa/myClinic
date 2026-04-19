<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Coupon extends Model
{
    use SoftDeletes;

    public const TYPE_PERCENT = 'percent';

    public const TYPE_FIXED = 'fixed';

    protected $fillable = [
        'uuid', 'code', 'description', 'discount_type', 'discount_value',
        'max_discount_amount', 'starts_at', 'ends_at', 'max_uses', 'uses_count', 'is_active',
    ];

    protected $casts = [
        'discount_value'        => 'float',
        'max_discount_amount'   => 'float',
        'starts_at'             => 'datetime',
        'ends_at'               => 'datetime',
        'max_uses'              => 'integer',
        'uses_count'            => 'integer',
        'is_active'             => 'boolean',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(static function ($m) {
            $m->uuid ??= (string) Str::uuid();
            if (! empty($m->code)) {
                $m->code = strtoupper(trim($m->code));
            }
        });
        static::updating(static function ($m) {
            if ($m->isDirty('code') && $m->code !== null) {
                $m->code = strtoupper(trim($m->code));
            }
        });
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    public function sessionRecords()
    {
        return $this->hasMany(SessionRecord::class);
    }

    /**
     * @return float Discount amount (0 to base).
     */
    public function computeDiscountAmount(float $base): float
    {
        if ($base <= 0) {
            return 0.0;
        }
        if ($this->discount_type === self::TYPE_PERCENT) {
            $raw = round($base * ($this->discount_value / 100.0), 2);
            if ($this->max_discount_amount !== null) {
                $raw = min($raw, (float) $this->max_discount_amount);
            }

            return min($raw, $base);
        }

        return min((float) $this->discount_value, $base);
    }

    public function isValidNow(): bool
    {
        if (! $this->is_active) {
            return false;
        }
        $now = now();
        if ($this->starts_at && $now->lt($this->starts_at)) {
            return false;
        }
        if ($this->ends_at && $now->gt($this->ends_at)) {
            return false;
        }
        if ($this->max_uses !== null && $this->uses_count >= $this->max_uses) {
            return false;
        }

        return true;
    }

    public function incrementUsage(): void
    {
        $this->increment('uses_count');
    }

    public function decrementUsage(): void
    {
        if ($this->uses_count > 0) {
            $this->decrement('uses_count');
        }
    }
}
