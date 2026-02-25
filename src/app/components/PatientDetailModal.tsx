import { useState } from 'react';
import { X, Mail, Phone, Calendar, FileText } from 'lucide-react';
import { toast } from 'sonner';

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  lastVisit?: string;
  totalVisits: number;
  notes?: string;
  address?: string;
  emergencyContact?: string;
}

interface PatientDetailModalProps {
  patient: Patient | null;
  onClose: () => void;
  onSave: (patient: Patient) => void;
  onDelete?: (id: string) => void;
}

export default function PatientDetailModal({ patient, onClose, onSave, onDelete }: PatientDetailModalProps) {
  const isEditing = !!patient;
  
  const [formData, setFormData] = useState<Patient>(
    patient || {
      id: '',
      name: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      totalVisits: 0,
      notes: '',
      address: '',
      emergencyContact: '',
    }
  );

  const handleChange = (field: keyof Patient, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone || !formData.dateOfBirth) {
      toast.error('Please fill in all required fields');
      return;
    }

    const patientData: Patient = {
      ...formData,
      id: formData.id || `p-${Date.now()}`,
    };

    onSave(patientData);
    toast.success(isEditing ? 'Patient updated successfully' : 'Patient added successfully');
    onClose();
  };

  const handleDelete = () => {
    if (patient && onDelete && confirm(`Are you sure you want to delete ${patient.name}?`)) {
      onDelete(patient.id);
      toast.success('Patient deleted successfully');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-xl text-gray-900">
            {isEditing ? 'Edit Patient' : 'Add New Patient'}
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
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-gray-700">Date of Birth *</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                  required
                />
              </div>
            </div>
          </div>

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
              <div className="md:col-span-2">
                <label className="block mb-2 text-gray-700">Address</label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                  placeholder="Street address, city, state, ZIP"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block mb-2 text-gray-700">Emergency Contact</label>
                <input
                  type="text"
                  value={formData.emergencyContact || ''}
                  onChange={(e) => handleChange('emergencyContact', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                  placeholder="Name and phone number"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h3 className="text-lg text-gray-900 mb-4">Additional Information</h3>
            <div>
              <label className="block mb-2 text-gray-700 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notes
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                rows={4}
                placeholder="Medical history, allergies, preferences, etc."
              />
            </div>
          </div>

          {/* Statistics (if editing) */}
          {isEditing && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg text-gray-900 mb-3">Patient Statistics</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Visits:</span>
                  <span className="ml-2 font-medium">{formData.totalVisits}</span>
                </div>
                {formData.lastVisit && (
                  <div>
                    <span className="text-gray-600">Last Visit:</span>
                    <span className="ml-2 font-medium">
                      {new Date(formData.lastVisit).toLocaleDateString()}
                    </span>
                  </div>
                )}
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
                  Delete Patient
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
                {isEditing ? 'Update' : 'Add'} Patient
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
