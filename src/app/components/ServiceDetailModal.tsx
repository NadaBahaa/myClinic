import { useState, useEffect } from 'react';
import { X, Clock, DollarSign, Tag, FileText, Package, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePractitionerTypes } from '../contexts/PractitionerTypeContext';
import { materialService } from '../../lib/services/materialService';
import type { MaterialOrTool } from '../types';

export interface ServiceDefaultMaterial {
  materialId: string;
  defaultQuantity: number;
  name?: string;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
  description: string;
  popular?: boolean;
  allowedPractitionerTypeIds?: string[];
  defaultMaterials?: ServiceDefaultMaterial[];
}

interface ServiceDetailModalProps {
  service: Service | null;
  onClose: () => void;
  onSave: (service: Service) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
}

const CATEGORIES = [
  'Skincare',
  'Hair Removal',
  'Injectable',
  'Massage',
  'Body Treatment',
  'Surgical',
  'Nutrition',
  'Dental',
  'Physical Therapy',
  'Laser Treatment',
  'Body Contouring',
  'Wellness',
  'Diagnostic',
  'Consultation',
  'Other',
];

const emptyForm = (): Service => ({
  id: '',
  name: '',
  category: '',
  duration: 30,
  price: 0,
  description: '',
  popular: false,
  allowedPractitionerTypeIds: [],
  defaultMaterials: [],
});

