import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Package, Wrench, DollarSign, Edit2, Trash2, Loader2 } from 'lucide-react';
import { MaterialOrTool } from '../types';
import { toast } from 'sonner';
import { materialService } from '../../lib/services/materialService';
import { useAuth } from '../App';

interface MaterialToolModalProps {
  item: MaterialOrTool | null;
  onClose: () => void;
  onSave: (item: MaterialOrTool) => Promise<void>;
}

function MaterialToolModal({ item, onClose, onSave }: MaterialToolModalProps) {
  const isEditing = !!item;
  const [formData, setFormData] = useState<MaterialOrTool>(
    item || {
      id: '',
      name: '',
      type: 'material',
      unitPrice: 0,
      unit: 'ml',
      stockQuantity: 0,
      supplier: '',
      notes: '',
    },
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        ...item,
        stockQuantity: item.stockQuantity,
      });
    } else {
      setFormData({
        id: '',
        name: '',
        type: 'material',
        unitPrice: 0,
        unit: 'ml',
        stockQuantity: 0,
        supplier: '',
        notes: '',
      });
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Please enter a name');
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<MaterialOrTool> = {
        name: formData.name,
        type: formData.type,
        unitPrice: formData.unitPrice,
        unit: formData.unit,
        supplier: formData.supplier,
        notes: formData.notes,
      };
      if (formData.type === 'material') {
        payload.stockQuantity = formData.stockQuantity ?? 0;
      } else {
        payload.stockQuantity = undefined;
      }
      await onSave({
        ...formData,
        ...payload,
        id: formData.id || '',
      });
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-xl text-gray-900">
            {isEditing ? 'Edit' : 'Add'} {formData.type === 'material' ? 'Material' : 'Tool'}
          </h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block mb-2 text-gray-700">Type *</label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  formData.type === 'material' ? 'border-pink-600 bg-pink-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value="material"
                  checked={formData.type === 'material'}
                  onChange={() => setFormData({ ...formData, type: 'material' })}
                  className="sr-only"
                />
                <Package className="w-5 h-5" />
                <span>Material</span>
              </label>
              <label
                className={`flex items-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  formData.type === 'tool' ? 'border-pink-600 bg-pink-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value="tool"
                  checked={formData.type === 'tool'}
                  onChange={() => setFormData({ ...formData, type: 'tool' })}
                  className="sr-only"
                />
                <Wrench className="w-5 h-5" />
                <span>Tool</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block mb-2 text-gray-700">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
              placeholder="Enter name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-gray-700">Unit Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
              />
            </div>
            <div>
              <label className="block mb-2 text-gray-700">Unit</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                placeholder="ml, piece, gram, etc."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-gray-700">Stock Quantity</label>
              <input
                type="number"
                min="0"
                disabled={formData.type === 'tool'}
                value={formData.type === 'tool' ? '' : formData.stockQuantity ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stockQuantity: e.target.value === '' ? undefined : parseInt(e.target.value, 10) || 0,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600 disabled:bg-gray-100"
              />
              {formData.type === 'tool' && (
                <p className="text-xs text-gray-500 mt-1">Tools are not stock-tracked by default.</p>
              )}
            </div>
            <div>
              <label className="block mb-2 text-gray-700">Supplier</label>
              <input
                type="text"
                value={formData.supplier || ''}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                placeholder="Supplier name"
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-gray-700">Notes</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
              rows={3}
              placeholder="Additional notes..."
            />
          </div>

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
              disabled={saving}
              className="flex-1 px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : isEditing ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const INVENTORY_ROLES = ['admin', 'superadmin', 'assistant', 'doctor'] as const;

export default function MaterialsToolsView() {
  const { user } = useAuth();
  const canMutate = INVENTORY_ROLES.includes((user?.role ?? '') as (typeof INVENTORY_ROLES)[number]);

  const [items, setItems] = useState<MaterialOrTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'material' | 'tool'>('all');
  const [selectedItem, setSelectedItem] = useState<MaterialOrTool | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadItems = useCallback(() => {
    setLoading(true);
    materialService
      .getAll()
      .then(setItems)
      .catch(() => toast.error('Failed to load materials & tools'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.supplier?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const materialRows = filteredItems.filter((i) => i.type === 'material');
  const toolRows = filteredItems.filter((i) => i.type === 'tool');

  const handleAdd = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: MaterialOrTool) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (item: MaterialOrTool) => {
    if (selectedItem) {
      const { id, ...rest } = item;
      const updated = await materialService.update(selectedItem.id, rest);
      setItems((prev) => prev.map((i) => (i.id === selectedItem.id ? updated : i)));
      toast.success('Updated successfully');
    } else {
      const { id: _id, ...rest } = item;
      const created = await materialService.create(rest);
      setItems((prev) => [...prev, created]);
      toast.success('Added successfully');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await materialService.remove(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success('Deleted successfully');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">Materials & Tools</h1>
          <p className="text-gray-600">
            {loading ? 'Loading…' : `${items.length} items in inventory`}
          </p>
        </div>
        {canMutate && (
          <button
            type="button"
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Item
          </button>
        )}
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search materials and tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
          />
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${filterType === 'all' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilterType('material')}
            className={`px-4 py-2 rounded-lg transition-colors ${filterType === 'material' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
          >
            Materials
          </button>
          <button
            type="button"
            onClick={() => setFilterType('tool')}
            className={`px-4 py-2 rounded-lg transition-colors ${filterType === 'tool' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
          >
            Tools
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-gray-600">Total Materials</span>
          </div>
          <p className="text-3xl text-gray-900">{materialRows.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Wrench className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-gray-600">Total Tools</span>
          </div>
          <p className="text-3xl text-gray-900">{toolRows.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-gray-600">Inventory Value</span>
          </div>
          <p className="text-3xl text-gray-900">
            $
            {materialRows
              .reduce((sum, m) => sum + m.unitPrice * (m.stockQuantity ?? 0), 0)
              .toFixed(2)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-gray-600">
              <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
              <span>Loading inventory…</span>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm text-gray-600">Name</th>
                  <th className="text-left px-6 py-3 text-sm text-gray-600">Type</th>
                  <th className="text-left px-6 py-3 text-sm text-gray-600">Unit Price</th>
                  <th className="text-left px-6 py-3 text-sm text-gray-600">Stock</th>
                  <th className="text-left px-6 py-3 text-sm text-gray-600">Supplier</th>
                  {canMutate && <th className="text-right px-6 py-3 text-sm text-gray-600">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={canMutate ? 6 : 5} className="px-6 py-12 text-center text-gray-500">
                      No items found
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {item.type === 'material' ? (
                            <Package className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Wrench className="w-5 h-5 text-purple-600" />
                          )}
                          <span className="text-gray-900">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            item.type === 'material' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        ${item.unitPrice.toFixed(2)} / {item.unit}
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {item.stockQuantity !== undefined && item.stockQuantity !== null
                          ? `${item.stockQuantity} ${item.unit}`
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{item.supplier || 'N/A'}</td>
                      {canMutate && (
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(item)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <MaterialToolModal
          item={selectedItem}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
