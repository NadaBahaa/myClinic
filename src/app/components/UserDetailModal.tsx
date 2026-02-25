import { useState } from 'react';
import { X, Mail, Lock, Shield, User } from 'lucide-react';
import { toast } from 'sonner';
import { usePractitionerTypes } from '../contexts/PractitionerTypeContext';

export interface UserPermissions {
  showCalendar: boolean;
  showPatients: boolean;
  showDoctors: boolean;
  showServices: boolean;
  showUsers: boolean;
  showSettings: boolean;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'doctor' | 'assistant';
  practitionerTypeId?: string; // For doctors
  permissions: UserPermissions;
}

interface UserDetailModalProps {
  user: SystemUser | null;
  onClose: () => void;
  onSave: (user: SystemUser) => void;
  existingEmails: string[];
}

const defaultPermissions: Record<string, UserPermissions> = {
  admin: {
    showCalendar: true,
    showPatients: true,
    showDoctors: true,
    showServices: true,
    showUsers: true,
    showSettings: true,
  },
  doctor: {
    showCalendar: true,
    showPatients: true,
    showDoctors: false,
    showServices: true,
    showUsers: false,
    showSettings: false,
  },
  assistant: {
    showCalendar: true,
    showPatients: true,
    showDoctors: true,
    showServices: true,
    showUsers: false,
    showSettings: false,
  },
};

export default function UserDetailModal({ user, onClose, onSave, existingEmails }: UserDetailModalProps) {
  const isEditing = !!user;
  const { getActivePractitionerTypes, getPractitionerTypeById } = usePractitionerTypes();
  const activePractitionerTypes = getActivePractitionerTypes();
  
  const [formData, setFormData] = useState<SystemUser>(
    user || {
      id: '',
      name: '',
      email: '',
      password: '',
      role: 'assistant',
      practitionerTypeId: undefined,
      permissions: defaultPermissions.assistant,
    }
  );

  const selectedPractitionerType = formData.practitionerTypeId 
    ? getPractitionerTypeById(formData.practitionerTypeId)
    : undefined;

  const handleChange = (field: keyof SystemUser, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRoleChange = (role: 'admin' | 'doctor' | 'assistant') => {
    setFormData(prev => ({
      ...prev,
      role,
      permissions: defaultPermissions[role],
      // Clear practitioner type if not a doctor
      practitionerTypeId: role === 'doctor' ? prev.practitionerTypeId : undefined,
    }));
  };

  const togglePermission = (permission: keyof UserPermissions) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: !prev.permissions[permission],
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || (!isEditing && !formData.password)) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate practitioner type for doctors
    if (formData.role === 'doctor' && !formData.practitionerTypeId) {
      toast.error('Please select a practitioner type for doctors');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Check for duplicate email
    if (existingEmails.includes(formData.email)) {
      toast.error('This email is already in use');
      return;
    }

    // Validate password length
    if (!isEditing && formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    const userData: SystemUser = {
      ...formData,
      id: formData.id || `u-${Date.now()}`,
    };

    onSave(userData);
    onClose();
  };

  const permissionLabels: Record<keyof UserPermissions, string> = {
    showCalendar: 'Calendar',
    showPatients: 'Patients',
    showDoctors: 'Doctors',
    showServices: 'Services',
    showUsers: 'User Management',
    showSettings: 'Settings',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-xl text-gray-900">
            {isEditing ? 'Edit User' : 'Add New User'}
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
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                  placeholder="John Doe"
                  required
                />
              </div>

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
                  placeholder="user@clinic.com"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 text-gray-700 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password {isEditing && '(leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                  placeholder="••••••••"
                  required={!isEditing}
                  minLength={6}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Minimum 6 characters
                </p>
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <h3 className="text-lg text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Role *
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {(['admin', 'doctor', 'assistant'] as const).map((role) => (
                <label
                  key={role}
                  className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.role === role
                      ? 'border-pink-600 bg-pink-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={formData.role === role}
                    onChange={() => handleRoleChange(role)}
                    className="sr-only"
                  />
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    role === 'admin' ? 'bg-purple-100 text-purple-700' :
                    role === 'doctor' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Practitioner Type Selection - Only for Doctors */}
          {formData.role === 'doctor' && (
            <div>
              <h3 className="text-lg text-gray-900 mb-4">Practitioner Type *</h3>
              <select
                value={formData.practitionerTypeId || ''}
                onChange={(e) => handleChange('practitionerTypeId', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                required
              >
                <option value="">Select practitioner type...</option>
                {activePractitionerTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} - {type.category}
                  </option>
                ))}
              </select>
              {selectedPractitionerType && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>{selectedPractitionerType.name}</strong>
                  </p>
                  <p className="text-sm text-gray-600">{selectedPractitionerType.description}</p>
                  {selectedPractitionerType.requiredCertifications.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600">Required Certifications:</p>
                      <ul className="text-xs text-gray-500 list-disc list-inside">
                        {selectedPractitionerType.requiredCertifications.map((cert, index) => (
                          <li key={index}>{cert}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Permissions */}
          <div>
            <h3 className="text-lg text-gray-900 mb-4">Permissions</h3>
            <div className="space-y-3">
              {(Object.keys(permissionLabels) as Array<keyof UserPermissions>).map((permission) => (
                <label
                  key={permission}
                  className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.permissions[permission]
                      ? 'border-pink-200 bg-pink-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.permissions[permission]}
                    onChange={() => togglePermission(permission)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-gray-700">{permissionLabels[permission]}</span>
                </label>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-3">
              Select which sections this user can access
            </p>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Preview</h3>
            <p className="text-sm text-gray-700">
              <strong>{formData.name || 'User Name'}</strong> will have access to:{' '}
              {Object.entries(formData.permissions)
                .filter(([_, enabled]) => enabled)
                .map(([key]) => permissionLabels[key as keyof UserPermissions])
                .join(', ') || 'No permissions'}
            </p>
            {formData.role === 'doctor' && selectedPractitionerType && (
              <p className="text-sm text-gray-700 mt-1">
                Practitioner Type: <strong>{selectedPractitionerType.name}</strong>
              </p>
            )}
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
              {isEditing ? 'Update' : 'Add'} User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}