export default function ServiceDetailModal({ service, onClose, onSave, onDelete }: ServiceDetailModalProps) {
  const isEditing = !!service?.id;
  const { getActivePractitionerTypes } = usePractitionerTypes();
  const activePractitionerTypes = getActivePractitionerTypes();

  const [formData, setFormData] = useState<Service>(service ? { ...service, defaultMaterials: service.defaultMaterials ?? [] } : emptyForm());
  const [materialsCatalog, setMaterialsCatalog] = useState<MaterialOrTool[]>([]);
  const [pendingMaterialId, setPendingMaterialId] = useState('');
  const [pendingQty, setPendingQty] = useState(1);

  useEffect(() => {
    setFormData(service ? { ...service, defaultMaterials: service.defaultMaterials ?? [] } : emptyForm());
  }, [service]);

  useEffect(() => {
    materialService
      .getAll()
      .then(setMaterialsCatalog)
      .catch(() => toast.error('Failed to load materials catalog'));
  }, []);

  const handleChange = (field: keyof Service, value: string | number | boolean | string[] | ServiceDefaultMaterial[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const togglePractitionerType = (typeId: string) => {
    setFormData((prev) => ({
      ...prev,
      allowedPractitionerTypeIds: prev.allowedPractitionerTypeIds?.includes(typeId)
        ? prev.allowedPractitionerTypeIds.filter((id) => id !== typeId)
        : [...(prev.allowedPractitionerTypeIds || []), typeId],
    }));
  };

  const addDefaultMaterial = () => {
    if (!pendingMaterialId) {
      toast.error('Select a material or tool');
      return;
    }
    const qty = pendingQty > 0 ? pendingQty : 1;
    const mat = materialsCatalog.find((m) => m.id === pendingMaterialId);
    if (!mat) return;
    const rows = formData.defaultMaterials ?? [];
    if (rows.some((r) => r.materialId === pendingMaterialId)) {
      toast.error('Already linked to this service');
      return;
    }
    handleChange('defaultMaterials', [
      ...rows,
      { materialId: mat.id, defaultQuantity: qty, name: mat.name },
    ]);
    setPendingMaterialId('');
    setPendingQty(1);
  };

  const removeDefaultMaterial = (materialId: string) => {
    const rows = (formData.defaultMaterials ?? []).filter((r) => r.materialId !== materialId);
    handleChange('defaultMaterials', rows);
  };

  const updateDefaultQty = (materialId: string, q: number) => {
    const rows = (formData.defaultMaterials ?? []).map((r) =>
      r.materialId === materialId ? { ...r, defaultQuantity: q > 0 ? q : r.defaultQuantity } : r,
    );
    handleChange('defaultMaterials', rows);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category || !formData.duration || formData.price == null || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    const serviceData: Service = {
      ...formData,
      id: formData.id || `s-${Date.now()}`,
      defaultMaterials: formData.defaultMaterials ?? [],
    };

    try {
      await Promise.resolve(onSave(serviceData));
      toast.success(isEditing ? 'Service updated successfully' : 'Service added successfully');
      onClose();
    } catch {
      toast.error('Could not save service');
    }
  };

  const handleDelete = async () => {
    if (!service?.id || !onDelete || !confirm(`Are you sure you want to delete ${service.name}?`)) return;
    try {
      await Promise.resolve(onDelete(service.id));
      toast.success('Service deleted successfully');
      onClose();
    } catch {
      toast.error('Could not delete service');
    }
  };

  const availableToLink = materialsCatalog.filter(
    (m) => !(formData.defaultMaterials ?? []).some((r) => r.materialId === m.id),
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-xl text-gray-900">{isEditing ? 'Edit Service' : 'Add New Service'}</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <h3 className="text-lg text-gray-900 mb-4">Service Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-gray-700">Service Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                  placeholder="e.g., Facial Treatment"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-gray-700 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                    required
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-2 text-gray-700 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => handleChange('duration', parseInt(e.target.value, 10) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                    min={15}
                    step={15}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-gray-700 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Price ($) *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                  min={0}
                  step={0.01}
                  required
                />
              </div>

              <div>
                <label className="block mb-2 text-gray-700 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                  rows={4}
                  placeholder="Describe the service, benefits, and what to expect..."
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.popular || false}
                    onChange={(e) => handleChange('popular', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-gray-700">Mark as popular service</span>
                </label>
                <p className="text-sm text-gray-500 mt-1 ml-6">Popular services will be highlighted in the service list</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg text-gray-900 mb-4">Allowed Practitioner Types</h3>
            <div className="space-y-4">
              {activePractitionerTypes.map((type) => (
                <div key={type.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.allowedPractitionerTypeIds?.includes(type.id) || false}
                    onChange={() => togglePractitionerType(type.id)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-gray-700">{type.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg text-gray-900 mb-2 flex items-center gap-2">
              <Package className="w-5 h-5 text-pink-600" />
              Default materials & tools
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              When a doctor or assistant records a session with this service, these items can be added automatically as a
              starting list (they can still adjust quantities or add more).
            </p>

            <div className="space-y-2 mb-4">
              {(formData.defaultMaterials ?? []).length === 0 ? (
                <p className="text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg p-4">No items linked yet.</p>
              ) : (
                (formData.defaultMaterials ?? []).map((row) => (
                  <div key={row.materialId} className="flex flex-wrap items-center gap-2 border border-gray-100 rounded-lg p-3">
                    <span className="flex-1 min-w-[140px] text-gray-900 text-sm">{row.name ?? row.materialId}</span>
                    <label className="text-xs text-gray-500 flex items-center gap-1">
                      Default qty
                      <input
                        type="number"
                        min={0.001}
                        step={0.001}
                        value={row.defaultQuantity}
                        onChange={(e) => updateDefaultQty(row.materialId, parseFloat(e.target.value) || row.defaultQuantity)}
                        className="w-24 px-2 py-1 border border-gray-300 rounded-lg text-sm"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => removeDefaultMaterial(row.materialId)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex flex-wrap gap-2 items-end">
              <select
                value={pendingMaterialId}
                onChange={(e) => setPendingMaterialId(e.target.value)}
                className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Add material / tool…</option>
                {availableToLink.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.type})
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={0.001}
                step={0.001}
                value={pendingQty}
                onChange={(e) => setPendingQty(parseFloat(e.target.value) || 1)}
                className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <button
                type="button"
                onClick={addDefaultMaterial}
                className="inline-flex items-center gap-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 text-sm"
              >
                <Plus className="w-4 h-4" />
                Link
              </button>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg text-gray-900 mb-3">Preview</h3>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-900">{formData.name || 'Service Name'}</h4>
                {formData.popular && (
                  <span className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded-full">Popular</span>
                )}
              </div>
              <p className="text-sm text-pink-600 mb-2">{formData.category || 'Category'}</p>
              <p className="text-sm text-gray-600 mb-3">{formData.description || 'Service description will appear here'}</p>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-gray-700">
                  <Clock className="w-4 h-4" />
                  <span>{formData.duration} minutes</span>
                </div>
                <div className="flex items-center gap-1 text-pink-700 font-medium">
                  <DollarSign className="w-4 h-4" />
                  <span>{formData.price}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between gap-3 pt-4 border-t border-gray-200">
            <div>
              {isEditing && onDelete && (
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  className="px-6 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Delete Service
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors">
                {isEditing ? 'Update' : 'Add'} Service
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
