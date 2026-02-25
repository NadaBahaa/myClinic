import { useState } from 'react';
import { Plus, Search, Clock, DollarSign, Tag } from 'lucide-react';
import ServiceDetailModal, { Service } from './ServiceDetailModal';

const initialServices: Service[] = [
  {
    id: 's1',
    name: 'Facial Treatment',
    category: 'Skincare',
    duration: 60,
    price: 150,
    description: 'Deep cleansing and rejuvenating facial treatment',
    popular: true,
  },
  {
    id: 's2',
    name: 'Laser Hair Removal',
    category: 'Hair Removal',
    duration: 60,
    price: 200,
    description: 'Permanent hair reduction using advanced laser technology',
    popular: true,
  },
  {
    id: 's3',
    name: 'Botox Injection',
    category: 'Injectable',
    duration: 30,
    price: 350,
    description: 'Wrinkle reduction and facial rejuvenation',
  },
  {
    id: 's4',
    name: 'Chemical Peel',
    category: 'Skincare',
    duration: 45,
    price: 180,
    description: 'Exfoliation treatment for skin renewal',
  },
  {
    id: 's5',
    name: 'Microdermabrasion',
    category: 'Skincare',
    duration: 60,
    price: 160,
    description: 'Non-invasive skin resurfacing treatment',
  },
  {
    id: 's6',
    name: 'Dermal Fillers',
    category: 'Injectable',
    duration: 45,
    price: 450,
    description: 'Volume restoration and facial contouring',
  },
];

const categories = ['All', 'Skincare', 'Hair Removal', 'Injectable'];

export default function ServicesView() {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleSaveService = (service: Service) => {
    if (selectedService) {
      // Update existing service
      setServices(prev => prev.map(s => s.id === service.id ? service : s));
    } else {
      // Add new service
      setServices(prev => [...prev, service]);
    }
  };

  const handleDeleteService = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">Services & Treatments</h1>
          <p className="text-gray-600">{services.length} services available</p>
        </div>
        <button
          onClick={handleAddService}
          className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Service
        </button>
      </div>

      {/* Search and Filter */}
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

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <div
            key={service.id}
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow relative"
          >
            {service.popular && (
              <div className="absolute top-4 right-4 bg-pink-600 text-white px-3 py-1 rounded-full text-sm">
                Popular
              </div>
            )}

            <div className="mb-4">
              <h3 className="text-xl text-gray-900 mb-2">{service.name}</h3>
              <div className="flex items-center gap-2 text-sm text-pink-600">
                <Tag className="w-4 h-4" />
                <span>{service.category}</span>
              </div>
            </div>

            <p className="text-gray-600 mb-4 text-sm">{service.description}</p>

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
              <button 
                onClick={() => handleEditService(service)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Edit
              </button>
              <button className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm">
                Book Now
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12 text-gray-600">
          No services found matching your criteria.
        </div>
      )}

      {/* Service Detail Modal */}
      {isModalOpen && (
        <ServiceDetailModal
          service={selectedService}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveService}
          onDelete={handleDeleteService}
        />
      )}
    </div>
  );
}
