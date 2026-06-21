<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Appointment\StoreAppointmentRequest;
use App\Http\Requests\Appointment\UpdateAppointmentRequest;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use App\Policies\AppointmentPolicy;
use App\Services\AppointmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AppointmentController extends Controller
{
    public function __construct(private readonly AppointmentService $appointments)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Appointment::class);

        return response()->json(
            AppointmentResource::collection($this->appointments->list($request))
        );
    }

    public function store(StoreAppointmentRequest $request): JsonResponse
    {
        $this->authorize('create', Appointment::class);

        $doctor = Doctor::where('uuid', $request->doctorId)->firstOrFail();
        $patient = Patient::where('uuid', $request->patientId)->firstOrFail();

        if (! app(AppointmentPolicy::class)->createForDoctor($request->user(), $doctor)) {
            abort(403, 'You may only create appointments for yourself.');
        }
        if (! app(AppointmentPolicy::class)->createForPatient($request->user(), $patient, $doctor)) {
            abort(403, 'You do not have access to this patient.');
        }

        $appointment = $this->appointments->create($request->validated(), $request->user());

        return response()->json(new AppointmentResource($appointment), 201);
    }

    public function show(string $uuid): JsonResponse
    {
        $appt = Appointment::where('uuid', $uuid)->with(['patient', 'doctor', 'services'])->firstOrFail();
        $this->authorize('view', $appt);

        return response()->json(new AppointmentResource($appt));
    }

    public function update(UpdateAppointmentRequest $request, string $uuid): JsonResponse
    {
        $appt = Appointment::where('uuid', $uuid)->with(['patient', 'doctor'])->firstOrFail();
        $this->authorize('update', $appt);

        $appt = $this->appointments->update($appt, $request->validated(), $request->user());

        return response()->json(new AppointmentResource($appt));
    }

    public function destroy(string $uuid): JsonResponse
    {
        $appt = Appointment::where('uuid', $uuid)->firstOrFail();
        $this->authorize('delete', $appt);

        $this->appointments->cancel($appt, request()->user());

        return response()->json(['message' => 'Appointment cancelled']);
    }

    public function byDate(string $date): JsonResponse
    {
        $this->authorize('viewAny', Appointment::class);

        return response()->json(
            AppointmentResource::collection($this->appointments->byDate($date, request()))
        );
    }

    public function byDoctor(string $uuid): JsonResponse
    {
        $this->authorize('viewAny', Appointment::class);

        $doctor = Doctor::where('uuid', $uuid)->firstOrFail();

        return response()->json(
            AppointmentResource::collection($this->appointments->byDoctor($doctor, request()))
        );
    }
}
