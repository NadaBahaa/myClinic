<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\SystemModule;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        if (! $user->is_active) {
            return response()->json(['message' => 'Account is deactivated. Contact the administrator.'], 403);
        }

        // Revoke existing tokens for single-session enforcement
        $user->tokens()->delete();

        $token = $user->createToken('api-token', ['*'], now()->addDays(7))->plainTextToken;

        $user->load(['practitionerType', 'doctor']);

        $userData = (new UserResource($user))->toArray($request);
        $moduleVisibility = $user->role === 'superadmin'
            ? array_fill_keys(SystemModule::orderBy('sort_order')->pluck('key')->toArray(), true)
            : SystemModule::visibilityForRole($user->role);
        $userData['moduleVisibility'] = $moduleVisibility;
        $userData['permissions'] = self::effectivePermissions($user, $moduleVisibility);

        return response()->json([
            'token' => $token,
            'user'  => $userData,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->load(['practitionerType', 'doctor']);

        $userData = (new UserResource($user))->toArray($request);
        $moduleVisibility = $user->role === 'superadmin'
            ? array_fill_keys(SystemModule::orderBy('sort_order')->pluck('key')->toArray(), true)
            : SystemModule::visibilityForRole($user->role);
        $userData['moduleVisibility'] = $moduleVisibility;
        $userData['permissions'] = self::effectivePermissions($user, $moduleVisibility);

        return response()->json($userData);
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();

        if (! Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password is incorrect'], 422);
        }

        $user->update(['password' => $request->password]);

        return response()->json(['message' => 'Password changed successfully']);
    }

    /**
     * Send password reset link to the given email.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $status = Password::sendResetLink($request->only('email'));

        if ($status !== Password::RESET_LINK_SENT) {
            return response()->json(['message' => __($status)], 422);
        }

        return response()->json(['message' => 'If that email exists, a reset link has been sent.']);
    }

    /**
     * Reset password using token from email.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token'    => 'required|string',
            'email'    => 'required|email',
            'password' => ['required', 'confirmed', PasswordRule::min(6)->max(128)],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password'       => $password,
                    'remember_token' => Str::random(60),
                ])->save();
                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json(['message' => __($status)], 422);
        }

        return response()->json(['message' => 'Password has been reset.']);
    }

    /**
     * Permissions clamped to modules enabled for the user's role.
     *
     * @param  array<string, bool>  $moduleVisibility
     * @return array<string, bool>
     */
    private static function effectivePermissions(User $user, array $moduleVisibility): array
    {
        $map = [
            'showCalendar'         => 'calendar',
            'showPatients'         => 'patients',
            'showDoctors'          => 'doctors',
            'showServices'         => 'services',
            'showUsers'            => 'users',
            'showSettings'         => 'settings',
            'showActivityLog'      => 'activity_log',
            'showReports'          => 'reports',
            'showMaterialsTools'   => 'materials_tools',
            'showPractitionerTypes'=> 'practitioner_types',
        ];

        $perms = $user->permissions;
        $out = [];
        foreach ($perms as $key => $enabled) {
            $moduleKey = $map[$key] ?? null;
            $moduleOn = ! $moduleKey || ($moduleVisibility[$moduleKey] ?? false);
            $out[$key] = $moduleOn && (bool) $enabled;
        }

        return $out;
    }
}
