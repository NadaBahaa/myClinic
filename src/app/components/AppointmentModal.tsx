import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Stethoscope, Sparkles, Info } from 'lucide-react';
import { toast } from 'sonner';
import { formatLocalDateYYYYMMDD } from '../../lib/date';

export interface Appointment {
  id: string;
  patientName: string;
  patientEmail: string;
  patientId?: string;
  doctorId: string;
  doctorName: string;
  services: string[];
  serviceIds?: string[];
  date: Date;
  time: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

export type AppointmentLike = {
  id?: string;
  doctorId: string;
  patientName: string;
  date: Date | string;
  status: string;
  services?: string[];
  time?: string;
  startTime?: string;
  duration?: number;
};

interface DoctorWithServices {
  id: string;
  name: string;
  specialty?: string;
  services?: { id: string; name: string; duration: number; price?: number }[];
}

interface AppointmentModalProps {
  appointment?: Appointment;
  selectedDate?: Date;
  selectedTime?: string;
  onClose: () => void;
  onSave: (appointment: Appointment) => void;
  existingAppointments?: AppointmentLike[];
  existingPatients?: { id: string; name: string; email?: string }[];
  existingDoctors?: DoctorWithServices[];
  existingServices?: { id: string; name: string; duration: number }[];
}

const mockPatients = [
  { id: 'p1', name: 'Emma Wilson', email: 'emma.wilson@email.com' },
  { id: 'p2', name: 'Olivia Brown', email: 'olivia.brown@email.com' },
];

const mockDoctors: DoctorWithServices[] = [
  { id: '2', name: 'Dr. Sarah Johnson', specialty: 'Dermatology' },
  { id: '3', name: 'Dr. Michael Chen', specialty: 'Cosmetic Surgery' },
];

const mockServices = [
  { id: 's1', name: 'Facial Treatment', duration: 60 },
  { id: 's2', name: 'Laser Hair Removal', duration: 60 },
  { id: 's3', name: 'Botox Injection', duration: 30 },
  { id: 's4', name: 'Chemical Peel', duration: 45 },
];

export default function AppointmentModal({
  appointment,
  selectedDate,
  selectedTime,
  onClose,
  onSave,
  existingAppointments = [],
  existingPatients,
  existingDoctors,
  existingServices,
}: AppointmentModalProps) {
  const isEditing = !!appointment;
  const patients = existingPatients?.length ? existingPatients : mockPatients;
  const doctors = existingDoctors?.length ? existingDoctors : mockDoctors;

  const initialServices = appointment?.services ||
    ((appointment as any)?.serviceName
      ? (appointment as any).serviceName.split(',').map((s: string) => s.trim()).filter(Boolean)
      : []);

  const [formData, setFormData] = useState({
    patientName: appointment?.patientName || '',
    patientEmail: appointment?.patientEmail || '',
    patientId: (appointment as any)?.patientId || '',
    doctorId: appointment?.doctorId || '',
    doctorName: appointment?.doctorName || '',
    services: initialServices,
    date: appointment?.date || selectedDate || new Date(),
    time: appointment?.time || (appointment as any)?.startTime || selectedTime || '09:00',
    status: appointment?.status || 'scheduled' as const,
    notes: appointment?.notes || '',
  });

  // Services filtered based on selected doctor
  const [filteredServices, setFilteredServices] = useState<{ id: string; name: string; duration: number }[]>([]);
  const [hasDoctoServices, setHasDoctorServices] = useState(false);

  useEffect(() => {
    if (!formData.doctorId) {
      // No doctor selected: show all services
      setFilteredServices(existingServices?.length ? existingServices : mockServices);
      setHasDoctorServices(false);
      return;
    }
    const selectedDoctor = doctors.find(d => d.id === formData.doctorId);
    if (selectedDoctor?.services && selectedDoctor.services.length > 0) {
      setFilteredServices(selectedDoctor.services);
      setHasDoctorServices(true);
    } else {
      // Doctor has no linked services via practitioner type - fall back to all services
      setFilteredServices(existingServices?.length ? existingServices : mockServices);
      setHasDoctorServices(false);
    }
    // Clear services that are no longer available for the new doctor
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter(sName =>
        (selectedDoctor?.services?.some(s => s.name === sName)) ||
        (!selectedDoctor?.services?.length && (existingServices ?? mockServices).some(s => s.name === sName))
      ),
    }));
  }, [formData.doctorId, doctors, existingServices]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDoctorChange = (doctorId: string) => {
    const doctor = doctors.find(d => d.id === doctorId);
    setFormData(prev => ({
      ...prev,
      doctorId,
      doctorName: doctor?.name || '',
      services: [], // reset services when doctor changes
    }));
  };

  const handlePatientChange = (patientName: string) => {
    const patient = patients.find(p => p.name === patientName);
    setFormData(prev => ({
      ...prev,
      patientName,
      patientEmail: patient?.email || '',
      patientId: patient?.id || '',
    }));
  };

  const toggleService = (serviceName: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(serviceName)
        ? prev.services.filter(s => s !== serviceName)
        : [...prev.services, serviceName],
    }));
  };

  const getTotalDuration = () => {
    return formData.services.reduce((total, serviceName) => {
      const service = filteredServices.find(s => s.name === serviceName);
      return total + (service?.duration || 0);
    }, 0);
  };

  const timeToMinutes = (time: string): number => {
    const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) return 0;
    let [, h, m, ampm] = match;
    let hours = parseInt(h!, 10);
    const minutes = parseInt(m!, 10);
    if (ampm) {
      if (ampm.toUpperCase() === 'PM' && hours !== 12) hours += 12;
      if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
    }
    return hours * 60 + minutes;
  };

  const minutesToTime = (mins: number): string => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const getExistingDuration = (apt: { services?: string[]; duration?: number }): number => {
    if (apt.duration != null && typeof apt.duration === 'number') return apt.duration;
    if (Array.isArray(apt.services) && apt.services.length > 0) {
      return apt.services.reduce((total, serviceName) => {
        const service = filteredServices.find(s => s.name === serviceName);
        return total + (service?.duration || 0);
      }, 0);
    }
    return 0;
  };

  const getAptTime = (apt: { time?: string; startTime?: string }): string =>
    apt.time ?? (apt as any).startTime ?? '00:00';

  const getAptDateString = (apt: { date: Date | string }): string =>
    typeof apt.date === 'string' ? apt.date : (apt.date as Date).toDateString?.() ?? '';

  const checkDoctorConflict = (): boolean => {
    const appointmentStart = timeToMinutes(formData.time);
    const appointmentEnd = appointmentStart + getTotalDuration();
    const dateStr = formData.date.toDateString();
    return existingAppointments.some(apt => {
      if (isEditing && apt.id === appointment.id) return false;
      if (apt.doctorId !== formData.doctorId) return false;
      if (getAptDateString(apt) !== dateStr) return false;
      if (apt.status === 'cancelled') return false;
      const existingStart = timeToMinutes(getAptTime(apt));
      const existingEnd = existingStart + getExistingDuration(apt);
      return appointmentStart < existingEnd && appointmentEnd > existingStart;
    });
  };

  const checkPatientConflict = (): boolean => {
    const appointmentStart = timeToMinutes(formData.time);
    const appointmentEnd = appointmentStart + getTotalDuration();
    const dateStr = formData.date.toDateString();
    return existingAppointments.some(apt => {
      if (isEditing && apt.id === appointment.id) return false;
      if (apt.patientName !== formData.patientName) return false;
      if (getAptDateString(apt) !== dateStr) return false;
      if (apt.status === 'cancelled') return false;
      const existingStart = timeToMinutes(getAptTime(apt));
      const existingEnd = existingStart + getExistingDuration(apt);
      return appointmentStart < existingEnd && appointmentEnd > existingStart;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.patientName || !formData.doctorId || formData.services.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (checkDoctorConflict()) {
      const doctor = doctors.find(d => d.id === formData.doctorId);
      toast.error(`${doctor?.name} already has an appointment at this time`);
      return;
    }

    if (checkPatientConflict()) {
      toast.error(`${formData.patientName} already has an appointment at this time`);
      return;
    }

    const duration = getTotalDuration();
    const startMins = timeToMinutes(formData.time);
    const endTime = minutesToTime(startMins + duration);

    const appointmentData: Appointment = {
      id: appointment?.id || `apt-${Date.now()}`,
      patientName: formData.patientName,
      patientEmail: formData.patientEmail,
      doctorId: formData.doctorId,
      doctorName: formData.doctorName,
      services: formData.services,
      date: formData.date,
      time: formData.time,
      startTime: minutesToTime(startMins),
      endTime,
      duration,
      status: formData.status,
      notes: formData.notes,
    };

    if (formData.patientId) (appointmentData as any).patientId = formData.patientId;

    // Include service IDs from filtered services
    (appointmentData as any).serviceIds = formData.services
      .map(name => filteredServices.find(s => s.name === name)?.id)
      .filter((id): id is string => !!id);

    onSave(appointmentData);
    onClose();
  };

  const selectedDoctorObj = doctors.find(d => d.id === formData.doctorId);

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
              onChange={e => handlePatientChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
              required
            >
              <option value="">Select a patient</option>
              {patients.map(patient => (
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
              onChange={e => handleDoctorChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
              required
            >
              <option value="">Select a doctor</option>
              {doctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name}{doctor.specialty ? ` — ${doctor.specialty}` : ''}
                </option>
              ))}
            </select>
            {selectedDoctorObj && hasDoctoServices && (
              <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Showing {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} available for {selectedDoctorObj.name}
              </p>
            )}
          </div>

          {/* Services Selection — filtered by selected doctor */}
          <div>
            <label className="block mb-2 text-gray-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Services * (Select one or more)
            </label>
            {filteredServices.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                {formData.doctorId ? 'No services available for the selected doctor.' : 'Select a doctor to see available services.'}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredServices.map(service => (
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
                      <p className="text-xs text-gray-500">{service.duration} min{(service as any).price ? ` · EGP ${(service as any).price}` : ''}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
            {formData.services.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Total Duration:</strong> {getTotalDuration()} min ({(getTotalDuration() / 60).toFixed(1)} h)
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
                value={formatLocalDateYYYYMMDD(formData.date)}
                onChange={e => handleChange('date', new Date(e.target.value))}
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
                onChange={e => handleChange('time', e.target.value)}
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
                onChange={e => handleChange('status', e.target.value)}
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
              onChange={e => handleChange('notes', e.target.value)}
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
