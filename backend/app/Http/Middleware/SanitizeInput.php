<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SanitizeInput
{
    /**
     * Fields that should NOT be sanitized (passwords, URLs, JSON values, etc.)
     */
    protected array $except = [
        'password', 'password_confirmation', 'url', 'photo',
        'required_certifications', 'allowed_service_categories',
        'availability', 'custom_permissions', 'permissions',
    ];

    public function handle(Request $request, Closure $next)
    {
        $input = $request->all();
        array_walk_recursive($input, function (&$val, $key) {
            if (is_string($val) && ! in_array($key, $this->except, true)) {
                $val = strip_tags(htmlspecialchars_decode(
                    htmlspecialchars($val, ENT_QUOTES, 'UTF-8', false)
                ));
            }
        });
        $request->merge($input);

        return $next($request);
    }
}
