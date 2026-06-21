<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\SessionRecord\StoreSessionRecordRequest;
use App\Http\Resources\SessionRecordResource;
use App\Models\PatientFile;
use App\Models\SessionRecord;
use App\Services\SessionRecordService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SessionRecordController extends Controller
{
    public function __construct(private readonly SessionRecordService $sessions)
    {
    }

    public function index(string $fileUuid): JsonResponse
    {
        $file = PatientFile::where('uuid', $fileUuid)->firstOrFail();
        $this->authorize('viewAny', [SessionRecord::class, $file]);

        $sessions = $file->sessions()
            ->with(['materialUsages.material', 'appointment', 'service', 'coupon'])
            ->latest('date')
            ->get();

        return response()->json(SessionRecordResource::collection($sessions));
    }

    public function store(StoreSessionRecordRequest $request, string $fileUuid): JsonResponse
    {
        $file = PatientFile::where('uuid', $fileUuid)->firstOrFail();
        $this->authorize('create', [SessionRecord::class, $file]);

        $session = $this->sessions->create($file, $request);

        return response()->json(new SessionRecordResource($session), 201);
    }

    public function show(string $fileUuid, string $sessionUuid): JsonResponse
    {
        $file    = PatientFile::where('uuid', $fileUuid)->firstOrFail();
        $session = SessionRecord::where('uuid', $sessionUuid)
            ->where('patient_file_id', $file->id)
            ->with(['materialUsages.material', 'appointment', 'service', 'coupon'])
            ->firstOrFail();

        $this->authorize('view', $session);

        return response()->json(new SessionRecordResource($session));
    }

    public function update(Request $request, string $fileUuid, string $sessionUuid): JsonResponse
    {
        $file    = PatientFile::where('uuid', $fileUuid)->firstOrFail();
        $session = SessionRecord::where('uuid', $sessionUuid)
            ->where('patient_file_id', $file->id)
            ->firstOrFail();

        $this->authorize('update', $session);

        $data = [];
        if ($request->has('notes'))        $data['notes']        = $request->notes;
        if ($request->has('performedBy'))  $data['performed_by'] = $request->performedBy;
        if ($request->has('date'))         $data['date']         = $request->date;

        $user = $request->user();
        if ($user && in_array($user->role, ['admin', 'accountant'], true)) {
            if ($request->has('servicePrice'))       $data['service_price']        = (float) $request->servicePrice;
            if ($request->has('totalMaterialsCost')) $data['total_materials_cost'] = (float) $request->totalMaterialsCost;
            if ($request->has('netProfit'))          $data['net_profit']           = (float) $request->netProfit;
            if (isset($data['service_price']) || isset($data['total_materials_cost'])) {
                $data['net_profit'] = ($data['service_price'] ?? $session->service_price) - ($data['total_materials_cost'] ?? $session->total_materials_cost);
            }
        }

        $session->update($data);
        $session->load(['materialUsages.material', 'appointment', 'service', 'coupon']);

        return response()->json(new SessionRecordResource($session));
    }

    public function destroy(string $fileUuid, string $sessionUuid): JsonResponse
    {
        $file    = PatientFile::where('uuid', $fileUuid)->firstOrFail();
        $session = SessionRecord::where('uuid', $sessionUuid)
            ->where('patient_file_id', $file->id)
            ->firstOrFail();

        $this->authorize('delete', $session);
        $session->delete();

        return response()->json(['message' => 'Session deleted']);
    }
}
