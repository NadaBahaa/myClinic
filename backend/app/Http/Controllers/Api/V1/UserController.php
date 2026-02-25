<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\PractitionerType;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        $users = User::with('practitionerType')->get();

        return response()->json(UserResource::collection($users));
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $ptId = null;
        if ($request->practitionerTypeId) {
            $pt = PractitionerType::where('uuid', $request->practitionerTypeId)->first();
            $ptId = $pt?->id;
        }

        $perms = $request->permissions ?? [];

        $user = User::create([
            'name'                  => $request->name,
            'email'                 => $request->email,
            'password'              => $request->password,
            'role'                  => $request->role,
            'practitioner_type_id'  => $ptId,
            'perm_show_calendar'    => $perms['showCalendar'] ?? false,
            'perm_show_patients'    => $perms['showPatients'] ?? false,
            'perm_show_doctors'     => $perms['showDoctors'] ?? false,
            'perm_show_services'    => $perms['showServices'] ?? false,
            'perm_show_users'       => $perms['showUsers'] ?? false,
            'perm_show_settings'    => $perms['showSettings'] ?? false,
        ]);

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

        if ($request->has('practitionerTypeId')) {
            $pt = PractitionerType::where('uuid', $request->practitionerTypeId)->first();
            $data['practitioner_type_id'] = $pt?->id;
        }

        if ($request->has('permissions')) {
            $perms = $request->permissions;
            $data['perm_show_calendar'] = $perms['showCalendar'] ?? $user->perm_show_calendar;
            $data['perm_show_patients'] = $perms['showPatients'] ?? $user->perm_show_patients;
            $data['perm_show_doctors']  = $perms['showDoctors']  ?? $user->perm_show_doctors;
            $data['perm_show_services'] = $perms['showServices'] ?? $user->perm_show_services;
            $data['perm_show_users']    = $perms['showUsers']    ?? $user->perm_show_users;
            $data['perm_show_settings'] = $perms['showSettings'] ?? $user->perm_show_settings;
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

        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'User deleted']);
    }
}
