<?php

use App\Http\Controllers\Api\V1\ActivityLogController;
use App\Http\Controllers\Api\V1\AppointmentController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CouponController;
use App\Http\Controllers\Api\V1\DoctorController;
use App\Http\Controllers\Api\V1\MaterialOrToolController;
use App\Http\Controllers\Api\V1\NotificationRecordController;
use App\Http\Controllers\Api\V1\PatientController;
use App\Http\Controllers\Api\V1\PatientFileAttachmentController;
use App\Http\Controllers\Api\V1\PatientFileController;
use App\Http\Controllers\Api\V1\PatientPhotoController;
use App\Http\Controllers\Api\V1\PractitionerTypeController;
use App\Http\Controllers\Api\V1\PrescriptionController;
use App\Http\Controllers\Api\V1\ReportsController;
use App\Http\Controllers\Api\V1\ServiceController;
use App\Http\Controllers\Api\V1\SettingsController;
use App\Http\Controllers\Api\V1\SessionRecordController;
use App\Http\Controllers\Api\V1\SuperAdminController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Beauty Clinic API Routes — v1
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // ── Public ────────────────────────────────────────────────────────────
    Route::post('/auth/login', [AuthController::class, 'login'])
        ->middleware('throttle:5,1'); // 5 attempts per minute (brute-force protection)
    Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword'])
        ->middleware('throttle:3,1');
    Route::post('/auth/reset-password', [AuthController::class, 'resetPassword'])
        ->middleware('throttle:5,1');

    // ── Authenticated ─────────────────────────────────────────────────────
    Route::middleware(['auth:sanctum', 'sanitize'])->group(function () {

        // Auth
        Route::post('/auth/logout',   [AuthController::class, 'logout']);
        Route::get('/auth/me',        [AuthController::class, 'me']);
        Route::put('/auth/password',  [AuthController::class, 'changePassword']);

        // System modules & feature flags (read: all; update: superadmin only)
        Route::get('system/modules',       [SuperAdminController::class, 'modules']);
        Route::get('system/feature-flags', [SuperAdminController::class, 'featureFlags']);
        Route::put('system/modules',       [SuperAdminController::class, 'updateModules'])->middleware('role:superadmin');
        Route::put('system/feature-flags', [SuperAdminController::class, 'updateFeatureFlags'])->middleware('role:superadmin');

        // Super admin only: full activity log, all users, activate/deactivate
        Route::get('system/activity-log',  [SuperAdminController::class, 'activityLog'])->middleware('role:superadmin');
        Route::get('system/api-log',       [SuperAdminController::class, 'apiRequestLog'])->middleware('role:superadmin');
        Route::post('system/run-artisan',  [SuperAdminController::class, 'runArtisan'])->middleware('role:superadmin');
        Route::get('system/role-tab-visibility', [SuperAdminController::class, 'roleTabVisibility'])->middleware('role:superadmin');
        Route::put('system/role-tab-visibility', [SuperAdminController::class, 'updateRoleTabVisibility'])->middleware('role:superadmin');
        Route::get('system/users',         [SuperAdminController::class, 'users'])->middleware('role:superadmin');
        Route::put('system/users/{uuid}/active', [SuperAdminController::class, 'setUserActive'])->middleware('role:superadmin');

        // ── Admin only ───────────────────────────────────────────────────
        Route::middleware('role:admin')->group(function () {
            Route::get('activity-log', [ActivityLogController::class, 'index']);
            Route::apiResource('users', UserController::class);

            Route::apiResource('practitioner-types', PractitionerTypeController::class)
                ->only(['store', 'update', 'destroy']);

            Route::apiResource('doctors', DoctorController::class)
                ->only(['store', 'update', 'destroy']);

            Route::apiResource('services', ServiceController::class)
                ->only(['store', 'update', 'destroy']);

            Route::apiResource('materials-tools', MaterialOrToolController::class)
                ->only(['store', 'update', 'destroy']);
        });

        // ── All authenticated users ───────────────────────────────────────

        // Practitioner Types (read)
        Route::apiResource('practitioner-types', PractitionerTypeController::class)
            ->only(['index', 'show']);

        // Patients
        Route::apiResource('patients', PatientController::class);

        // Doctors (read; write is admin-only above)
        Route::apiResource('doctors', DoctorController::class)
            ->only(['index', 'show']);

        // Services (read)
        Route::apiResource('services', ServiceController::class)
            ->only(['index', 'show']);

        // Materials & Tools (read)
        Route::apiResource('materials-tools', MaterialOrToolController::class)
            ->only(['index', 'show']);

        // Coupon preview (any authenticated user booking a session)
        Route::post('coupons/preview', [CouponController::class, 'preview']);

        // Coupons CRUD (admin + assistant)
        Route::middleware('role:admin,assistant')->group(function () {
            Route::get('coupons', [CouponController::class, 'index']);
            Route::post('coupons', [CouponController::class, 'store']);
            Route::put('coupons/{uuid}', [CouponController::class, 'update']);
            Route::delete('coupons/{uuid}', [CouponController::class, 'destroy']);
        });

        // Appointments — specific routes BEFORE apiResource to avoid capture
        Route::get('appointments/date/{date}',    [AppointmentController::class, 'byDate']);
        Route::get('appointments/doctor/{uuid}',  [AppointmentController::class, 'byDoctor']);
        Route::apiResource('appointments', AppointmentController::class);

        // Patient Files (nested under patient)
        Route::get('patients/{patientUuid}/files',              [PatientFileController::class, 'index']);
        Route::get('patients/{patientUuid}/files/{doctorUuid}', [PatientFileController::class, 'show']);

        // Sub-resources of patient files
        Route::prefix('patient-files/{fileUuid}')->group(function () {
            // Sessions
            Route::apiResource('sessions', SessionRecordController::class)
                ->parameters(['sessions' => 'sessionUuid']);

            // Photos (upload via multipart form)
            Route::get('photos',             [PatientPhotoController::class, 'index']);
            Route::post('photos',            [PatientPhotoController::class, 'store']);
            Route::delete('photos/{photoUuid}', [PatientPhotoController::class, 'destroy']);

            // Attachments (doctor uploads; stored in patient file and DB)
            Route::get('attachments', [PatientFileAttachmentController::class, 'index']);
            Route::post('attachments', [PatientFileAttachmentController::class, 'store']);
            Route::delete('attachments/{attachmentUuid}', [PatientFileAttachmentController::class, 'destroy']);

            // Prescriptions
            Route::apiResource('prescriptions', PrescriptionController::class)
                ->parameters(['prescriptions' => 'uuid']);
        });

        // Reports (admin + accountant)
        Route::get('reports/sessions', [ReportsController::class, 'sessions'])
            ->middleware('role:admin,accountant');
        Route::get('reports/sessions/export', [ReportsController::class, 'exportSessions'])
            ->middleware('role:admin,accountant');

        // Notifications
        Route::get('notifications/pending', [NotificationRecordController::class, 'pending'])->middleware('role:admin,assistant,doctor,superadmin');
        Route::get('notifications',         [NotificationRecordController::class, 'index']);
        Route::post('notifications',        [NotificationRecordController::class, 'store']);
        Route::post('notifications/send-reminders', [NotificationRecordController::class, 'sendReminders'])->middleware('role:admin,assistant,doctor,superadmin');

        // Settings (admin/superadmin)
        Route::get('settings',  [SettingsController::class, 'index']);
        Route::put('settings',  [SettingsController::class, 'update'])->middleware('role:admin,superadmin');
    });
});
