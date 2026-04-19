import { useState, useEffect } from 'react';
import { Plus, Tag, Trash2, Edit2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Coupon } from '../types';
import { couponService } from '../../lib/services/couponService';

const emptyForm = {
  code: '',
  description: '',
  discountType: 'percent' as 'percent' | 'fixed',
  discountValue: 10,
  maxDiscountAmount: '' as string | number,
  startsAt: '',
  endsAt: '',
  maxUses: '' as string | number,
  isActive: true,
};

export default function CouponsView() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = () => {
    setLoading(true);
    couponService
      .list()
      .then(setCoupons)
      .catch(() => toast.error('Failed to load coupons'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code,
      description: c.description ?? '',
      discountType: c.discountType,
      discountValue: c.discountValue,
      maxDiscountAmount: c.maxDiscountAmount ?? '',
      startsAt: c.startsAt ? c.startsAt.slice(0, 16) : '',
      endsAt: c.endsAt ? c.endsAt.slice(0, 16) : '',
      maxUses: c.maxUses ?? '',
      isActive: c.isActive,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) {
      toast.error('Code is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim(),
        description: form.description.trim() || undefined,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        maxDiscountAmount: form.maxDiscountAmount === '' || form.maxDiscountAmount === null
          ? null
          : Number(form.maxDiscountAmount),
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
        maxUses: form.maxUses === '' || form.maxUses === null ? null : Number(form.maxUses),
        isActive: form.isActive,
      };
      if (editing) {
        await couponService.update(editing.id, payload);
        toast.success('Coupon updated');
      } else {
        await couponService.create(payload);
        toast.success('Coupon created');
      }
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: Coupon) => {
    if (!confirm(`Remove coupon ${c.code}?`)) return;
    try {
      await couponService.remove(c.id);
      toast.success('Coupon removed');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1 flex items-center gap-2">
            <Tag className="w-7 h-7 text-pink-600" />
            Coupons & discounts
          </h1>
          <p className="text-gray-600">Create codes for percent or fixed-amount discounts on sessions.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add coupon
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading…
        </div>
      ) : coupons.length === 0 ? (
        <p className="text-gray-600 py-8">No coupons yet. Add one to offer discounts at checkout.</p>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-700">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Uses</th>
                <th className="px-4 py-3">Valid</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3 w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {coupons.map((c) => (
                <tr key={c.id} className="bg-white hover:bg-gray-50/80">
                  <td className="px-4 py-3 font-mono font-medium text-gray-900">{c.code}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {c.discountType === 'percent'
                      ? `${c.discountValue}%`
                      : `$${c.discountValue.toFixed(2)}`}
                    {c.maxDiscountAmount != null && c.discountType === 'percent' && (
                      <span className="text-gray-500"> (max ${Number(c.maxDiscountAmount).toFixed(2)})</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {c.usesCount}
                    {c.maxUses != null ? ` / ${c.maxUses}` : ''}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {c.startsAt ? new Date(c.startsAt).toLocaleString() : '—'}
                    {' → '}
                    {c.endsAt ? new Date(c.endsAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs ${
                        c.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {c.isActive ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        aria-label="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(c)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-xl text-gray-900">{editing ? 'Edit coupon' : 'New coupon'}</h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block mb-1 text-gray-700">Code *</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                  placeholder="SUMMER20"
                  disabled={!!editing}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-gray-700">Description</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-gray-700">Type</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value as 'percent' | 'fixed' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="percent">Percent</option>
                    <option value="fixed">Fixed amount</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-gray-700">
                    {form.discountType === 'percent' ? 'Percent off' : 'Amount off ($)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step={form.discountType === 'percent' ? '1' : '0.01'}
                    max={form.discountType === 'percent' ? '100' : undefined}
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              </div>
              {form.discountType === 'percent' && (
                <div>
                  <label className="block mb-1 text-gray-700">Max discount cap ($, optional)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.maxDiscountAmount}
                    onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-gray-700">Starts (optional)</label>
                  <input
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-700">Ends (optional)</label>
                  <input
                    type="datetime-local"
                    value={form.endsAt}
                    onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-1 text-gray-700">Max total uses (optional)</label>
                <input
                  type="number"
                  min="1"
                  value={form.maxUses}
                  onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                <span className="text-gray-700">Active</span>
              </label>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
