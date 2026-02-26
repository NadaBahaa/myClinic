<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityLogResource;
use App\Models\ActivityLog;
use App\Models\ApiRequestLog;
use App\Models\SystemFeatureFlag;
use App\Models\SystemModule;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

class SuperAdminController extends Controller
{
    /**
     * List all modules (all auth can read; superadmin can update via updateModules).
     */
    public function modules(): JsonResponse
    {
        $modules = SystemModule::orderBy('sort_order')->get();
        return response()->json([
            'data' => $modules->map(fn ($m) => [
                'key'         => $m->key,
                'name'        => $m->name,
                'description' => $m->description,
                'enabled'     => $m->enabled,
                'sortOrder'   => $m->sort_order,
            ]),
        ]);
    }

    /**
     * Update module enabled state (superadmin only).
     */
    public function updateModules(Request $request): JsonResponse
    {
        $request->validate([
            'modules' => 'required|array',
            'modules.*.key'    => 'required|string|exists:system_modules,key',
            'modules.*.enabled' => 'required|boolean',
        ]);
        foreach ($request->modules as $item) {
            SystemModule::where('key', $item['key'])->update(['enabled' => $item['enabled']]);
        }
        return response()->json(['message' => 'Modules updated']);
    }

    /**
     * List all feature flags (all auth can read).
     */
    public function featureFlags(): JsonResponse
    {
        $flags = SystemFeatureFlag::orderBy('module_key')->orderBy('sort_order')->get();
        return response()->json([
            'data' => $flags->map(fn ($f) => [
                'key'         => $f->key,
                'moduleKey'   => $f->module_key,
                'label'       => $f->label,
                'description' => $f->description,
                'enabled'     => $f->enabled,
                'sortOrder'   => $f->sort_order,
            ]),
        ]);
    }

    /**
     * Update feature flag enabled state (superadmin only).
     */
    public function updateFeatureFlags(Request $request): JsonResponse
    {
        $request->validate([
            'flags' => 'required|array',
            'flags.*.key'     => 'required|string|exists:system_feature_flags,key',
            'flags.*.enabled' => 'required|boolean',
        ]);
        foreach ($request->flags as $item) {
            SystemFeatureFlag::where('key', $item['key'])->update(['enabled' => $item['enabled']]);
        }
        return response()->json(['message' => 'Feature flags updated']);
    }

    /**
     * All activity log entries (superadmin sees everything; no filter).
     */
    public function activityLog(Request $request): JsonResponse
    {
        $query = ActivityLog::with('user:id,name,email,uuid');
        if ($request->query('subject_type')) {
            $query->where('subject_type', $request->query('subject_type'));
        }
        if ($request->query('action')) {
            $query->where('action', $request->query('action'));
        }
        if ($request->query('user_id')) {
            $query->where('user_id', $request->query('user_id'));
        }
        if ($request->query('date_from')) {
            $query->whereDate('created_at', '>=', $request->query('date_from'));
        }
        if ($request->query('date_to')) {
            $query->whereDate('created_at', '<=', $request->query('date_to'));
        }
        $logs = $query->latest('created_at')->paginate((int) $request->query('per_page', 50));
        return response()->json([
            'data' => ActivityLogResource::collection($logs),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page'    => $logs->lastPage(),
                'per_page'     => $logs->perPage(),
                'total'        => $logs->total(),
            ],
        ]);
    }

    /**
     * List all users including inactive (for superadmin management).
     */
    public function users(Request $request): JsonResponse
    {
        $query = User::with(['practitionerType', 'doctor']);
        if ($request->query('role')) {
            $query->where('role', $request->query('role'));
        }
        if ($request->boolean('inactive_only')) {
            $query->where('is_active', false);
        }
        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }
        $users = $query->orderBy('name')->get();
        return response()->json(\App\Http\Resources\UserResource::collection($users));
    }

    /**
     * Activate or deactivate a user (superadmin only).
     */
    public function setUserActive(Request $request, string $uuid): JsonResponse
    {
        $request->validate(['isActive' => 'required|boolean']);
        $user = User::where('uuid', $uuid)->firstOrFail();
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Cannot deactivate your own account'], 422);
        }
        if ($user->role === 'superadmin') {
            return response()->json(['message' => 'Cannot deactivate another super admin'], 422);
        }
        $user->update(['is_active' => $request->boolean('isActive')]);
        if (! $request->boolean('isActive')) {
            $user->tokens()->delete();
        }
        $user->load(['practitionerType', 'doctor']);
        return response()->json(new \App\Http\Resources\UserResource($user));
    }

    /**
     * API request/response backlog (superadmin only).
     */
    public function apiRequestLog(Request $request): JsonResponse
    {
        $query = ApiRequestLog::with('user:id,name,email,uuid')->latest('created_at');

        if ($request->query('method')) {
            $query->where('method', $request->query('method'));
        }
        if ($request->query('path')) {
            $query->where('path', 'like', '%' . $request->query('path') . '%');
        }
        if ($request->query('user_id')) {
            $query->where('user_id', $request->query('user_id'));
        }
        if ($request->query('status')) {
            $query->where('response_status', $request->query('status'));
        }
        if ($request->query('date_from')) {
            $query->whereDate('created_at', '>=', $request->query('date_from'));
        }
        if ($request->query('date_to')) {
            $query->whereDate('created_at', '<=', $request->query('date_to'));
        }

        $logs = $query->paginate((int) $request->query('per_page', 30));

        return response()->json([
            'data' => $logs->map(fn ($log) => [
                'id'               => $log->id,
                'method'           => $log->method,
                'path'             => $log->path,
                'userId'           => $log->user?->uuid,
                'userName'         => $log->user?->name,
                'ip'               => $log->ip,
                'responseStatus'  => $log->response_status,
                'requestPayload'  => $log->request_payload,
                'responseBody'     => $log->response_body,
                'responseTimeMs'   => $log->response_time_ms,
                'createdAt'        => $log->created_at?->toIso8601String(),
            ]),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page'    => $logs->lastPage(),
                'per_page'     => $logs->perPage(),
                'total'        => $logs->total(),
            ],
        ]);
    }

    /** Whitelist of safe Artisan commands for Tinker tab */
    private const SAFE_ARTISAN_COMMANDS = [
        'cache:clear',
        'config:clear',
        'view:clear',
        'route:clear',
        'optimize:clear',
    ];

    /**
     * Run a safe Artisan command (superadmin only).
     */
    public function runArtisan(Request $request): JsonResponse
    {
        $request->validate(['command' => 'required|string|max:100']);
        $command = trim($request->input('command'));
        if (! in_array($command, self::SAFE_ARTISAN_COMMANDS, true)) {
            return response()->json(['message' => 'Command not allowed. Allowed: ' . implode(', ', self::SAFE_ARTISAN_COMMANDS)], 422);
        }
        try {
            Artisan::call($command);
            $output = Artisan::output();
            return response()->json(['message' => 'OK', 'output' => $output ?: '(no output)']);
        } catch (\Throwable $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
}
