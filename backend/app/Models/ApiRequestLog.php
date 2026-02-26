<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApiRequestLog extends Model
{
    const UPDATED_AT = null;

    protected $table = 'api_request_logs';

    protected $fillable = [
        'method', 'path', 'user_id', 'ip', 'response_status',
        'request_headers', 'request_payload', 'response_body', 'response_time_ms',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
