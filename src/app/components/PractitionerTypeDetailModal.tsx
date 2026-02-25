import { useState } from 'react';
import { X, Stethoscope, Shield, Settings, FileText, Calendar, Users } from 'lucide-react';
import { toast } from 'sonner';

export interface PractitionerTypePermissions {
  canPrescribe: boolean;
  canPerformSurgery: boolean;
  requiresAssistant: boolean;
  canAccessMedicalRecords: boolean;
  canCreateTreatmentPlans: boolean;
  canManageInventory: boolean;
  canViewAllPatients: boolean;
  canExportData: boolean;
}

export interface PractitionerTypeFeatures {
  needsBeforeAfterPhotos: boolean;
  needsDentalChart: boolean;
  needsSkinAnalysis: boolean;
  needsMealPlans: boolean;
  needsExercisePlans: boolean;
  needsLaserSettings: boolean;
  needsXrayManagement: boolean;
  needsConsentForms: boolean;
  needsProgressTracking: boolean;
  needsPrescriptionManagement: boolean;
  needsInsuranceBilling: boolean;
  needsProductRecommendations: boolean;
}

export interface SchedulingRules {
  defaultAppointmentDuration: number; // in minutes
  bufferTimeBefore: number; // in minutes
  bufferTimeAfter: number; // in minutes
  maxAppointmentsPerDay: number;
  allowDoubleBooking: boolean;
  requiresConsultation: boolean;
}

export interface PractitionerType {
  id: string;
  name: string;
  description: string;
  category: 'Medical' | 'Aesthetic' | 'Wellness' | 'Dental' | 'Therapeutic' | 'Other';
  color: string;
  icon: string;
  permissions: PractitionerTypePermissions;
  features: PractitionerTypeFeatures;
  schedulingRules: SchedulingRules;
  requiredCertifications: string[];
  allowedServiceCategories: string[];
  active: boolean;
}

interface PractitionerTypeDetailModalProps {
  practitionerType: PractitionerType | null;
  onClose: () => void;
  onSave: (type: PractitionerType) => void;
  onDelete?: (id: string) => void;
}

