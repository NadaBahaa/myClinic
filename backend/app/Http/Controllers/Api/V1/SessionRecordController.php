<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\SessionRecord\StoreSessionRecordRequest;
use App\Http\Resources\SessionRecordResource;
use App\Models\Appointment;
use App\Models\Coupon;
use App\Models\MaterialOrTool;
use App\Models\PatientFile;
use App\Models\Service;
use App\Models\SessionMaterialUsage;
use App\Models\SessionRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SessionRecordController extends Controller
{
    public function index(string $fileUuid): JsonResponse
    {
        $file = PatientFile::where('uuid', $fileUuid)->firstOrFail();
        $sessions = $file->sessions()->with(['materialUsages.material', 'appointment', 'service', 'coupon'])->latest('date')->get();

        return response()->json(SessionRecordResource::collection($sessions));
    }

    public function store(StoreSessionRecordRequest $request, string $fileUuid): JsonResponse
    {
        $file = PatientFile::where('uuid', $fileUuid)->firstOrFail();

        // Resolve service ID
        $serviceId = null;
        if ($request->serviceId) {
            $service   = Service::where('uuid', $request->serviceId)->first();
            $serviceId = $service?->id;
        }

        // Resolve appointment ID
        $appointmentId = null;
        if ($request->appointmentId) {
            $appointment   = Appointment::where('uuid', $request->appointmentId)->first();
            $appointmentId = $appointment?->id;
        }

        // Calculate materials cost
        $totalMaterialsCost = 0.0;
        $materialsPayload   = $request->materialsUsed ?? [];

        [$finalServicePrice, $discountAmount, $originalServicePrice, $couponId] = $this->resolveCouponPricing($request);

        $session = SessionRecord::create([
            'patient_file_id'        => $file->id,
            'appointment_id'         => $appointmentId,
            'date'                   => $request->date,
            'service_id'             => $serviceId,
            'coupon_id'              => $couponId,
            'service_name'           => $request->serviceName,
            'service_price'          => $finalServicePrice,
            'discount_amount'        => $discountAmount,
            'original_service_price' => $originalServicePrice,
            'total_materials_cost'   => 0, // updated below
            'net_profit'             => 0, // updated below
            'performed_by'           => $request->performedBy,
            'notes'                  => $request->notes,
        ]);

        foreach ($materialsPayload as $mu) {
            $material   = MaterialOrTool::where('uuid', $mu['materialId'])->firstOrFail();
            $totalPrice = round($mu['quantity'] * $mu['unitPrice'], 2);
            $totalMaterialsCost += $totalPrice;

            SessionMaterialUsage::create([
                'session_record_id' => $session->id,
                'material_id'       => $material->id,
                'material_name'     => $material->name,
                'quantity'          => $mu['quantity'],
                'unit_price'        => $mu['unitPrice'],
                'total_price'       => $totalPrice,
            ]);

            // Decrement stock if tracked
            if ($material->stock_quantity !== null) {
                $material->decrement('stock_quantity', $mu['quantity']);
            }
        }

        $session->update([
            'total_materials_cost' => $totalMaterialsCost,
            'net_profit'           => $finalServicePrice - $totalMaterialsCost,
        ]);

        $session->load(['materialUsages.material', 'appointment', 'service', 'coupon']);

        return response()->json(new SessionRecordResource($session), 201);
    }

    public function show(string $fileUuid, string $sessionUuid): JsonResponse
    {
        $file    = PatientFile::where('uuid', $fileUuid)->firstOrFail();
        $session = SessionRecord::where('uuid', $sessionUuid)
            ->where('patient_file_id', $file->id)
            ->with(['materialUsages.material', 'appointment', 'service', 'coupon'])
            ->firstOrFail();

        return response()->json(new SessionRecordResource($session));
    }

    public function update(Request $request, string $fileUuid, string $sessionUuid): JsonResponse
    {
        $file    = PatientFile::where('uuid', $fileUuid)->firstOrFail();
        $session = SessionRecord::where('uuid', $sessionUuid)
            ->where('patient_file_id', $file->id)
            ->firstOrFail();

        $data = [];
        if ($request->has('notes'))        $data['notes']        = $request->notes;
        if ($request->has('performedBy'))  $data['performed_by'] = $request->performedBy;
        if ($request->has('date'))         $data['date']         = $request->date;
        // Accountant/admin may correct financial fields
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

        $session->delete();

        return response()->json(['message' => 'Session deleted']);
    }

    /**
     * @return array{0: float, 1: float, 2: ?float, 3: ?int}
     */
    private function resolveCouponPricing(StoreSessionRecordRequest $request): array
    {
        $submittedFinal = (float) $request->servicePrice;
        $couponCode     = $request->couponCode ? strtoupper(trim((string) $request->couponCode)) : null;

        if (! $couponCode) {
            return [$submittedFinal, 0.0, null, null];
        }

        $coupon = Coupon::where('code', $couponCode)->first();
        if (! $coupon || ! $coupon->isValidNow()) {
            abort(422, 'Invalid or expired coupon.');
        }

        $original = $request->has('originalServicePrice') ? (float) $request->originalServicePrice : null;
        if ($original === null || $original <= 0) {
            abort(422, 'Original service price is required when using a coupon.');
        }

        $discountAmount = $coupon->computeDiscountAmount($original);
        $final          = round(max(0, $original - $discountAmount), 2);

        if (abs($final - $submittedFinal) > 0.02) {
            abort(422, 'Final price does not match the coupon discount. Refresh and try again.');
        }

        $coupon->incrementUsage();

        return [$final, $discountAmount, $original, $coupon->id];
    }
}
