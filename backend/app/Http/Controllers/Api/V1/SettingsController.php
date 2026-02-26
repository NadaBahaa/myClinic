<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    /**
     * Get settings (admin/superadmin can update).
     */
    public function index(): JsonResponse
    {
        $reminderDays = (int) Setting::get('reminder_days_before', 1);
        $reminderDays = $reminderDays < 1 ? 1 : ($reminderDays > 14 ? 14 : $reminderDays);

        return response()->json([
            'reminderDaysBefore' => $reminderDays,
        ]);
    }

    /**
     * Update settings (admin or superadmin).
     */
    public function update(Request $request): JsonResponse
    {
        if ($request->has('reminderDaysBefore')) {
            $days = (int) $request->reminderDaysBefore;
            $days = $days < 1 ? 1 : ($days > 14 ? 14 : $days);
            Setting::set('reminder_days_before', (string) $days);
        }

        return response()->json(['message' => 'Settings updated']);
    }
}
