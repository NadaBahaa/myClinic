<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $allowed = [];
        foreach ($roles as $r) {
            $allowed = array_merge($allowed, array_map('trim', explode(',', $r)));
        }
        $allowed = array_unique(array_filter($allowed));
        $user = $request->user();
        if (! $user) {
            return response()->json(['message' => 'Forbidden: insufficient role'], 403);
        }
        // Super admin has access to everything
        if ($user->role === 'superadmin') {
            return $next($request);
        }
        if (! in_array($user->role, $allowed, true)) {
            return response()->json(['message' => 'Forbidden: insufficient role'], 403);
        }

        return $next($request);
    }
}
