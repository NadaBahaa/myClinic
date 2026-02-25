import { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Stethoscope, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export interface Appointment {
  id: string;
  patientName: string;
  patientEmail: string;
  doctorId: string;
  doctorName: string;
  services: string[];
  date: Date;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

interface AppointmentModalProps {
  appointment?: Appointment;
  selectedDate?: Date;
  selectedTime?: string;
  onClose: () => void;
  onSave: (appointment: Appointment) => void;
  existingAppointments?: Appointment[];
}

const mockPatients = [
  { id: 'p1', name: 'Emma Wilson', email: 'emma.wilson@email.com' },
  { id: 'p2', name: 'Olivia Brown', email: 'olivia.brown@email.com' },
  { id: 'p3', name: 'Sophia Davis', email: 'sophia.davis@email.com' },
  { id: 'p4', name: 'Ava Martinez', email: 'ava.martinez@email.com' },
];

const mockDoctors = [
  { id: '2', name: 'Dr. Sarah Johnson', specialty: 'Dermatology' },
  { id: '3', name: 'Dr. Michael Chen', specialty: 'Cosmetic Surgery' },
];

const mockServices = [
  { id: 's1', name: 'Facial Treatment', duration: 60 },
  { id: 's2', name: 'Laser Hair Removal', duration: 60 },
  { id: 's3', name: 'Botox Injection', duration: 30 },
  { id: 's4', name: 'Chemical Peel', duration: 45 },
  { id: 's5', name: 'Microdermabrasion', duration: 60 },
  { id: 's6', name: 'Dermal Fillers', duration: 45 },
];

export default function AppointmentModal({
  appointment,
  selectedDate,
  selectedTime,
  onClose,
  onSave,
  existingAppointments = [],
}: AppointmentModalProps) {
  const isEditing = !!appointment;

  // Convert old appointment format to new format if needed
  const initialServices = appointment?.services || 
    (appointment?.serviceName ? [appointment.serviceName] : []);

  const [formData, setFormData] = useState({
    patientName: appointment?.patientName || '',
    patientEmail: appointment?.patientEmail || '',
    doctorId: appointment?.doctorId || '',
    doctorName: appointment?.doctorName || '',
    services: initialServices,
    date: appointment?.date || selectedDate || new Date(),
    time: appointment?.time || appointment?.startTime || selectedTime || '09:00',
    status: appointment?.status || 'scheduled' as const,
    notes: appointment?.notes || '',
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDoctorChange = (doctorId: string) => {
    const doctor = mockDoctors.find((d) => d.id === doctorId);
    setFormData((prev) => ({
      ...prev,
      doctorId,
      doctorName: doctor?.name || '',
    }));
  };

  const handlePatientChange = (patientName: string) => {
    const patient = mockPatients.find((p) => p.name === patientName);
    setFormData((prev) => ({
      ...prev,
      patientName,
      patientEmail: patient?.email || '',
    }));
  };

  const toggleService = (serviceName: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(serviceName)
        ? prev.services.filter((s) => s !== serviceName)
        : [...prev.services, serviceName],
    }));
  };

  // Calculate total duration of selected services
  const getTotalDuration = () => {
    return formData.services.reduce((total, serviceName) => {
      const service = mockServices.find(s => s.name === serviceName);
      return total + (service?.duration || 0);
    }, 0);
  };

  // Parse time string to minutes
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Check for doctor conflicts
  const checkDoctorConflict = (): boolean => {
    const appointmentStart = timeToMinutes(formData.time);
    const appointmentEnd = appointmentStart + getTotalDuration();
    const dateStr = formData.date.toDateString();

    return existingAppointments.some((apt) => {
      // Skip the current appointment if editing
      if (isEditing && apt.id === appointment.id) return false;

      // Check if same doctor and same date
      if (apt.doctorId !== formData.doctorId) return false;
      if (apt.date.toDateString() !== dateStr) return false;
      if (apt.status === 'cancelled') return false;

      // Calculate existing appointment duration
      const existingDuration = apt.services.reduce((total, serviceName) => {
        const service = mockServices.find(s => s.name === serviceName);
        return total + (service?.duration || 0);
      }, 0);

      const existingStart = timeToMinutes(apt.time);
      const existingEnd = existingStart + existingDuration;

      // Check for overlap
      return (appointmentStart < existingEnd && appointmentEnd > existingStart);
    });
  };

  // Check for patient conflicts
  const checkPatientConflict = (): boolean => {
    const appointmentStart = timeToMinutes(formData.time);
    const appointmentEnd = appointmentStart + getTotalDuration();
    const dateStr = formData.date.toDateString();

    return existingAppointments.some((apt) => {
      // Skip the current appointment if editing
      if (isEditing && apt.id === appointment.id) return false;

      // Check if same patient and same date
      if (apt.patientName !== formData.patientName) return false;
      if (apt.date.toDateString() !== dateStr) return false;
      if (apt.status === 'cancelled') return false;

      // Calculate existing appointment duration
      const existingDuration = apt.services.reduce((total, serviceName) => {
        const service = mockServices.find(s => s.name === serviceName);
        return total + (service?.duration || 0);
      }, 0);

      const existingStart = timeToMinutes(apt.time);
      const existingEnd = existingStart + existingDuration;

      // Check for overlap
      return (appointmentStart < existingEnd && appointmentEnd > existingStart);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patientName || !formData.doctorId || formData.services.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check for doctor conflicts
    if (checkDoctorConflict()) {
      const doctor = mockDoctors.find(d => d.id === formData.doctorId);
      toast.error(`${doctor?.name} already has an appointment at this time`);
      return;
    }

    // Check for patient conflicts
    if (checkPatientConflict()) {
      toast.error(`${formData.patientName} already has an appointment at this time`);
      return;
    }

    const appointmentData: Appointment = {
      id: appointment?.id || `apt-${Date.now()}`,
      patientName: formData.patientName,
      patientEmail: formData.patientEmail,
      doctorId: formData.doctorId,
      doctorName: formData.doctorName,
      services: formData.services,
      date: formData.date,
      time: formData.time,
      status: formData.status,
      notes: formData.notes,
    };

    onSave(appointmentData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-xl text-gray-900">
            {isEditing ? 'Edit Appointment' : 'New Appointment'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Patient Selection */}
          <div>
            <label className="block mb-2 text-gray-700 flex items-center gap-2">
              <User className="w-4 h-4" />
              Patient *
            </label>
            <select
              value={formData.patientName}
              onChange={(e) => handlePatientChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
              required
            >
              <option value="">Select a patient</option>
              {mockPatients.map((patient) => (
                <option key={patient.id} value={patient.name}>
                  {patient.name}
                </option>
              ))}
            </select>
            {formData.patientEmail && (
              <p className="text-sm text-gray-600 mt-1">{formData.patientEmail}</p>
            )}
          </div>

          {/* Doctor Selection */}
          <div>
            <label className="block mb-2 text-gray-700 flex items-center gap-2">
              <Stethoscope className="w-4 h-4" />
              Doctor *
            </label>
            <select
              value={formData.doctorId}
              onChange={(e) => handleDoctorChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
              required
            >
              <option value="">Select a doctor</option>
              {mockDoctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name} - {doctor.specialty}
                </option>
              ))}
            </select>
          </div>

          {/* Services Selection */}
          <div>
            <label className="block mb-2 text-gray-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Services * (Select multiple)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mockServices.map((service) => (
                <label
                  key={service.id}
                  className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.services.includes(service.name)
                      ? 'border-pink-600 bg-pink-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.services.includes(service.name)}
                    onChange={() => toggleService(service.name)}
                    className="mt-1 rounded border-gray-300"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{service.name}</p>
                    <p className="text-xs text-gray-600">{service.duration} minutes</p>
                  </div>
                </label>
              ))}
            </div>
            {formData.services.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Total Duration:</strong> {getTotalDuration()} minutes ({(getTotalDuration() / 60).toFixed(1)} hours)
                </p>
              </div>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date *
              </label>
              <input
                type="date"
                value={formData.date.toISOString().split('T')[0]}
                onChange={(e) => handleChange('date', new Date(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                required
              />
            </div>
            <div>
              <label className="block mb-2 text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Time *
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => handleChange('time', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
                required
              />
            </div>
          </div>

          {/* Status (only when editing) */}
          {isEditing && (
            <div>
              <label className="block mb-2 text-gray-700">Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
              >
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block mb-2 text-gray-700">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
              rows={3}
              placeholder="Any special requirements or notes..."
            />
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
              {isEditing ? 'Update' : 'Create'} Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}