const CATEGORY_OPTIONS = ['Medical', 'Aesthetic', 'Wellness', 'Dental', 'Therapeutic', 'Other'];
const COLOR_OPTIONS = [
  { name: 'Pink', value: '#ec4899' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Indigo', value: '#6366f1' },
];

const SERVICE_CATEGORIES = [
  'Skincare',
  'Hair Removal',
  'Injectable',
  'Surgical',
  'Nutrition',
  'Dental',
  'Physical Therapy',
  'Laser Treatment',
  'Body Contouring',
  'Wellness',
  'Diagnostic',
  'Consultation',
];

export default function PractitionerTypeDetailModal({
  practitionerType,
  onClose,
  onSave,
  onDelete,
}: PractitionerTypeDetailModalProps) {
  const isEditing = !!practitionerType;

  const [formData, setFormData] = useState<PractitionerType>(
    practitionerType || {
      id: '',
      name: '',
      description: '',
      category: 'Medical',
      color: '#ec4899',
      icon: 'Stethoscope',
      permissions: {
        canPrescribe: false,
        canPerformSurgery: false,
        requiresAssistant: false,
        canAccessMedicalRecords: true,
        canCreateTreatmentPlans: true,
        canManageInventory: false,
        canViewAllPatients: false,
        canExportData: false,
      },
      features: {
        needsBeforeAfterPhotos: false,
        needsDentalChart: false,
        needsSkinAnalysis: false,
        needsMealPlans: false,
        needsExercisePlans: false,
        needsLaserSettings: false,
        needsXrayManagement: false,
        needsConsentForms: false,
        needsProgressTracking: false,
        needsPrescriptionManagement: false,
        needsInsuranceBilling: false,
        needsProductRecommendations: false,
      },
      schedulingRules: {
        defaultAppointmentDuration: 60,
        bufferTimeBefore: 0,
        bufferTimeAfter: 0,
        maxAppointmentsPerDay: 20,
        allowDoubleBooking: false,
        requiresConsultation: false,
      },
      requiredCertifications: [],
      allowedServiceCategories: [],
      active: true,
    }
  );

  const [certificationInput, setCertificationInput] = useState('');

  const handleChange = (field: keyof PractitionerType, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePermissionChange = (permission: keyof PractitionerTypePermissions, value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissions: { ...prev.permissions, [permission]: value },
    }));
  };

  const handleFeatureChange = (feature: keyof PractitionerTypeFeatures, value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      features: { ...prev.features, [feature]: value },
    }));
  };

  const handleSchedulingRuleChange = (rule: keyof SchedulingRules, value: number | boolean) => {
    setFormData((prev) => ({
      ...prev,
      schedulingRules: { ...prev.schedulingRules, [rule]: value },
    }));
  };

  const handleAddCertification = () => {
    if (certificationInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        requiredCertifications: [...prev.requiredCertifications, certificationInput.trim()],
      }));
      setCertificationInput('');
    }
  };

  const handleRemoveCertification = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      requiredCertifications: prev.requiredCertifications.filter((_, i) => i !== index),
    }));
  };

  const toggleServiceCategory = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      allowedServiceCategories: prev.allowedServiceCategories.includes(category)
        ? prev.allowedServiceCategories.filter((c) => c !== category)
        : [...prev.allowedServiceCategories, category],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    const typeData: PractitionerType = {
      ...formData,
      id: formData.id || `pt-${Date.now()}`,
    };

    onSave(typeData);
    toast.success(isEditing ? 'Practitioner type updated successfully' : 'Practitioner type created successfully');
    onClose();
  };

  const handleDelete = () => {
    if (practitionerType && onDelete && confirm(`Are you sure you want to delete ${practitionerType.name}?`)) {
      onDelete(practitionerType.id);
      toast.success('Practitioner type deleted successfully');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
          <h2 className="text-xl text-gray-900">
            {isEditing ? 'Edit Practitioner Type' : 'Create New Practitioner Type'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg text-gray-900 mb-4 flex items-center gap-2">
              <Stethoscope className="w-5 h-5" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block mb-2 text-gray-700">Type Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                  placeholder="e.g., Dermatologist, Laser Specialist, Nutritionist"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block mb-2 text-gray-700">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                  rows={3}
                  placeholder="Brief description of this practitioner type..."
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-gray-700">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                  required
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 text-gray-700">Color Theme</label>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => handleChange('color', color.value)}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        formData.color === color.value ? 'border-gray-900 scale-110' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Permissions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(formData.permissions).map(([key, value]) => (
                <label key={key} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-pink-300">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => handlePermissionChange(key as keyof PractitionerTypePermissions, e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Specialized Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(formData.features).map(([key, value]) => (
                <label key={key} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-pink-300">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => handleFeatureChange(key as keyof PractitionerTypeFeatures, e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">
                    {key.replace(/needs/g, '').replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Scheduling Rules */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Scheduling Rules
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 text-gray-700">Default Appointment Duration (minutes)</label>
                <input
                  type="number"
                  value={formData.schedulingRules.defaultAppointmentDuration}
                  onChange={(e) => handleSchedulingRuleChange('defaultAppointmentDuration', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                  min="15"
                  step="15"
                />
              </div>
              <div>
                <label className="block mb-2 text-gray-700">Max Appointments Per Day</label>
                <input
                  type="number"
                  value={formData.schedulingRules.maxAppointmentsPerDay}
                  onChange={(e) => handleSchedulingRuleChange('maxAppointmentsPerDay', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                  min="1"
                />
              </div>
              <div>
                <label className="block mb-2 text-gray-700">Buffer Time Before (minutes)</label>
                <input
                  type="number"
                  value={formData.schedulingRules.bufferTimeBefore}
                  onChange={(e) => handleSchedulingRuleChange('bufferTimeBefore', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                  min="0"
                  step="5"
                />
              </div>
              <div>
                <label className="block mb-2 text-gray-700">Buffer Time After (minutes)</label>
                <input
                  type="number"
                  value={formData.schedulingRules.bufferTimeAfter}
                  onChange={(e) => handleSchedulingRuleChange('bufferTimeAfter', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                  min="0"
                  step="5"
                />
              </div>
              <div className="md:col-span-2 space-y-3">
                <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-pink-300">
                  <input
                    type="checkbox"
                    checked={formData.schedulingRules.allowDoubleBooking}
                    onChange={(e) => handleSchedulingRuleChange('allowDoubleBooking', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Allow Double Booking</span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-pink-300">
                  <input
                    type="checkbox"
                    checked={formData.schedulingRules.requiresConsultation}
                    onChange={(e) => handleSchedulingRuleChange('requiresConsultation', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Requires Initial Consultation</span>
                </label>
              </div>
            </div>
          </div>

          {/* Required Certifications */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Required Certifications
            </h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={certificationInput}
                  onChange={(e) => setCertificationInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCertification())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                  placeholder="e.g., Board Certification in Dermatology"
                />
                <button
                  type="button"
                  onClick={handleAddCertification}
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.requiredCertifications.map((cert, index) => (
                  <div key={index} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg">
                    <span className="text-sm text-gray-700">{cert}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCertification(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Allowed Service Categories */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Allowed Service Categories
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {SERVICE_CATEGORIES.map((category) => (
                <label
                  key={category}
                  className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.allowedServiceCategories.includes(category)
                      ? 'border-pink-600 bg-pink-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.allowedServiceCategories.includes(category)}
                    onChange={() => toggleServiceCategory(category)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Active Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => handleChange('active', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-gray-700">Active (practitioners can be assigned to this type)</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-between gap-3 pt-4 border-t border-gray-200">
            <div>
              {isEditing && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-6 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Delete Type
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
                {isEditing ? 'Update' : 'Create'} Type
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
