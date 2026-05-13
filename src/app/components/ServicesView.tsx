import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Search, Clock, DollarSign, Tag, Loader2 } from 'lucide-react';
import ServiceDetailModal, { Service } from './ServiceDetailModal';
import { serviceService, type ClinicService } from '../../lib/services/serviceService';
import { toast } from 'sonner';
import { useAuth } from '../App';

function clinicToService(c: ClinicService): Service {
  return {
    id: c.id,
    name: c.name,
    category: c.category,
    duration: c.duration,
    price: c.price,
    description: c.description ?? '',
    popular: c.popular,
    allowedPractitionerTypeIds: c.allowedPractitionerTypeIds ?? [],
    defaultMaterials: (c.defaultMaterials ?? []).map((d) => ({
      materialId: d.materialId,
      defaultQuantity: d.defaultQuantity,
      name: d.name,
    })),
  };
}

export default function ServicesView() {
  const { user } = useAuth();
  const canManageCatalog = user?.role === 'admin';

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadServices = useCallback(() => {
    setLoading(true);
    serviceService
      .getAll()
      .then((list) => setServices(list.map(clinicToService)))
      .catch(() => toast.error('Failed to load services'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const categories = useMemo(() => {
    const set = new Set(services.map((s) => s.category).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [services]);

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddService = () => {
    setSelectedService(null);
    setIsModalOpen(true);
  };

  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleSaveService = async (service: Service) => {
    if (!canManageCatalog) return;
    const payload = {
      name: service.name,
      category: service.category,
      duration: service.duration,
      price: service.price,
      description: service.description,
      popular: service.popular ?? false,
      allowedPractitionerTypeIds: service.allowedPractitionerTypeIds ?? [],
      defaultMaterials: (service.defaultMaterials ?? []).map((d) => ({
        materialId: d.materialId,
        defaultQuantity: d.defaultQuantity,
      })),
    };
    try {
      if (selectedService) {
        const updated = await serviceService.update(selectedService.id, payload);
        setServices((prev) => prev.map((s) => (s.id === updated.id ? clinicToService(updated) : s)));
      } else {
        const created = await serviceService.create(payload);
        setServices((prev) => [...prev, clinicToService(created)]);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save service');
      throw e;
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!canManageCatalog) return;
    try {
      await serviceService.remove(id);
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete service');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">Services & Treatments</h1>
          <p className="text-gray-600">{loading ? 'Loading…' : `${services.length} services available`}</p>
        </div>
        {canManageCatalog && (
          <button
            type="button"
            onClick={handleAddService}
            className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Service
          </button>
        )}
      </div>

      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === category ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-gray-600">
          <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
          <span>Loading services…</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow relative"
            >
              {service.popular && (
                <div className="absolute top-4 right-4 bg-pink-600 text-white px-3 py-1 rounded-full text-sm">Popular</div>
              )}

              <div className="mb-4">
                <h3 className="text-xl text-gray-900 mb-2">{service.name}</h3>
                <div className="flex items-center gap-2 text-sm text-pink-600">
                  <Tag className="w-4 h-4" />
                  <span>{service.category}</span>
                </div>
              </div>

              <p className="text-gray-600 mb-4 text-sm">{service.description}</p>

              {(service.defaultMaterials?.length ?? 0) > 0 && (
                <p className="text-xs text-gray-500 mb-2">
                  {service.defaultMaterials!.length} linked material{service.defaultMaterials!.length === 1 ? '' : 's'}{' '}
                  / tools
                </p>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{service.duration} minutes</span>
                  </div>
                  <div className="flex items-center gap-1 text-pink-700 font-medium">
                    <DollarSign className="w-4 h-4" />
                    <span>{service.price}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 flex gap-2">
                {canManageCatalog ? (
                  <button
                    type="button"
                    onClick={() => handleEditService(service)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    Edit
                  </button>
                ) : (
                  <p className="text-sm text-gray-500 flex-1">Catalog is read-only for your role.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredServices.length === 0 && (
        <div className="text-center py-12 text-gray-600">No services found matching your criteria.</div>
      )}

      {isModalOpen && (
        <ServiceDetailModal
          service={selectedService}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveService}
          onDelete={canManageCatalog ? handleDeleteService : undefined}
        />
      )}
    </div>
  );
}
