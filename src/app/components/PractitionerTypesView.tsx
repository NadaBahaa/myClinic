import { useState } from 'react';
import { Plus, Search, Shield, Calendar, Settings, Users } from 'lucide-react';
import PractitionerTypeDetailModal, { PractitionerType } from './PractitionerTypeDetailModal';
import { usePractitionerTypes } from '../contexts/PractitionerTypeContext';

export default function PractitionerTypesView() {
  const { practitionerTypes, updatePractitionerTypes } = usePractitionerTypes();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<PractitionerType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const categories = ['All', ...Array.from(new Set(practitionerTypes.map((t) => t.category)))];

  const filteredTypes = practitionerTypes.filter((type) => {
    const matchesSearch =
      type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      type.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || type.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddType = () => {
    setSelectedType(null);
    setIsModalOpen(true);
  };

  const handleEditType = (type: PractitionerType) => {
    setSelectedType(type);
    setIsModalOpen(true);
  };

  const handleSaveType = (type: PractitionerType) => {
    if (selectedType) {
      updatePractitionerTypes(practitionerTypes.map((t) => (t.id === type.id ? type : t)));
    } else {
      updatePractitionerTypes([...practitionerTypes, type]);
    }
  };

  const handleDeleteType = (id: string) => {
    updatePractitionerTypes(practitionerTypes.filter((t) => t.id !== id));
  };

  const getActiveCount = (typeId: string) => {
    // In a real app, this would count actual practitioners
    return Math.floor(Math.random() * 10) + 1;
  };

  const toArray = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.map((v) => String(v)).filter(Boolean);
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return [];
      return trimmed.split(',').map((v) => v.trim()).filter(Boolean);
    }
    return [];
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">Practitioner Types</h1>
          <p className="text-gray-600">{practitionerTypes.length} types configured</p>
        </div>
        <button
          onClick={handleAddType}
          className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Practitioner Type
        </button>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search practitioner types..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Practitioner Types Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTypes.map((type) => (
          <div
            key={type.id}
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all border-l-4"
            style={{ borderLeftColor: type.color }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: type.color }}
                  >
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl text-gray-900">{type.name}</h3>
                    <span className="text-sm text-gray-500">{type.category}</span>
                  </div>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs ${type.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {type.active ? 'Active' : 'Inactive'}
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">{type.description}</p>

            <div className="space-y-3 mb-4">
              {/* Permissions Count */}
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Shield className="w-4 h-4 text-gray-400" />
                <span>
                  {Object.values(type.permissions).filter(Boolean).length} permissions enabled
                </span>
              </div>

              {/* Features Count */}
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Settings className="w-4 h-4 text-gray-400" />
                <span>
                  {Object.values(type.features).filter(Boolean).length} specialized features
                </span>
              </div>

              {/* Scheduling */}
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>
                  {type.schedulingRules.defaultAppointmentDuration} min appointments
                </span>
              </div>

              {/* Active Practitioners */}
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Users className="w-4 h-4 text-gray-400" />
                <span>{getActiveCount(type.id)} active practitioners</span>
              </div>
            </div>

            {/* Service Categories */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Allowed Services:</p>
              <div className="flex flex-wrap gap-1">
                {toArray((type as unknown as Record<string, unknown>).allowedServiceCategories).slice(0, 3).map((cat) => (
                  <span key={cat} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                    {cat}
                  </span>
                ))}
                {toArray((type as unknown as Record<string, unknown>).allowedServiceCategories).length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                    +{toArray((type as unknown as Record<string, unknown>).allowedServiceCategories).length - 3}
                  </span>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={() => handleEditType(type)}
                className="w-full px-4 py-2 text-sm text-pink-600 border border-pink-200 rounded-lg hover:bg-pink-50 transition-colors"
              >
                Configure Type
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTypes.length === 0 && (
        <div className="text-center py-12 text-gray-600">
          No practitioner types found matching your search.
        </div>
      )}

      {/* Practitioner Type Detail Modal */}
      {isModalOpen && (
        <PractitionerTypeDetailModal
          practitionerType={selectedType}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveType}
          onDelete={handleDeleteType}
        />
      )}
    </div>
  );
}