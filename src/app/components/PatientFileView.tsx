import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Upload, Image as ImageIcon, FileText, Plus, Trash2, 
  DollarSign, Package, TrendingUp, Calendar, Edit2, Loader2, Tag, Maximize2
} from 'lucide-react';
import { 
  PatientFile, SessionRecord, PatientPhoto, Prescription, 
  SessionMaterialUsage, MaterialOrTool 
} from '../types';
import { toast } from 'sonner';
import { patientFileService } from '../../lib/services/patientFileService';
import { materialService } from '../../lib/services/materialService';
import { couponService } from '../../lib/services/couponService';
import { formatLocalDateYYYYMMDD } from '../../lib/date';
import { appointmentService } from '../../lib/services/appointmentService';
import { resolveStorageAssetUrl } from '../../lib/assetUrl';
import { normalizePatientPhoto } from '../../lib/patientPhoto';
import { serviceService, type ClinicService } from '../../lib/services/serviceService';

function mergeSessionDefaultsFromService(
  current: SessionMaterialUsage[],
  defaults: { materialId: string; defaultQuantity: number }[] | undefined,
  catalog: MaterialOrTool[],
): SessionMaterialUsage[] {
  if (!defaults?.length) return current;
  const byId = new Map(current.map((m) => [m.materialId, { ...m }]));
  for (const d of defaults) {
    if (byId.has(d.materialId)) continue;
    const mat = catalog.find((c) => c.id === d.materialId);
    if (!mat) continue;
    const qty = d.defaultQuantity;
    const unitPrice = mat.unitPrice ?? 0;
    byId.set(d.materialId, {
      materialId: d.materialId,
      materialName: mat.name,
      quantity: qty,
      unitPrice,
      totalPrice: Math.round(unitPrice * qty * 100) / 100,
    });
  }
  return Array.from(byId.values());
}

function parseFileDates(file: PatientFile): PatientFile {
  return {
    ...file,
    createdAt: new Date(file.createdAt),
    sessions: (file.sessions || []).map((s: SessionRecord) => ({
      ...s,
      date: new Date(s.date),
    })),
    photos: (file.photos || []).map((p) => normalizePatientPhoto(p)),
    prescriptions: (file.prescriptions || []).map((r: Prescription) => ({
      ...r,
      prescribedAt: new Date(r.prescribedAt),
    })),
  };
}

interface PatientFileViewProps {
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  onClose: () => void;
}

function PhotoUploadButtons({ onUpload }: { onUpload: (type: 'before' | 'after' | 'during', file: File, notes?: string) => void }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const typeRef = React.useRef<'before' | 'after' | 'during'>('before');
  const handleClick = (type: 'before' | 'after' | 'during') => {
    typeRef.current = type;
    inputRef.current?.click();
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(typeRef.current, file);
    e.target.value = '';
  };
  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      <button type="button" onClick={() => handleClick('before')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
        <Upload className="w-4 h-4" /> Before
      </button>
      <button type="button" onClick={() => handleClick('during')} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm">
        <Upload className="w-4 h-4" /> During
      </button>
      <button type="button" onClick={() => handleClick('after')} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
        <Upload className="w-4 h-4" /> After
      </button>
    </>
  );
}

interface SessionModalProps {
  session: SessionRecord | null;
  patientName: string;
  performedBy: string;
  onClose: () => void;
  onSave: (session: SessionRecord) => void;
}

