<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityLogResource;
use App\Models\ActivityLog;
use App\Models\ApiRequestLog;
use App\Models\Setting;
use App\Models\SystemFeatureFlag;
use App\Models\SystemModule;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

class SuperAdminController extends Controller
{
    private const ROLES_FOR_MODULES = ['admin', 'doctor', 'assistant', 'accountant'];

    /**
     * List all modules with per-role enabled state.
     */
    public function modules(): JsonResponse
    {
        $modules = SystemModule::orderBy('sort_order')->get();
        return response()->json([
            'data' => $modules->map(fn ($m) => [
                'key'             => $m->key,
                'name'            => $m->name,
                'description'     => $m->description,
                'enabled'         => $m->enabled,
                'enabledForRoles' => $this->normalizeEnabledForRoles($m->enabled_for_roles, $m->enabled),
                'sortOrder'       => $m->sort_order,
            ]),
        ]);
    }

    private function normalizeEnabledForRoles(?array $byRole, bool $fallback): array
    {
        $out = [];
        foreach (self::ROLES_FOR_MODULES as $role) {
            $out[$role] = isset($byRole[$role]) ? (bool) $byRole[$role] : $fallback;
        }
        return $out;
    }

    /**
     * Update module enabled state per role (superadmin only).
     */
    public function updateModules(Request $request): JsonResponse
    {
        $request->validate([
            'modules' => 'required|array',
            'modules.*.key'             => 'required|string|exists:system_modules,key',
            'modules.*.enabledForRoles' => 'sometimes|array',
            'modules.*.enabledForRoles.admin'      => 'boolean',
            'modules.*.enabledForRoles.doctor'     => 'boolean',
            'modules.*.enabledForRoles.assistant'  => 'boolean',
            'modules.*.enabledForRoles.accountant' => 'boolean',
        ]);
        foreach ($request->modules as $item) {
            $payload = null;
            if (! empty($item['enabledForRoles'])) {
                $payload = [];
                foreach (self::ROLES_FOR_MODULES as $role) {
                    $payload[$role] = $item['enabledForRoles'][$role] ?? false;
                }
            }
            $update = ['enabled' => ! $payload || in_array(true, $payload, true)];
            if ($payload !== null) {
                $update['enabled_for_roles'] = json_encode($payload);
            }
            SystemModule::where('key', $item['key'])->update($update);
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

    /** Default tab visibility per role (used when no saved setting). */
    private const DEFAULT_ROLE_TAB_VISIBILITY = [
        'admin'      => ['showCalendar' => true, 'showPatients' => true, 'showDoctors' => true, 'showServices' => true, 'showUsers' => true, 'showSettings' => true, 'showActivityLog' => true, 'showReports' => true, 'showMaterialsTools' => true, 'showPractitionerTypes' => true],
        'doctor'     => ['showCalendar' => true, 'showPatients' => true, 'showDoctors' => false, 'showServices' => true, 'showUsers' => false, 'showSettings' => false, 'showActivityLog' => false, 'showReports' => false, 'showMaterialsTools' => false, 'showPractitionerTypes' => false],
        'assistant'  => ['showCalendar' => true, 'showPatients' => true, 'showDoctors' => true, 'showServices' => true, 'showUsers' => false, 'showSettings' => false, 'showActivityLog' => false, 'showReports' => false, 'showMaterialsTools' => false, 'showPractitionerTypes' => false],
        'accountant' => ['showCalendar' => false, 'showPatients' => false, 'showDoctors' => false, 'showServices' => false, 'showUsers' => false, 'showSettings' => false, 'showActivityLog' => false, 'showReports' => false, 'showMaterialsTools' => false, 'showPractitionerTypes' => false],
    ];

    private const TAB_VISIBILITY_KEYS = ['showCalendar', 'showPatients', 'showDoctors', 'showServices', 'showUsers', 'showSettings', 'showActivityLog', 'showReports', 'showMaterialsTools', 'showPractitionerTypes'];

    /**
     * Get default tab visibility per role (superadmin manages these; new users get these by role).
     */
    public function roleTabVisibility(): JsonResponse
    {
        $raw = Setting::get('role_default_permissions');
        $data = $raw ? (json_decode($raw, true) ?: []) : [];
        $roles = ['admin', 'doctor', 'assistant', 'accountant'];
        $out = [];
        foreach ($roles as $role) {
            $out[$role] = array_merge(
                self::DEFAULT_ROLE_TAB_VISIBILITY[$role] ?? array_fill_keys(self::TAB_VISIBILITY_KEYS, false),
                $data[$role] ?? []
            );
        }
        return response()->json(['data' => $out]);
    }

    /**
     * Update default tab visibility per role (superadmin only).
     */
    public function updateRoleTabVisibility(Request $request): JsonResponse
    {
        $request->validate([
            'perRole' => 'required|array',
            'perRole.admin'      => 'sometimes|array',
            'perRole.doctor'     => 'sometimes|array',
            'perRole.assistant'  => 'sometimes|array',
            'perRole.accountant' => 'sometimes|array',
        ]);
        $perRole = $request->input('perRole', []);
        $out = [];
        foreach (['admin', 'doctor', 'assistant', 'accountant'] as $role) {
            $rolePerms = $perRole[$role] ?? [];
            $merged = self::DEFAULT_ROLE_TAB_VISIBILITY[$role] ?? [];
            foreach (self::TAB_VISIBILITY_KEYS as $key) {
                if (array_key_exists($key, $rolePerms)) {
                    $merged[$key] = (bool) $rolePerms[$key];
                }
            }
            $out[$role] = $merged;
        }
        Setting::set('role_default_permissions', json_encode($out));
        return response()->json(['message' => 'Role tab visibility updated', 'data' => $out]);
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
