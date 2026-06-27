<?php

namespace App\Services;

use App\Http\Requests\SessionRecord\StoreSessionRecordRequest;
use App\Models\Appointment;
use App\Models\Coupon;
use App\Models\MaterialOrTool;
use App\Models\PatientFile;
use App\Models\Service;
use App\Models\SessionMaterialUsage;
use App\Models\SessionRecord;

class SessionRecordService
{
    public function create(PatientFile $file, StoreSessionRecordRequest $request): SessionRecord
    {
        $serviceId = null;
        if ($request->serviceId) {
            $service   = Service::where('uuid', $request->serviceId)->first();
            $serviceId = $service?->id;
        }

        $appointmentId = null;
        if ($request->appointmentId) {
            $appointment   = Appointment::where('uuid', $request->appointmentId)->first();
            $appointmentId = $appointment?->id;
        }

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
            'total_materials_cost'   => 0,
            'net_profit'             => 0,
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

            if ($material->stock_quantity !== null) {
                $material->decrement('stock_quantity', $mu['quantity']);
            }
        }

        $session->update([
            'total_materials_cost' => $totalMaterialsCost,
            'net_profit'           => $finalServicePrice - $totalMaterialsCost,
        ]);

        $session->load(['materialUsages.material', 'appointment', 'service', 'coupon']);

        return $session;
    }

    /**
     * Quick checkout from Patients of the Day (no materials/coupon).
     */
    public function createFromCheckout(
        PatientFile $file,
        Appointment $appointment,
        Service $service,
        string $performedBy
    ): SessionRecord {
        $price = (float) $service->price;

        $session = SessionRecord::create([
            'patient_file_id'        => $file->id,
            'appointment_id'         => $appointment->id,
            'date'                   => $appointment->date->toDateString(),
            'service_id'             => $service->id,
            'coupon_id'              => null,
            'service_name'           => $service->name,
            'service_price'          => $price,
            'discount_amount'        => 0,
            'original_service_price' => null,
            'total_materials_cost'   => 0,
            'net_profit'             => $price,
            'performed_by'           => $performedBy,
            'notes'                  => 'Paid via assistant checkout',
        ]);

        $session->load(['materialUsages.material', 'appointment', 'service', 'coupon']);

        return $session;
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