function SessionModal({ session, patientName, performedBy, onClose, onSave }: SessionModalProps) {
  const isEditing = !!(session?.id);
  const mergedDefaultsRef = useRef<string | null>(null);

  const [formData, setFormData] = useState<SessionRecord>(
    session || {
      id: '',
      appointmentId: '',
      date: new Date(),
      serviceId: '',
      serviceName: '',
      servicePrice: 0,
      materialsUsed: [],
      totalMaterialsCost: 0,
      netProfit: 0,
      notes: '',
      performedBy: performedBy || '',
    }
  );

  const [listPrice, setListPrice] = useState(0);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);

  const [materials, setMaterials] = useState<MaterialOrTool[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [servicesCatalog, setServicesCatalog] = useState<ClinicService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [materialQuantity, setMaterialQuantity] = useState(1);
  const [materialUnitPrice, setMaterialUnitPrice] = useState(0);

  const syncNetProfit = (servicePrice: number, materialsUsed: SessionMaterialUsage[]) => {
    const totalMaterialsCost = materialsUsed.reduce((sum, m) => sum + m.totalPrice, 0);
    return {
      totalMaterialsCost,
      netProfit: Math.round((servicePrice - totalMaterialsCost) * 100) / 100,
    };
  };

  useEffect(() => {
    if (!session) mergedDefaultsRef.current = null;
  }, [session]);

  useEffect(() => {
    materialService.getAll()
      .then((list) => {
        setMaterials(list);
        if (list.length > 0 && !selectedMaterial) setMaterialUnitPrice(list[0].unitPrice ?? 0);
      })
      .catch(() => toast.error('Failed to load materials/tools'))
      .finally(() => setMaterialsLoading(false));
  }, []);

  useEffect(() => {
    serviceService
      .getAll()
      .then(setServicesCatalog)
      .catch(() => {})
      .finally(() => setServicesLoading(false));
  }, []);

  useEffect(() => {
    const m = materials.find((x) => x.id === selectedMaterial);
    if (m) setMaterialUnitPrice(m.unitPrice ?? 0);
  }, [selectedMaterial, materials]);

  useEffect(() => {
    if (session) {
      const base = session.originalServicePrice ?? session.servicePrice;
      setListPrice(base);
      setCouponInput(session.couponCode ?? '');
      setAppliedCoupon(session.couponCode ?? null);
      setDiscountAmount(session.discountAmount ?? 0);
      setFormData({
        ...session,
        date: typeof session.date === 'string' ? new Date(session.date) : session.date,
      });
    } else {
      setListPrice(0);
      setCouponInput('');
      setAppliedCoupon(null);
      setDiscountAmount(0);
      setFormData({
        id: '',
        appointmentId: '',
        date: new Date(),
        serviceId: '',
        serviceName: '',
        servicePrice: 0,
        materialsUsed: [],
        totalMaterialsCost: 0,
        netProfit: 0,
        notes: '',
        performedBy: performedBy || '',
      });
    }
  }, [session, performedBy]);

  useEffect(() => {
    if (!session || session.id) return;
    if (materialsLoading || servicesLoading) return;
    if (!session.serviceId || (session.materialsUsed?.length ?? 0) > 0) return;
    const key = `${session.appointmentId ?? 'na'}-${session.serviceId}`;
    if (mergedDefaultsRef.current === key) return;
    const svc = servicesCatalog.find((s) => s.id === session.serviceId);
    if (!svc?.defaultMaterials?.length || materials.length === 0) return;
    const merged = mergeSessionDefaultsFromService([], svc.defaultMaterials, materials);
    if (!merged.length) {
      mergedDefaultsRef.current = key;
      return;
    }
    const price = svc.price ?? 0;
    setListPrice(price);
    const { totalMaterialsCost, netProfit } = syncNetProfit(price, merged);
    setFormData((prev) => ({
      ...prev,
      serviceName: prev.serviceName || svc.name,
      servicePrice: price,
      materialsUsed: merged,
      totalMaterialsCost,
      netProfit,
    }));
    mergedDefaultsRef.current = key;
  }, [session, materialsLoading, servicesLoading, materials, servicesCatalog]);

  const handleListPriceChange = (value: number) => {
    setListPrice(value);
    setAppliedCoupon(null);
    setDiscountAmount(0);
    const { totalMaterialsCost, netProfit } = syncNetProfit(value, formData.materialsUsed);
    setFormData({
      ...formData,
      servicePrice: value,
      totalMaterialsCost,
      netProfit,
    });
  };

  const handleCatalogServiceChange = (uuid: string) => {
    if (!uuid) {
      setFormData((prev) => ({ ...prev, serviceId: '' }));
      return;
    }
    const svc = servicesCatalog.find((s) => s.id === uuid);
    if (!svc) return;
    setListPrice(svc.price ?? 0);
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setFormData((prev) => {
      const merged = mergeSessionDefaultsFromService(prev.materialsUsed, svc.defaultMaterials, materials);
      const price = svc.price ?? 0;
      const { totalMaterialsCost, netProfit } = syncNetProfit(price, merged);
      return {
        ...prev,
        serviceId: svc.id,
        serviceName: svc.name,
        servicePrice: price,
        materialsUsed: merged,
        totalMaterialsCost,
        netProfit,
      };
    });
  };

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) {
      toast.error('Enter a coupon code');
      return;
    }
    if (listPrice <= 0) {
      toast.error('Set a list price before applying a coupon');
      return;
    }
    setPreviewLoading(true);
    try {
      const res = await couponService.preview(code, listPrice);
      setAppliedCoupon(res.couponCode);
      setDiscountAmount(res.discountAmount);
      const { totalMaterialsCost, netProfit } = syncNetProfit(res.finalPrice, formData.materialsUsed);
      setFormData((prev) => ({
        ...prev,
        servicePrice: res.finalPrice,
        totalMaterialsCost,
        netProfit,
      }));
      toast.success('Coupon applied');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Invalid coupon');
      setAppliedCoupon(null);
      setDiscountAmount(0);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleClearCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    const { totalMaterialsCost, netProfit } = syncNetProfit(listPrice, formData.materialsUsed);
    setFormData((prev) => ({
      ...prev,
      servicePrice: listPrice,
      totalMaterialsCost,
      netProfit,
    }));
  };

  const handleAddMaterial = () => {
    if (!selectedMaterial) return;
    const material = materials.find((m) => m.id === selectedMaterial);
    if (!material) return;

    const unitPrice = materialUnitPrice >= 0 ? materialUnitPrice : material.unitPrice ?? 0;
    const totalPrice = Math.round(unitPrice * materialQuantity * 100) / 100;
    const newMaterial: SessionMaterialUsage = {
      materialId: material.id,
      materialName: material.name,
      quantity: materialQuantity,
      unitPrice,
      totalPrice,
    };

    const updatedMaterials = [...formData.materialsUsed, newMaterial];
    const { totalMaterialsCost, netProfit } = syncNetProfit(formData.servicePrice, updatedMaterials);

    setFormData({
      ...formData,
      materialsUsed: updatedMaterials,
      totalMaterialsCost,
      netProfit,
    });

    setSelectedMaterial('');
    setMaterialQuantity(1);
    if (material) setMaterialUnitPrice(material.unitPrice ?? 0);
  };

  const handleRemoveMaterial = (index: number) => {
    const updatedMaterials = formData.materialsUsed.filter((_, i) => i !== index);
    const { totalMaterialsCost, netProfit } = syncNetProfit(formData.servicePrice, updatedMaterials);

    setFormData({
      ...formData,
      materialsUsed: updatedMaterials,
      totalMaterialsCost,
      netProfit,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.serviceName || formData.servicePrice <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    const out: SessionRecord = {
      ...formData,
      id: formData.id || `session-${Date.now()}`,
    };

    if (!isEditing && appliedCoupon) {
      out.couponCode = appliedCoupon;
      out.originalServicePrice = listPrice;
      out.discountAmount = discountAmount;
    }

    onSave(out);
    onClose();
  };

  const showCouponUi = !isEditing;
  const couponReadOnly = isEditing && !!(session?.couponCode);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-xl text-gray-900">
            {isEditing ? 'Edit' : 'Add'} Session for {patientName}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {!isEditing && (
            <div>
              <label className="block mb-2 text-gray-700">Service from catalog (optional)</label>
              {servicesLoading ? (
                <p className="text-sm text-gray-500">Loading services…</p>
              ) : (
                <select
                  value={formData.serviceId}
                  onChange={(e) => handleCatalogServiceChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                >
                  <option value="">Custom — type below</option>
                  {servicesCatalog.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (${(s.price ?? 0).toFixed(2)})
                    </option>
                  ))}
                </select>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Choosing a catalog service fills price and suggested materials/tools from the service setup.
              </p>
            </div>
          )}

          {/* Service Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-gray-700">Service Name *</label>
              <input
                type="text"
                value={formData.serviceName}
                onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                placeholder="Enter service name"
                required
              />
            </div>
            <div>
              <label className="block mb-2 text-gray-700">List price ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={listPrice}
                onChange={(e) => handleListPriceChange(parseFloat(e.target.value) || 0)}
                disabled={couponReadOnly}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600 disabled:bg-gray-100"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Price before any coupon</p>
            </div>
          </div>

          {showCouponUi && (
            <div className="flex flex-wrap items-end gap-2 p-4 bg-pink-50/80 rounded-lg border border-pink-100">
              <Tag className="w-5 h-5 text-pink-600 flex-shrink-0 mb-2" />
              <div className="flex-1 min-w-[140px]">
                <label className="block mb-1 text-sm text-gray-700">Coupon code</label>
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono uppercase"
                  placeholder="OPTIONAL"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={previewLoading}
                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 flex items-center gap-2"
              >
                {previewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Apply
              </button>
              {appliedCoupon && (
                <button type="button" onClick={handleClearCoupon} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Clear
                </button>
              )}
            </div>
          )}

          {couponReadOnly && session && (
            <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-700 space-y-1">
              <p><span className="text-gray-500">Coupon:</span> <span className="font-mono font-medium">{session.couponCode}</span></p>
              <p><span className="text-gray-500">Discount:</span> −${(session.discountAmount ?? 0).toFixed(2)}</p>
              <p><span className="text-gray-500">Amount charged:</span> ${session.servicePrice.toFixed(2)}</p>
            </div>
          )}

          <div>
            <label className="block mb-2 text-gray-700">Date</label>
            <input
              type="date"
              value={formatLocalDateYYYYMMDD(formData.date)}
              onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
            />
          </div>

          {/* Materials Used */}
          <div>
            <label className="block mb-2 text-gray-700">Materials & Tools Used (change price per session)</label>
            {materialsLoading ? (
              <p className="text-sm text-gray-500">Loading materials...</p>
            ) : (
              <div className="flex flex-wrap gap-2 mb-3 items-end">
                <select
                  value={selectedMaterial}
                  onChange={(e) => setSelectedMaterial(e.target.value)}
                  className="flex-1 min-w-[180px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                >
                  <option value="">Select material/tool...</option>
                  {materials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name} (${(material.unitPrice ?? 0).toFixed(2)}/{material.unit ?? 'unit'})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={materialQuantity}
                  onChange={(e) => setMaterialQuantity(parseFloat(e.target.value) || 1)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                  placeholder="Qty"
                />
                <div className="flex items-center gap-1">
                  <span className="text-gray-600 text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={materialUnitPrice}
                    onChange={(e) => setMaterialUnitPrice(parseFloat(e.target.value) || 0)}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                    placeholder="Price"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddMaterial}
                  disabled={!selectedMaterial}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Materials List */}
            {formData.materialsUsed.length > 0 && (
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                {formData.materialsUsed.map((material, index) => (
                  <div key={index} className="p-3 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-gray-900">{material.materialName}</p>
                      <p className="text-sm text-gray-600">
                        {material.quantity} × ${material.unitPrice.toFixed(2)} = ${material.totalPrice.toFixed(2)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMaterial(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Financial Summary */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            {(appliedCoupon || (couponReadOnly && (session?.discountAmount ?? 0) > 0)) && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Coupon discount:</span>
                <span className="text-amber-700">
                  −${(couponReadOnly ? (session?.discountAmount ?? 0) : discountAmount).toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Amount charged:</span>
              <span className="text-gray-900">${formData.servicePrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Materials Cost:</span>
              <span className="text-red-600">-${formData.totalMaterialsCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="text-gray-900">Net Profit:</span>
              <span className={`text-lg ${formData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${formData.netProfit.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block mb-2 text-gray-700">Session Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
              rows={3}
              placeholder="Additional notes about the session..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              {isEditing ? 'Update' : 'Add'} Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PatientFileView({ 
  patientId, 
  patientName, 
  doctorId, 
  doctorName,
  onClose 
}: PatientFileViewProps) {
  const [activeTab, setActiveTab] = useState<'sessions' | 'photos' | 'prescriptions' | 'attachments'>('sessions');
  const [patientFile, setPatientFile] = useState<PatientFile | null>(null);
  const [attachments, setAttachments] = useState<{ id: string; name: string; path: string; mimeType?: string; sessionId?: string; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [photoSortOrder, setPhotoSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoThumbError, setPhotoThumbError] = useState<Record<string, boolean>>({});

  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionRecord | null>(null);
  const [linkedAppointments, setLinkedAppointments] = useState<import('../../lib/services/appointmentService').Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);

  useEffect(() => {
    patientFileService.getFile(patientId, doctorId)
      .then((file) => setPatientFile(parseFileDates(file as PatientFile)))
      .catch(() => {
        toast.error('Failed to load patient file');
        onClose();
      })
      .finally(() => setLoading(false));
  }, [patientId, doctorId]);

  useEffect(() => {
    setAppointmentsLoading(true);
    appointmentService
      .search({ patient: patientId, doctor: doctorId })
      .then((list) => setLinkedAppointments(Array.isArray(list) ? list : []))
      .catch(() => setLinkedAppointments([]))
      .finally(() => setAppointmentsLoading(false));
  }, [patientId, doctorId]);

  useEffect(() => {
    if (!photoPreviewUrl) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPhotoPreviewUrl(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [photoPreviewUrl]);

  const noAppointmentsForThisDoctor =
    !appointmentsLoading && linkedAppointments.length === 0;

  const fileId = patientFile?.id;

  useEffect(() => {
    if (fileId && activeTab === 'attachments') {
      patientFileService.getAttachments(fileId).then(setAttachments).catch(() => setAttachments([]));
    }
  }, [fileId, activeTab]);

  const photosSorted = patientFile?.photos
    ? [...patientFile.photos].sort((a, b) => {
        const tA = new Date(a.uploadedAt).getTime();
        const tB = new Date(b.uploadedAt).getTime();
        return photoSortOrder === 'newest' ? tB - tA : tA - tB;
      })
    : [];

  const handleAddSession = () => {
    setSelectedSession(null);
    setIsSessionModalOpen(true);
  };

  const handleAddSessionFromAppointment = (apt: import('../../lib/services/appointmentService').Appointment) => {
    const prefill: SessionRecord = {
      id: '',
      appointmentId: apt.id,
      appointmentDate: apt.date,
      appointmentTime: apt.startTime,
      date: new Date(apt.date),
      serviceId: (apt.serviceIds?.[0] ?? ''),
      serviceName: (apt.services?.join(', ') || ''),
      servicePrice: 0,
      discountAmount: 0,
      originalServicePrice: null,
      couponCode: null,
      materialsUsed: [],
      totalMaterialsCost: 0,
      netProfit: 0,
      notes: '',
      performedBy: doctorName,
    };
    setSelectedSession(prefill);
    setIsSessionModalOpen(true);
  };

  const handleEditSession = (session: SessionRecord) => {
    setSelectedSession(session);
    setIsSessionModalOpen(true);
  };

  const handleSaveSession = async (session: SessionRecord) => {
    if (!patientFile || !fileId) return;
    const dateStr = typeof session.date === 'string' ? session.date : formatLocalDateYYYYMMDD(session.date);
    const performedBy = session.performedBy || doctorName;
    const notes = session.notes ?? '';
    const payload: Record<string, unknown> = {
      date: dateStr,
      appointmentId: session.appointmentId || undefined,
      serviceId: session.serviceId || undefined,
      serviceName: session.serviceName,
      servicePrice: session.servicePrice,
      performedBy,
      notes,
      materialsUsed: session.materialsUsed.map((m) => ({ materialId: m.materialId, quantity: m.quantity, unitPrice: m.unitPrice })),
    };
    if (!selectedSession?.id && session.couponCode && session.originalServicePrice != null) {
      payload.couponCode = session.couponCode;
      payload.originalServicePrice = session.originalServicePrice;
    }
    try {
      if (selectedSession?.id) {
        await patientFileService.updateSession(fileId, selectedSession.id, { notes, date: dateStr as unknown as Date, performedBy });
        setPatientFile(prev => prev ? ({ ...prev, sessions: prev.sessions.map(s => s.id === session.id ? { ...session, date: typeof session.date === 'string' ? new Date(session.date) : session.date } : s) }) : null);
        toast.success('Session updated successfully');
      } else {
        const created = await patientFileService.createSession(fileId, payload) as SessionRecord & { date?: string };
        const newSession: SessionRecord = {
          ...created,
          date: created.date ? new Date(created.date) : new Date(),
        };
        setPatientFile(prev => prev ? ({ ...prev, sessions: [...prev.sessions, newSession] }) : null);
        toast.success('Session added successfully');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save session');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!fileId || !confirm('Are you sure you want to delete this session?')) return;
    try {
      await patientFileService.deleteSession(fileId, sessionId);
      setPatientFile(prev => prev ? ({ ...prev, sessions: prev.sessions.filter(s => s.id !== sessionId) }) : null);
      toast.success('Session deleted');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete session');
    }
  };

  const handlePhotoUpload = async (type: 'before' | 'after' | 'during', file: File, notes?: string) => {
    if (!fileId) return;
    try {
      await patientFileService.uploadPhoto(fileId, file, type, notes);
      const photos = await patientFileService.getPhotos(fileId);
      setPatientFile((prev) =>
        prev ? { ...prev, photos: photos.map(normalizePatientPhoto) } : null,
      );
      setPhotoThumbError({});
      toast.success('Photo uploaded successfully');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!fileId || !confirm('Are you sure you want to delete this photo?')) return;
    try {
      await patientFileService.deletePhoto(fileId, photoId);
      setPatientFile(prev => prev ? { ...prev, photos: prev.photos.filter(p => p.id !== photoId) } : null);
      toast.success('Photo deleted');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  const handleAddPrescription = () => {
    const name = prompt('Enter prescription name:');
    if (!name) return;

    const newPrescription: Prescription = {
      id: `rx-${Date.now()}`,
      name,
      prescribedAt: new Date(),
      prescribedBy: doctorName,
    };

    setPatientFile(prev => (prev ? ({
      ...prev,
      prescriptions: [...prev.prescriptions, newPrescription],
    }) : prev));
    toast.success('Prescription added successfully');
  };

  const handleDeletePrescription = (prescriptionId: string) => {
    if (confirm('Are you sure you want to delete this prescription?')) {
      setPatientFile(prev => (prev ? ({
        ...prev,
        prescriptions: prev.prescriptions.filter(p => p.id !== prescriptionId),
      }) : prev));
      toast.success('Prescription deleted successfully');
    }
  };

  const totalRevenue = (patientFile?.sessions ?? []).reduce((sum, s) => sum + s.servicePrice, 0);
  const totalCosts = (patientFile?.sessions ?? []).reduce((sum, s) => sum + s.totalMaterialsCost, 0);
  const totalProfit = totalRevenue - totalCosts;

  if (loading || !patientFile) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 text-gray-600">Loading patient file...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl text-gray-900">{patientName}'s Medical File</h2>
            {!noAppointmentsForThisDoctor && (
              <p className="text-sm text-gray-600">Managed by {doctorName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Financial Summary */}
        <div className="p-6 bg-gradient-to-r from-pink-50 to-purple-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600">Total Sessions</span>
              </div>
              <p className="text-2xl text-gray-900">{patientFile.sessions.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-600">Total Revenue</span>
              </div>
              <p className="text-2xl text-blue-600">${totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4 text-red-600" />
                <span className="text-sm text-gray-600">Materials Cost</span>
              </div>
              <p className="text-2xl text-red-600">${totalCosts.toFixed(2)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-600">Net Profit</span>
              </div>
              <p className={`text-2xl ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${totalProfit.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-6 py-3 border-b-2 transition-colors ${
                activeTab === 'sessions'
                  ? 'border-pink-600 text-pink-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Sessions ({patientFile.sessions.length})
            </button>
            <button
              onClick={() => setActiveTab('photos')}
              className={`px-6 py-3 border-b-2 transition-colors ${
                activeTab === 'photos'
                  ? 'border-pink-600 text-pink-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Photos ({patientFile.photos.length})
            </button>
            <button
              onClick={() => setActiveTab('prescriptions')}
              className={`px-6 py-3 border-b-2 transition-colors ${
                activeTab === 'prescriptions'
                  ? 'border-pink-600 text-pink-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Prescriptions ({patientFile.prescriptions.length})
            </button>
            <button
              onClick={() => setActiveTab('attachments')}
              className={`px-6 py-3 border-b-2 transition-colors ${
                activeTab === 'attachments'
                  ? 'border-pink-600 text-pink-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Upload className="w-4 h-4 inline mr-1" />
              Attachments ({attachments.length})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Sessions Tab */}
          {activeTab === 'sessions' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg text-gray-900">Treatment Sessions</h3>
                <button
                  onClick={handleAddSession}
                  className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add Session
                </button>
              </div>

              <div className="mb-6">
                <h4 className="text-sm text-gray-700 mb-2">Appointments (Booked / Completed)</h4>
                {appointmentsLoading ? (
                  <div className="text-sm text-gray-500">Loading appointments…</div>
                ) : linkedAppointments.length === 0 ? (
                  <div className="text-sm text-gray-500">No appointments found.</div>
                ) : (
                  <div className="space-y-2">
                    {[...linkedAppointments]
                      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.startTime.localeCompare(a.startTime)))
                      .slice(0, 15)
                      .map((apt) => {
                        const hasSession = patientFile.sessions.some((s) => s.appointmentId === apt.id);
                        return (
                          <div key={apt.id} className="border border-gray-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm text-gray-900 font-medium">{apt.date}</span>
                                <span className="text-sm text-gray-600">{apt.startTime}–{apt.endTime}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  apt.status === 'completed' ? 'bg-green-100 text-green-700'
                                  : apt.status === 'scheduled' ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {apt.status}
                                </span>
                                {hasSession && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">Session recorded</span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {(apt.services ?? []).join(', ') || '—'}
                              </div>
                            </div>
                            {/* {!hasSession && apt.status === 'completed' && (
                              <button
                                type="button"
                                onClick={() => handleAddSessionFromAppointment(apt)}
                                className="px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-black transition-colors"
                              >
                                Create session
                              </button>
                            )} */}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {patientFile.sessions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No sessions recorded yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {[...patientFile.sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((session) => (
                    <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-lg text-gray-900">{session.serviceName}</h4>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                            <p className="text-sm text-gray-600">
                              {session.date.toLocaleDateString()}
                              {session.appointmentTime ? ` at ${session.appointmentTime}` : ''}
                            </p>
                            <p className="text-sm text-gray-600">• By <span className="font-medium">{session.performedBy}</span></p>
                            {session.appointmentId && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                                Linked to Appointment
                              </span>
                            )}
                          </div>
                          {!noAppointmentsForThisDoctor && (
                            <p className="text-xs text-gray-500 mt-1">
                              Doctor: <span className="font-medium text-gray-700">{doctorName}</span>
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditSession(session)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSession(session.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-500">List Price</p>
                          <p className="text-base text-gray-900">
                            {session.originalServicePrice != null
                              ? `EGP ${session.originalServicePrice.toFixed(2)}`
                              : `EGP ${session.servicePrice.toFixed(2)}`}
                          </p>
                        </div>
                        {(session.discountAmount ?? 0) > 0 && (
                          <div>
                            <p className="text-xs text-gray-500">Discount{session.couponCode ? ` (${session.couponCode})` : ''}</p>
                            <p className="text-base text-amber-600">−EGP {(session.discountAmount ?? 0).toFixed(2)}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-gray-500">Charged</p>
                          <p className="text-base text-blue-700">EGP {session.servicePrice.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Materials Cost</p>
                          <p className="text-base text-red-600">−EGP {session.totalMaterialsCost.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Net Profit</p>
                          <p className={`text-base font-semibold ${session.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            EGP {session.netProfit.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {session.materialsUsed.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-600 mb-2">Materials Used:</p>
                          <div className="flex flex-wrap gap-2">
                            {session.materialsUsed.map((material, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                              >
                                {material.materialName} ×{material.quantity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {session.notes && (
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                          {session.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Photos Tab */}
          {activeTab === 'photos' && (
            <div>
              <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                <h3 className="text-lg text-gray-900">Patient Photos (by date added)</h3>
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={photoSortOrder}
                    onChange={(e) => setPhotoSortOrder(e.target.value as 'newest' | 'oldest')}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                  </select>
                  <PhotoUploadButtons onUpload={handlePhotoUpload} />
                </div>
              </div>

              {photosSorted.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No photos uploaded yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {photosSorted.map((photo) => {
                    const src = resolveStorageAssetUrl(photo.url);
                    return (
                    <div key={photo.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                      <button
                        type="button"
                        className="relative block w-full text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"
                        onClick={() => src && setPhotoPreviewUrl(src)}
                        aria-label={`Preview ${photo.type} photo`}
                      >
                        {photoThumbError[photo.id] || !src ? (
                          <div className="w-full h-48 flex flex-col items-center justify-center gap-2 bg-gray-100 text-gray-500 text-sm px-4 text-center">
                            <ImageIcon className="w-10 h-10 opacity-50" />
                            <span>Preview unavailable</span>
                          </div>
                        ) : (
                          <span className="block w-full h-48 overflow-hidden bg-gray-100">
                            <img
                              src={src}
                              alt={`${photo.type} photo`}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover transition-transform group-hover:scale-[1.02]"
                              onError={() =>
                                setPhotoThumbError((prev) => ({ ...prev, [photo.id]: true }))
                              }
                            />
                          </span>
                        )}
                        <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/55 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                          <Maximize2 className="w-3.5 h-3.5" />
                          Preview
                        </span>
                      </button>
                      <div className="p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            photo.type === 'before' ? 'bg-blue-100 text-blue-700' :
                            photo.type === 'during' ? 'bg-purple-100 text-purple-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {photo.type.charAt(0).toUpperCase() + photo.type.slice(1)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeletePhoto(photo.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600">
                          {new Date(photo.uploadedAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">By {photo.uploadedBy}</p>
                        {photo.notes ? (
                          <p className="text-xs text-gray-600 mt-2 border-t border-gray-100 pt-2">{photo.notes}</p>
                        ) : null}
                      </div>
                    </div>
                  );})}
                </div>
              )}
            </div>
          )}

          {/* Prescriptions Tab */}
          {activeTab === 'prescriptions' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg text-gray-900">Prescriptions</h3>
                <button
                  onClick={handleAddPrescription}
                  className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Add Prescription
                </button>
              </div>

              {patientFile.prescriptions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No prescriptions added yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {patientFile.prescriptions.map((prescription) => (
                    <div key={prescription.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-start">
                      <div>
                        <h4 className="text-lg text-gray-900">{prescription.name}</h4>
                        <p className="text-sm text-gray-600">
                          Prescribed: {prescription.prescribedAt.toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-500">By {prescription.prescribedBy}</p>
                        {prescription.dosage && (
                          <p className="text-sm text-gray-600 mt-1">Dosage: {prescription.dosage}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeletePrescription(prescription.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Attachments Tab */}
          {activeTab === 'attachments' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg text-gray-900">Attachments</h3>
                {fileId && (
                  <label className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    Upload file
                    <input
                      type="file"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f || !fileId) return;
                        e.target.value = '';
                        try {
                          await patientFileService.uploadAttachment(fileId, f, f.name);
                          const list = await patientFileService.getAttachments(fileId);
                          setAttachments(list);
                          toast.success('File uploaded');
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : 'Upload failed');
                        }
                      }}
                    />
                  </label>
                )}
              </div>
              {attachments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No attachments yet. Upload any file (PDF, images, etc.) for this patient.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {attachments.map((a) => {
                    const attachmentHref = resolveStorageAssetUrl(a.path);
                    const showThumb =
                      Boolean(attachmentHref) && (a.mimeType?.startsWith('image/') ?? false);
                    return (
                      <div
                        key={a.id}
                        className="border border-gray-200 rounded-lg p-4 flex justify-between items-center gap-4"
                      >
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          {showThumb ? (
                            <a
                              href={attachmentHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 w-20 h-20 rounded-lg border border-gray-200 overflow-hidden bg-gray-100 block"
                              aria-label={`Preview ${a.name}`}
                            >
                              <img
                                src={attachmentHref}
                                alt=""
                                className="w-full h-full object-cover"
                                loading="lazy"
                                decoding="async"
                              />
                            </a>
                          ) : null}
                          <a
                            href={attachmentHref || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-pink-600 hover:underline truncate"
                            onClick={(e) => {
                              if (!attachmentHref) e.preventDefault();
                            }}
                          >
                            {a.name}
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!fileId || !confirm('Delete this attachment?')) return;
                            try {
                              await patientFileService.deleteAttachment(fileId, a.id);
                              setAttachments(prev => prev.filter(x => x.id !== a.id));
                              toast.success('Deleted');
                            } catch {
                              toast.error('Delete failed');
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {photoPreviewUrl ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Photo preview"
          onClick={() => setPhotoPreviewUrl(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-lg bg-white/10 p-2 text-white hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            onClick={() => setPhotoPreviewUrl(null)}
            aria-label="Close preview"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={photoPreviewUrl}
            alt="Full size preview"
            className="max-h-[min(90vh,100%)] max-w-full object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}

      {isSessionModalOpen && (
        <SessionModal
          session={selectedSession}
          patientName={patientName}
          performedBy={doctorName}
          onClose={() => setIsSessionModalOpen(false)}
          onSave={handleSaveSession}
        />
      )}
    </div>
  );
}
