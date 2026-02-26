import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { toast } from 'sonner';
import DailyCalendar from './DailyCalendar';
import MonthlyCalendar from './MonthlyCalendar';
import AppointmentModal, { type AppointmentLike } from './AppointmentModal';
import { appointmentService } from '../../lib/services/appointmentService';
import { patientService } from '../../lib/services/patientService';
import { doctorService } from '../../lib/services/doctorService';
import { serviceService } from '../../lib/services/serviceService';

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

function toTimeHHMM(t: string): string {
  if (!t) return '';
  const parts = String(t).trim().split(':');
  return parts.length >= 2 ? `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}` : t;
}

function toCalendarAppointment(api: {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  services?: string[];
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: string;
  notes?: string;
}): Appointment {
  return {
    id: api.id,
    patientId: api.patientId,
    patientName: api.patientName,
    doctorId: api.doctorId,
    doctorName: api.doctorName,
    serviceId: '',
    serviceName: (api.services || []).join(', ') || '—',
    date: new Date(api.date),
    startTime: toTimeHHMM(api.startTime),
    endTime: toTimeHHMM(api.endTime),
    duration: api.duration,
    status: api.status as Appointment['status'],
    notes: api.notes,
  };
}

export default function CalendarView() {
  const [view, setView] = useState<'daily' | 'monthly'>('daily');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [patients, setPatients] = useState<{ id: string; name: string; email?: string }[]>([]);
  const [doctors, setDoctors] = useState<{ id: string; name: string; specialty?: string }[]>([]);
  const [services, setServices] = useState<{ id: string; name: string; duration: number }[]>([]);

  // Dynamic data: fetch by date (daily) or by month range (monthly)
  const fetchAppointments = useCallback(() => {
    setLoading(true);
    if (view === 'daily') {
      const dateStr = currentDate.toISOString().split('T')[0];
      appointmentService.byDate(dateStr)
        .then((list) => setAppointments(list.map(toCalendarAppointment)))
        .catch(() => toast.error('Failed to load appointments'))
        .finally(() => setLoading(false));
    } else {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const dateFrom = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const dateTo = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      appointmentService.byDateRange(dateFrom, dateTo)
        .then((list) => setAppointments(list.map(toCalendarAppointment)))
        .catch(() => toast.error('Failed to load appointments'))
        .finally(() => setLoading(false));
    }
  }, [currentDate, view]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    patientService.getAll().then((list) => setPatients(list)).catch(() => {});
    doctorService.getAll().then((list) => setDoctors(list)).catch(() => {});
    serviceService.getAll().then((list) => setServices(list)).catch(() => {});
  }, []);

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

  const handleAppointmentUpdate = async (updatedAppointment: Appointment) => {
    const payload = {
      date: updatedAppointment.date.toISOString().split('T')[0],
      startTime: updatedAppointment.startTime,
      endTime: updatedAppointment.endTime,
      duration: updatedAppointment.duration,
      status: updatedAppointment.status,
      notes: updatedAppointment.notes ?? undefined,
    };
    try {
      await appointmentService.update(updatedAppointment.id, payload);
      fetchAppointments();
      toast.success('Appointment updated. Doctor has been notified.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update appointment');
    }
  };

  const handleAppointmentDelete = async (id: string) => {
    try {
      await appointmentService.remove(id);
      fetchAppointments();
      toast.success('Appointment cancelled.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to cancel appointment');
    }
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
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading appointments...</div>
        ) : view === 'daily' ? (
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
          appointment={editingAppointment ? {
            id: editingAppointment.id,
            patientName: editingAppointment.patientName,
            patientEmail: '',
            doctorId: editingAppointment.doctorId,
            doctorName: editingAppointment.doctorName,
            services: editingAppointment.serviceName ? editingAppointment.serviceName.split(',').map(s => s.trim()).filter(Boolean) : [],
            date: editingAppointment.date,
            time: editingAppointment.startTime,
            startTime: editingAppointment.startTime,
            endTime: editingAppointment.endTime,
            duration: editingAppointment.duration,
            status: editingAppointment.status,
            notes: editingAppointment.notes,
          } : undefined}
          selectedDate={currentDate}
          onClose={handleModalClose}
          onSave={async (apt) => {
            if (editingAppointment) {
              const merged: Appointment = {
                ...editingAppointment,
                id: editingAppointment.id,
                date: apt.date instanceof Date ? apt.date : new Date(apt.date),
                startTime: apt.startTime ?? editingAppointment.startTime,
                endTime: apt.endTime ?? editingAppointment.endTime,
                duration: apt.duration ?? editingAppointment.duration,
                status: apt.status,
                notes: apt.notes,
              };
              await handleAppointmentUpdate(merged);
              handleModalClose();
            } else {
              const canCreate = apt.patientId && (apt as { serviceIds?: string[] }).serviceIds?.length;
              if (canCreate) {
                try {
                  const dateStr = apt.date instanceof Date ? apt.date.toISOString().split('T')[0] : String(apt.date).slice(0, 10);
                  await appointmentService.create({
                    patientId: apt.patientId,
                    doctorId: apt.doctorId,
                    date: dateStr,
                    startTime: apt.startTime!,
                    endTime: apt.endTime!,
                    duration: apt.duration!,
                    status: apt.status,
                    notes: apt.notes,
                    serviceIds: (apt as { serviceIds?: string[] }).serviceIds!,
                  });
                  fetchAppointments();
                  toast.success('Appointment created.');
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : 'Failed to create appointment');
                  return;
                }
              } else {
                handleAddAppointment({
                  ...apt,
                  patientId: apt.patientId ?? '',
                  serviceId: '',
                  serviceName: apt.services?.join(', ') ?? '',
                  startTime: apt.startTime ?? apt.time,
                  endTime: apt.endTime ?? apt.time,
                  duration: apt.duration ?? 0,
                } as Omit<Appointment, 'id'>);
              }
              handleModalClose();
            }
          }}
          existingAppointments={appointments as AppointmentLike[]}
          existingPatients={patients}
          existingDoctors={doctors}
          existingServices={services}
        />
      )}
    </div>
  );
}