<?php

use App\Http\Controllers\Api\V1\AppointmentController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\DoctorController;
use App\Http\Controllers\Api\V1\MaterialOrToolController;
use App\Http\Controllers\Api\V1\NotificationRecordController;
use App\Http\Controllers\Api\V1\PatientController;
use App\Http\Controllers\Api\V1\PatientFileController;
use App\Http\Controllers\Api\V1\PatientPhotoController;
use App\Http\Controllers\Api\V1\PractitionerTypeController;
use App\Http\Controllers\Api\V1\PrescriptionController;
use App\Http\Controllers\Api\V1\ServiceController;
use App\Http\Controllers\Api\V1\SessionRecordController;
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

    // ── Authenticated ─────────────────────────────────────────────────────
    Route::middleware(['auth:sanctum', 'sanitize'])->group(function () {

        // Auth
        Route::post('/auth/logout',   [AuthController::class, 'logout']);
        Route::get('/auth/me',        [AuthController::class, 'me']);
        Route::put('/auth/password',  [AuthController::class, 'changePassword']);

        // ── Admin only ───────────────────────────────────────────────────
        Route::middleware('role:admin')->group(function () {
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

            // Prescriptions
            Route::apiResource('prescriptions', PrescriptionController::class)
                ->parameters(['prescriptions' => 'uuid']);
        });

        // Notifications
        Route::get('notifications/pending', [NotificationRecordController::class, 'pending']);
        Route::get('notifications',         [NotificationRecordController::class, 'index']);
        Route::post('notifications',        [NotificationRecordController::class, 'store']);
    });
});
