import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import DailyCalendar from './DailyCalendar';
import MonthlyCalendar from './MonthlyCalendar';
import AppointmentModal from './AppointmentModal';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  serviceId: string;
  serviceName: string;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

// Mock appointments
const initialAppointments: Appointment[] = [
  {
    id: '1',
    patientId: 'p1',
    patientName: 'Emma Wilson',
    doctorId: '2',
    doctorName: 'Dr. Sarah Johnson',
    serviceId: 's1',
    serviceName: 'Facial Treatment',
    date: new Date(),
    startTime: '09:00',
    endTime: '10:00',
    duration: 60,
    status: 'scheduled',
    notes: 'First visit'
  },
  {
    id: '2',
    patientId: 'p2',
    patientName: 'Olivia Brown',
    doctorId: '3',
    doctorName: 'Dr. Michael Chen',
    serviceId: 's2',
    serviceName: 'Laser Hair Removal',
    date: new Date(),
    startTime: '10:30',
    endTime: '11:30',
    duration: 60,
    status: 'scheduled',
  },
  {
    id: '3',
    patientId: 'p3',
    patientName: 'Sophia Davis',
    doctorId: '2',
    doctorName: 'Dr. Sarah Johnson',
    serviceId: 's3',
    serviceName: 'Botox Injection',
    date: new Date(),
    startTime: '14:00',
    endTime: '14:30',
    duration: 30,
    status: 'scheduled',
  },
];

export default function CalendarView() {
  const [view, setView] = useState<'daily' | 'monthly'>('daily');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (view === 'daily') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'daily') {
      newDate.setDate(newDate.getDate() + 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const formatDate = () => {
    if (view === 'daily') {
      return currentDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    return currentDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const handleAppointmentUpdate = (updatedAppointment: Appointment) => {
    setAppointments(prev => 
      prev.map(apt => apt.id === updatedAppointment.id ? updatedAppointment : apt)
    );
  };

  const handleAppointmentDelete = (id: string) => {
    setAppointments(prev => prev.filter(apt => apt.id !== id));
  };

  const handleAddAppointment = (newAppointment: Omit<Appointment, 'id'>) => {
    const appointment: Appointment = {
      ...newAppointment,
      id: `apt-${Date.now()}`,
    };
    setAppointments(prev => [...prev, appointment]);
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingAppointment(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900 mb-2">Calendar</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-lg text-gray-700 min-w-[200px] text-center">{formatDate()}</span>
            <button
              onClick={handleNext}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors ml-2"
            >
              Today
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('daily')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                view === 'daily' ? 'bg-white shadow-sm' : 'text-gray-600'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setView('monthly')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                view === 'monthly' ? 'bg-white shadow-sm' : 'text-gray-600'
              }`}
            >
              Monthly
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">New Appointment</span>
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 bg-white rounded-xl shadow-sm overflow-hidden">
        {view === 'daily' ? (
          <DailyCalendar
            date={currentDate}
            appointments={appointments}
            onAppointmentUpdate={handleAppointmentUpdate}
            onAppointmentDelete={handleAppointmentDelete}
            onAppointmentEdit={handleEditAppointment}
          />
        ) : (
          <MonthlyCalendar
            date={currentDate}
            appointments={appointments}
            onDateSelect={(date) => {
              setCurrentDate(date);
              setView('daily');
            }}
          />
        )}
      </div>

      {/* Appointment Modal */}
      {isModalOpen && (
        <AppointmentModal
          appointment={editingAppointment}
          onClose={handleModalClose}
          onSave={(apt) => {
            if (editingAppointment) {
              handleAppointmentUpdate({ ...apt, id: editingAppointment.id } as Appointment);
            } else {
              handleAddAppointment(apt);
            }
            handleModalClose();
          }}
          existingAppointments={appointments}
        />
      )}
    </div>
  );
}