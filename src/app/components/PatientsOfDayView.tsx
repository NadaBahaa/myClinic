import { useState } from 'react';
import { Calendar, Clock, User, Mail, Send, CheckCircle2, AlertCircle, CreditCard, Loader2 } from 'lucide-react';
import { NotificationRecord } from '../types';
import type { Appointment } from './CalendarView';
import { toast } from 'sonner';
import { notificationService } from '../../lib/services/notificationService';
import { appointmentService } from '../../lib/services/appointmentService';

interface PatientsOfDayViewProps {
  appointments: Appointment[];
  userRole: 'doctor' | 'assistant';
  /** For doctors: must be the doctor's UUID (same as appointment.doctorId). For assistants: unused (all doctors' appointments). */
  currentUserId: string;
  onAppointmentsChange?: () => void;
}

const initialNotifications: NotificationRecord[] = [];

function parseStartTime(date: Date, startTime: string): Date {
  const [h, m] = startTime.split(':').map((p) => parseInt(p, 10));
  const d = new Date(date);
  d.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
  return d;
}

function sessionHasStarted(appointment: Appointment): boolean {
  if (appointment.isPayable !== undefined) return appointment.isPayable;
  return Date.now() >= parseStartTime(appointment.date, appointment.startTime).getTime();
}

function appointmentIsPaid(appointment: Appointment): boolean {
  if (appointment.isPaid !== undefined) return appointment.isPaid;
  return appointment.status === 'completed';
}

