import { apiFetch } from '../api';
import type { Coupon } from '../../app/types/index';

export type CouponPayload = {
  code: string;
  description?: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  maxDiscountAmount?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  maxUses?: number | null;
  isActive?: boolean;
};

export const couponService = {
  async list(): Promise<Coupon[]> {
    return apiFetch<Coupon[]>('/coupons');
  },

  async preview(code: string, baseAmount: number): Promise<{ couponCode: string; discountAmount: number; finalPrice: number }> {
    return apiFetch('/coupons/preview', {
      method: 'POST',
      body: { code, baseAmount },
    });
  },

  async create(data: CouponPayload): Promise<Coupon> {
    return apiFetch<Coupon>('/coupons', { method: 'POST', body: data });
  },

  async update(uuid: string, data: Partial<CouponPayload>): Promise<Coupon> {
    return apiFetch<Coupon>(`/coupons/${uuid}`, { method: 'PUT', body: data });
  },

  async remove(uuid: string): Promise<void> {
    await apiFetch(`/coupons/${uuid}`, { method: 'DELETE' });
  },
};
