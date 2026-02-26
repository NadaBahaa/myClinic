import { useState, useEffect } from 'react';
import { Plus, Search, Mail, Phone, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import DoctorDetailModal, { Doctor } from './DoctorDetailModal';
import { usePractitionerTypes } from '../contexts/PractitionerTypeContext';
import { doctorService } from '../../lib/services/doctorService';

function toDoctor(d: Awaited<ReturnType<typeof doctorService.get>>): Doctor {
  return {
    id: d.id,
    name: d.name,
    email: d.email,
    phone: d.phone ?? '',
    specialty: d.specialty ?? '',
    practitionerTypeId: d.practitionerTypeId,
    experience: d.experience ?? 0,
    availability: Array.isArray(d.availability) ? d.availability as string[] : [],
    totalPatients: d.totalPatients ?? 0,
    qualifications: d.qualifications,
    licenseNumber: d.licenseNumber,
  };
}

export default function DoctorsView() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { getPractitionerTypeById } = usePractitionerTypes();

  useEffect(() => {
    doctorService.getAll()
      .then((list) => setDoctors(list.map(toDoctor)))
      .catch(() => toast.error('Failed to load doctors'))
      .finally(() => setLoading(false));
  }, []);

  const filteredDoctors = doctors.filter((doctor) =>
    doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddDoctor = () => {
    setSelectedDoctor(null);
    setIsModalOpen(true);
  };

  const handleEditDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setIsModalOpen(true);
  };

  const handleSaveDoctor = async (doctor: Doctor) => {
    try {
      if (selectedDoctor) {
        await doctorService.update(doctor.id, {
          name: doctor.name,
          email: doctor.email,
          phone: doctor.phone,
          specialty: doctor.specialty,
          practitionerTypeId: doctor.practitionerTypeId,
          experience: doctor.experience,
          availability: doctor.availability,
          qualifications: doctor.qualifications,
          licenseNumber: doctor.licenseNumber,
        });
        setDoctors(prev => prev.map(d => d.id === doctor.id ? doctor : d));
        toast.success('Doctor updated successfully');
      } else {
        const created = await doctorService.create({
          name: doctor.name,
          email: doctor.email,
          phone: doctor.phone,
          specialty: doctor.specialty,
          practitionerTypeId: doctor.practitionerTypeId,
          experience: doctor.experience,
          availability: doctor.availability,
          qualifications: doctor.qualifications,
          licenseNumber: doctor.licenseNumber,
        });
        setDoctors(prev => [...prev, toDoctor(created as Awaited<ReturnType<typeof doctorService.get>>)]);
        toast.success('Doctor added successfully');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save doctor');
    }
  };

  const handleDeleteDoctor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this doctor?')) return;
    try {
      await doctorService.remove(id);
      setDoctors(prev => prev.filter(d => d.id !== id));
      toast.success('Doctor deleted');
      setIsModalOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete doctor');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">Doctors</h1>
          <p className="text-gray-600">{doctors.length} doctors on staff</p>
        </div>
        <button
          onClick={handleAddDoctor}
          className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Doctor
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search doctors by name, specialty, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
        />
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredDoctors.map((doctor) => {
          const practitionerType = doctor.practitionerTypeId 
            ? getPractitionerTypeById(doctor.practitionerTypeId)
            : undefined;
            
          return (
            <div key={doctor.id} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl text-gray-900 mb-1">{doctor.name}</h3>
                  <div className="flex items-center gap-2 text-pink-600 mb-2">
                    <Briefcase className="w-4 h-4" />
                    <span>{doctor.specialty}</span>
                  </div>
                  {practitionerType && (
                    <span 
                      className="inline-block px-2 py-1 rounded text-xs text-white"
                      style={{ backgroundColor: practitionerType.color }}
                    >
                      {practitionerType.name}
                    </span>
                  )}
                </div>
                <div className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm">
                  {doctor.experience} years
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{doctor.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{doctor.phone}</span>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Available Days:</p>
                <div className="flex flex-wrap gap-2">
                  {doctor.availability.map((day) => (
                    <span key={day} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {day}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                <span className="text-sm text-gray-600">{doctor.totalPatients} total patients</span>
                <button 
                  onClick={() => handleEditDoctor(doctor)}
                  className="text-sm text-pink-600 hover:text-pink-700"
                >
                  View Schedule
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredDoctors.length === 0 && (
        <div className="text-center py-12 text-gray-600">
          No doctors found matching your search.
        </div>
      )}

      {/* Doctor Detail Modal */}
      {isModalOpen && (
        <DoctorDetailModal
          doctor={selectedDoctor}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveDoctor}
          onDelete={handleDeleteDoctor}
        />
      )}
    </div>
  );
}