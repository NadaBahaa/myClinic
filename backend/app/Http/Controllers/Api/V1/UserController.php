<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\PractitionerType;
use App\Models\User;
use App\Services\RolePermissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        $query = User::with(['practitionerType', 'doctor']);

        // Clinic admins manage staff only — never expose super-admin accounts.
        if (request()->user()?->role === 'admin') {
            $query->where('role', '!=', 'superadmin');
        }

        return response()->json(UserResource::collection($query->get()));
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $ptId = null;
        if ($request->practitionerTypeId) {
            $pt = PractitionerType::where('uuid', $request->practitionerTypeId)->first();
            $ptId = $pt?->id;
        }

        $perms = RolePermissionService::mergeWithRoleDefaults(
            $request->role,
            $request->permissions ?? []
        );

        $user = User::create(array_merge([
            'name'                 => $request->name,
            'email'                => $request->email,
            'password'             => $request->password,
            'role'                 => $request->role,
            'practitioner_type_id' => $ptId,
        ], RolePermissionService::toDatabaseColumns($perms)));

        $user->load('practitionerType');

        return response()->json(new UserResource($user), 201);
    }

    public function show(string $uuid): JsonResponse
    {
        $user = User::where('uuid', $uuid)->with('practitionerType')->firstOrFail();

        return response()->json(new UserResource($user));
    }

    public function update(UpdateUserRequest $request, string $uuid): JsonResponse
    {
        $user = User::where('uuid', $uuid)->firstOrFail();

        $data = [];

        if ($request->has('name'))     $data['name']     = $request->name;
        if ($request->has('email'))    $data['email']     = $request->email;
        if ($request->has('password')) $data['password']  = $request->password;
        if ($request->has('role'))     $data['role']      = $request->role;
        if ($request->has('isActive')) $data['is_active'] = $request->boolean('isActive');

        if ($request->has('practitionerTypeId')) {
            $pt = PractitionerType::where('uuid', $request->practitionerTypeId)->first();
            $data['practitioner_type_id'] = $pt?->id;
        }

        if ($request->has('permissions')) {
            $data = array_merge($data, RolePermissionService::toDatabaseColumns($request->permissions));
        }

        $user->update($data);
        $user->load('practitionerType');

        return response()->json(new UserResource($user));
    }

    public function destroy(string $uuid): JsonResponse
    {
        $user = User::where('uuid', $uuid)->firstOrFail();

        // Prevent self-deletion
        if ($user->id === request()->user()->id) {
            return response()->json(['message' => 'Cannot delete your own account'], 422);
        }
        // Prevent deleting another super admin (superadmin only can do that if we allow)
        if ($user->role === 'superadmin' && request()->user()->role !== 'superadmin') {
            return response()->json(['message' => 'Cannot delete a super admin'], 422);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'User deleted']);
    }
}
