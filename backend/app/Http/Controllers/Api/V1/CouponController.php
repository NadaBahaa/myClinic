<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CouponController extends Controller
{
    /**
     * Preview discount for a base amount (used when booking a session).
     */
    public function preview(Request $request): JsonResponse
    {
        $request->validate([
            'code'       => 'required|string|max:64',
            'baseAmount' => 'required|numeric|min:0',
        ]);

        $code   = strtoupper(trim($request->code));
        $coupon = Coupon::where('code', $code)->first();

        if (! $coupon || ! $coupon->isValidNow()) {
            return response()->json(['message' => 'Invalid or expired coupon.'], 422);
        }

        $base           = (float) $request->baseAmount;
        $discountAmount = $coupon->computeDiscountAmount($base);
        $finalPrice     = round(max(0, $base - $discountAmount), 2);

        return response()->json([
            'couponCode'     => $coupon->code,
            'discountAmount' => $discountAmount,
            'finalPrice'     => $finalPrice,
        ]);
    }

    public function index(): JsonResponse
    {
        $coupons = Coupon::query()->orderByDesc('created_at')->get();

        return response()->json($coupons->map(fn (Coupon $c) => $this->toArray($c)));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validatePayload($request);
        $coupon = Coupon::create($data);

        return response()->json($this->toArray($coupon), 201);
    }

    public function update(Request $request, string $uuid): JsonResponse
    {
        $coupon = Coupon::where('uuid', $uuid)->firstOrFail();
        $data = $this->validatePayload($request, $coupon->id);
        $coupon->update($data);

        return response()->json($this->toArray($coupon->fresh()));
    }

    public function destroy(string $uuid): JsonResponse
    {
        $coupon = Coupon::where('uuid', $uuid)->firstOrFail();
        $coupon->delete();

        return response()->json(['message' => 'Coupon removed']);
    }

    private function validatePayload(Request $request, ?int $ignoreId = null): array
    {
        $rules = [
            'code'                => ['required', 'string', 'max:64', Rule::unique('coupons', 'code')->ignore($ignoreId)],
            'description'         => 'nullable|string|max:500',
            'discountType'        => ['required', Rule::in([Coupon::TYPE_PERCENT, Coupon::TYPE_FIXED])],
            'discountValue'       => 'required|numeric|min:0',
            'maxDiscountAmount'   => 'nullable|numeric|min:0',
            'startsAt'            => 'nullable|date',
            'endsAt'              => 'nullable|date|after_or_equal:startsAt',
            'maxUses'             => 'nullable|integer|min:1',
            'isActive'            => 'sometimes|boolean',
        ];

        $validated = $request->validate($rules);

        if ($validated['discountType'] === Coupon::TYPE_PERCENT) {
            if ($validated['discountValue'] > 100) {
                abort(422, 'Percent discount cannot exceed 100.');
            }
        }

        $isActive = array_key_exists('isActive', $validated)
            ? (bool) $validated['isActive']
            : ($ignoreId === null ? true : Coupon::where('id', $ignoreId)->value('is_active'));

        return [
            'code'                  => strtoupper(trim($validated['code'])),
            'description'           => $validated['description'] ?? null,
            'discount_type'         => $validated['discountType'],
            'discount_value'        => (float) $validated['discountValue'],
            'max_discount_amount'   => isset($validated['maxDiscountAmount']) ? (float) $validated['maxDiscountAmount'] : null,
            'starts_at'             => $validated['startsAt'] ?? null,
            'ends_at'               => $validated['endsAt'] ?? null,
            'max_uses'              => $validated['maxUses'] ?? null,
            'is_active'             => (bool) $isActive,
        ];
    }

    private function toArray(Coupon $c): array
    {
        return [
            'id'                  => $c->uuid,
            'code'                => $c->code,
            'description'         => $c->description,
            'discountType'        => $c->discount_type,
            'discountValue'       => $c->discount_value,
            'maxDiscountAmount'   => $c->max_discount_amount,
            'startsAt'            => $c->starts_at?->toIso8601String(),
            'endsAt'              => $c->ends_at?->toIso8601String(),
            'maxUses'             => $c->max_uses,
            'usesCount'           => $c->uses_count,
            'isActive'            => $c->is_active,
        ];
    }
}
