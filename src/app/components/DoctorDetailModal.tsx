import React, { useState, useEffect } from 'react';
import { X, Mail, Phone, Briefcase, Calendar, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { usePractitionerTypes } from '../contexts/PractitionerTypeContext';

export interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  practitionerTypeId?: string;
  practitionerTypeName?: string;
  experience: number;
  availability: string[];
  totalPatients: number;
  qualifications?: string;
  licenseNumber?: string;
  customPermissions?: Record<string, boolean>;
  services?: { id: string; name: string; duration: number; price?: number; category?: string }[];
}

interface DoctorDetailModalProps {
  doctor: Doctor | null;
  availableServices?: { id: string; name: string; duration: number; price?: number; category?: string }[];
  onClose: () => void;
  onSave: (doctor: Doctor) => void | Promise<void>;
  onDelete?: (id: string) => void;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function DoctorDetailModal({ doctor, availableServices = [], onClose, onSave, onDelete }: DoctorDetailModalProps) {
  const isEditing = !!doctor;
  const { getActivePractitionerTypes, getPractitionerTypeById, refetch } = usePractitionerTypes();
  const activePractitionerTypes = getActivePractitionerTypes();

  // Ensure practitioner types are loaded when modal opens (e.g. dropdown was empty)
  useEffect(() => {
    if (activePractitionerTypes.length === 0) refetch();
  }, []);
  
  const [formData, setFormData] = useState<Doctor>(
    doctor || {
      id: '',
      name: '',
      email: '',
      phone: '',
      specialty: '',
      practitionerTypeId: undefined,
      experience: 0,
      availability: [],
      totalPatients: 0,
      qualifications: '',
      licenseNumber: '',
      services: [],
    }
  );

  const selectedPractitionerType = formData.practitionerTypeId 
    ? getPractitionerTypeById(formData.practitionerTypeId)
    : undefined;

  const requiredCerts = Array.isArray(selectedPractitionerType?.requiredCertifications)
    ? selectedPractitionerType.requiredCertifications
    : (selectedPractitionerType?.requiredCertifications ? [String(selectedPractitionerType.requiredCertifications)] : []);
  const allowedCategories = Array.isArray(selectedPractitionerType?.allowedServiceCategories)
    ? selectedPractitionerType.allowedServiceCategories
    : (selectedPractitionerType?.allowedServiceCategories ? [String(selectedPractitionerType.allowedServiceCategories)] : []);

  const handleChange = (field: keyof Doctor, value: string | number | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectedServiceIds = new Set((formData.services ?? []).map((s) => s.id));
  const selectableServices = availableServices.filter((service) => {
    if (!formData.practitionerTypeId || allowedCategories.length === 0) return true;
    return !!service.category && allowedCategories.includes(service.category);
  });

  useEffect(() => {
    if (!formData.practitionerTypeId || allowedCategories.length === 0) return;
    setFormData((prev) => ({
      ...prev,
      services: (prev.services ?? []).filter((s) => !s.category || allowedCategories.includes(s.category)),
    }));
  }, [formData.practitionerTypeId, selectedPractitionerType?.id]);

  const toggleService = (service: { id: string; name: string; duration: number; price?: number; category?: string }) => {
    setFormData((prev) => {
      const has = (prev.services ?? []).some((s) => s.id === service.id);
      return {
        ...prev,
        services: has
          ? (prev.services ?? []).filter((s) => s.id !== service.id)
          : [...(prev.services ?? []), service],
      };
    });
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availability: prev.availability.includes(day)
        ? prev.availability.filter(d => d !== day)
        : [...prev.availability, day]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone || !formData.specialty) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check if practitioner type is selected and validate certifications
    if (formData.practitionerTypeId && selectedPractitionerType) {
      if (requiredCerts.length > 0 && !formData.qualifications) {
        toast.warning('This practitioner type requires certifications. Please add qualifications.');
      }
    }

    const doctorData: Doctor = {
      ...formData,
      id: formData.id || `d-${Date.now()}`,
    };

    await onSave(doctorData);
    onClose();
  };

  const handleDelete = () => {
    if (doctor && onDelete && confirm(`Are you sure you want to delete Dr. ${doctor.name}?`)) {
      onDelete(doctor.id);
      toast.success('Doctor deleted successfully');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-xl text-gray-900">
            {isEditing ? 'Edit Doctor' : 'Add New Doctor'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 text-gray-700">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                  placeholder="Dr. John Doe"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-gray-700 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Specialty *
                </label>
                <input
                  type="text"
                  value={formData.specialty}
                  onChange={(e) => handleChange('specialty', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                  placeholder="Dermatology, Cosmetic Surgery, etc."
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-gray-700">Practitioner Type</label>
                <select
                  value={formData.practitionerTypeId || ''}
                  onChange={(e) => handleChange('practitionerTypeId', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                >
                  <option value="">Select Type (Optional)</option>
                  {activePractitionerTypes.length === 0 && (
                    <option value="" disabled>Loading practitioner types...</option>
                  )}
                  {activePractitionerTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} - {type.category}
                    </option>
                  ))}
                </select>
                {selectedPractitionerType && (
                  <p className="mt-1 text-xs text-gray-500">
                    {selectedPractitionerType.description}
                  </p>
                )}
              </div>
              <div>
                <label className="block mb-2 text-gray-700">Years of Experience *</label>
                <input
                  type="number"
                  value={formData.experience}
                  onChange={(e) => handleChange('experience', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-gray-700">License Number</label>
                <input
                  type="text"
                  value={formData.licenseNumber || ''}
                  onChange={(e) => handleChange('licenseNumber', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                  placeholder="MD123456"
                />
              </div>
            </div>
          </div>

          {/* Practitioner Type Information */}
          {selectedPractitionerType && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h3 className="text-lg text-gray-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                Practitioner Type Requirements & Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Required Certifications */}
                {requiredCerts.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Required Certifications:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {requiredCerts.map((cert, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <CheckCircle2 className="w-3 h-3 mt-0.5 text-blue-600 flex-shrink-0" />
                          <span>{cert}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Scheduling Rules */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Scheduling Defaults:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Default appointment: {selectedPractitionerType.schedulingRules.defaultAppointmentDuration} min</li>
                    <li>• Buffer before: {selectedPractitionerType.schedulingRules.bufferTimeBefore} min</li>
                    <li>• Buffer after: {selectedPractitionerType.schedulingRules.bufferTimeAfter} min</li>
                    <li>• Max appointments/day: {selectedPractitionerType.schedulingRules.maxAppointmentsPerDay}</li>
                  </ul>
                </div>

                {/* Allowed Services */}
                {allowedCategories.length > 0 && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-700 mb-2">Can Perform Services:</p>
                    <div className="flex flex-wrap gap-2">
                      {allowedCategories.map((cat) => (
                        <span key={cat} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Linked Services */}
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <h3 className="text-lg text-gray-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-600" />
              Linked Services ({formData.services?.length ?? 0})
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Select services this doctor can perform. If a practitioner type is selected, only compatible categories are shown.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
              {selectableServices.map((service) => (
                <label key={service.id} className="flex items-start gap-2 p-2 bg-white border border-green-200 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedServiceIds.has(service.id)}
                    onChange={() => toggleService(service)}
                    className="mt-1 rounded border-gray-300"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{service.name}</p>
                    <p className="text-xs text-gray-500">
                      {service.duration} min{service.category ? ` · ${service.category}` : ''}
                      {service.price != null ? ` · EGP ${service.price}` : ''}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            {selectableServices.length === 0 && (
              <p className="text-sm text-gray-500">No services available for the selected practitioner type.</p>
            )}
          </div>

          {formData.services && formData.services.length > 0 && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <h3 className="text-lg text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-green-600" />
                Linked Services ({formData.services.length})
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                These services are available for this doctor based on their practitioner type.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {formData.services.map(service => (
                  <div key={service.id} className="flex items-center justify-between p-2 bg-white border border-green-200 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{service.name}</p>
                      <p className="text-xs text-gray-500">
                        {service.duration} min
                        {service.category ? ` · ${service.category}` : ''}
                      </p>
                    </div>
                    {service.price != null && (
                      <span className="text-sm font-semibold text-green-700">EGP {service.price}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div>
            <h3 className="text-lg text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 text-gray-700 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-gray-700 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                  required
                />
              </div>
            </div>
          </div>

          {/* Availability */}
          <div>
            <h3 className="text-lg text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Availability
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {DAYS_OF_WEEK.map((day) => (
                <label
                  key={day}
                  className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.availability.includes(day)
                      ? 'border-pink-600 bg-pink-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.availability.includes(day)}
                    onChange={() => toggleDay(day)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">{day}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Qualifications */}
          <div>
            <h3 className="text-lg text-gray-900 mb-4">Qualifications</h3>
            <textarea
              value={formData.qualifications || ''}
              onChange={(e) => handleChange('qualifications', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
              rows={3}
              placeholder="Education, certifications, achievements..."
            />
          </div>

          {/* Statistics (if editing) */}
          {isEditing && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg text-gray-900 mb-3">Statistics</h3>
              <div className="text-sm">
                <span className="text-gray-600">Total Patients:</span>
                <span className="ml-2 font-medium">{formData.totalPatients}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between gap-3 pt-4 border-t border-gray-200">
            <div>
              {isEditing && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-6 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Delete Doctor
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
              >
                {isEditing ? 'Update' : 'Add'} Doctor
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}