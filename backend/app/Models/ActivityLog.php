<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    protected $table = 'activity_log';

    protected $fillable = [
        'user_id', 'action', 'subject_type', 'subject_id',
        'old_values', 'new_values', 'ip', 'user_agent',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function log(
        ?int $userId,
        string $action,
        string $subjectType,
        ?string $subjectId = null,
        ?array $oldValues = null,
        ?array $newValues = null
    ): self {
        return self::create([
            'user_id'     => $userId,
            'action'      => $action,
            'subject_type' => $subjectType,
            'subject_id'  => $subjectId,
            'old_values'   => $oldValues,
            'new_values'   => $newValues,
            'ip'          => request()?->ip(),
            'user_agent'  => request()?->userAgent(),
        ]);
    }
}