export default function PatientsOfDayView({
  appointments,
  userRole,
  currentUserId,
  onAppointmentsChange,
}: PatientsOfDayViewProps) {
  const [selectedDay, setSelectedDay] = useState<'today' | 'tomorrow'>('today');
  const [notifications, setNotifications] = useState<NotificationRecord[]>(initialNotifications);
  const [payingId, setPayingId] = useState<string | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const getFilteredAppointments = () => {
    const targetDate = selectedDay === 'today' ? today : tomorrow;

    return appointments.filter((apt) => {
      const aptDate = new Date(apt.date);
      aptDate.setHours(0, 0, 0, 0);

      const isCorrectDate = aptDate.getTime() === targetDate.getTime();

      if (userRole === 'doctor') {
        return isCorrectDate && !!currentUserId && apt.doctorId === currentUserId;
      }
      return isCorrectDate;
    });
  };

  const filteredAppointments = getFilteredAppointments();

  const getNotificationCount = (appointmentId: string) => {
    return notifications.filter((n) => n.appointmentId === appointmentId).length;
  };

  const getLatestNotification = (appointmentId: string) => {
    const aptNotifications = notifications.filter((n) => n.appointmentId === appointmentId);
    if (aptNotifications.length === 0) return null;
    return aptNotifications.sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())[0];
  };

  const handleSendNotification = async (appointment: Appointment, method: 'email' | 'sms' | 'whatsapp') => {
    try {
      const result = await notificationService.sendReminders({
        appointmentIds: [appointment.id],
        alsoSms: method === 'sms',
        alsoWhatsApp: method === 'whatsapp',
      });

      const status = result.failed > 0 ? 'failed' : 'sent';
      const newNotification: NotificationRecord = {
        id: `n-${Date.now()}`,
        patientId: appointment.patientId,
        patientName: appointment.patientName,
        appointmentId: appointment.id,
        type: 'reminder',
        sentAt: new Date(),
        sentBy: currentUserId,
        method,
        status,
      };
      setNotifications((prev) => [...prev, newNotification]);

      if (result.sent > 0) {
        toast.success(`${method.toUpperCase()} reminder sent to ${appointment.patientName}`);
      } else {
        toast.error(`Failed to send ${method.toUpperCase()} reminder`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to send ${method.toUpperCase()} reminder`);
    }
  };

  const handlePay = async (appointment: Appointment) => {
    if (appointmentIsPaid(appointment) || !sessionHasStarted(appointment)) return;
    setPayingId(appointment.id);
    try {
      const result = await appointmentService.checkout(appointment.id);
      toast.success(
        `Payment recorded for ${appointment.patientName} — $${result.sessionRecord.servicePrice.toFixed(2)}`,
      );
      onAppointmentsChange?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setPayingId(null);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const paidCount = filteredAppointments.filter((a) => appointmentIsPaid(a)).length;

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900 mb-1">Patients of the Day</h1>
          <p className="text-gray-600">
            {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''} {selectedDay}
          </p>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setSelectedDay('today')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedDay === 'today' ? 'bg-white shadow-sm' : 'text-gray-600'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setSelectedDay('tomorrow')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedDay === 'tomorrow' ? 'bg-white shadow-sm' : 'text-gray-600'
            }`}
          >
            Tomorrow
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-gray-600">Total Appointments</span>
          </div>
          <p className="text-3xl text-gray-900">{filteredAppointments.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CreditCard className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-gray-600">Paid Sessions</span>
          </div>
          <p className="text-3xl text-gray-900">{paidCount}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-gray-600">Notifications Sent</span>
          </div>
          <p className="text-3xl text-gray-900">
            {notifications.filter((n) => filteredAppointments.some((a) => a.id === n.appointmentId)).length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <User className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-gray-600">Unique Patients</span>
          </div>
          <p className="text-3xl text-gray-900">{new Set(filteredAppointments.map((a) => a.patientId)).size}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg text-gray-900">
            {selectedDay === 'today' ? "Today's" : "Tomorrow's"} Schedule
          </h3>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No appointments scheduled for {selectedDay}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAppointments
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((appointment) => {
                const notificationCount = getNotificationCount(appointment.id);
                const latestNotification = getLatestNotification(appointment.id);
                const canPay =
                  userRole === 'assistant' &&
                  !appointmentIsPaid(appointment) &&
                  sessionHasStarted(appointment) &&
                  appointment.status !== 'cancelled';
                const isPaying = payingId === appointment.id;

                return (
                  <div key={appointment.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="text-lg text-gray-900 mb-1">{appointment.patientName}</h4>
                            <p className="text-pink-600">{appointment.serviceName}</p>
                            {appointment.servicePrice != null && (
                              <p className="text-sm text-gray-500 mt-1">${appointment.servicePrice.toFixed(2)}</p>
                            )}
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-sm ${
                              appointmentIsPaid(appointment) || appointment.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : appointment.status === 'scheduled'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {appointmentIsPaid(appointment) ? 'Paid' : appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {appointment.startTime} - {appointment.endTime} ({appointment.duration} min)
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {appointment.doctorName}
                          </div>
                        </div>

                        {latestNotification ? (
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="text-gray-600">
                              Last notification: {latestNotification.method.toUpperCase()} sent{' '}
                              {formatTime(latestNotification.sentAt)}
                              {notificationCount > 1 && (
                                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                                  {notificationCount} sent
                                </span>
                              )}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-amber-600">
                            <AlertCircle className="w-4 h-4" />
                            <span>No notifications sent yet</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 lg:w-48">
                        {userRole === 'assistant' && (
                          <>
                            <p className="text-xs text-gray-600 mb-1">Payment:</p>
                            {appointmentIsPaid(appointment) ? (
                              <div className="flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200">
                                <CheckCircle2 className="w-4 h-4" />
                                Paid
                              </div>
                            ) : (
                              <button
                                onClick={() => handlePay(appointment)}
                                disabled={!canPay || isPaying}
                                title={
                                  !sessionHasStarted(appointment)
                                    ? 'Available when session start time has passed'
                                    : 'Record payment and create session'
                                }
                                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  canPay
                                    ? 'bg-pink-600 text-white hover:bg-pink-700'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                              >
                                {isPaying ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CreditCard className="w-4 h-4" />
                                )}
                                Pay
                                {appointment.servicePrice != null && canPay && (
                                  <span className="opacity-90">${appointment.servicePrice.toFixed(0)}</span>
                                )}
                              </button>
                            )}
                          </>
                        )}

                        <p className="text-xs text-gray-600 mb-1 mt-2">Send Notification:</p>
                        <button
                          onClick={() => handleSendNotification(appointment, 'email')}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <Mail className="w-4 h-4" />
                          Email
                        </button>
                        <button
                          onClick={() => handleSendNotification(appointment, 'sms')}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          <Send className="w-4 h-4" />
                          SMS
                        </button>
                        <button
                          onClick={() => handleSendNotification(appointment, 'whatsapp')}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                        >
                          <Send className="w-4 h-4" />
                          WhatsApp
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
