import { useState, useEffect, useCallback } from 'react';
import { X, Bell, Send, Calendar, User, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { notificationService, type PendingReminder } from '../../lib/services/notificationService';
import { settingsService } from '../../lib/services/settingsService';

export interface Notification {
  id: string;
  type: 'reminder' | 'sent' | 'scheduled';
  patientName: string;
  patientEmail: string;
  appointmentDate: Date;
  appointmentTime: string;
  serviceName: string;
  sentAt?: Date;
  status: 'pending' | 'sent' | 'failed';
}

interface NotificationPanelProps {
  onClose: () => void;
}

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  const [pending, setPending] = useState<PendingReminder[]>([]);
  const [sentList, setSentList] = useState<any[]>([]);
  const [reminderDays, setReminderDays] = useState(1);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'sent'>('upcoming');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchPending = useCallback(() => {
    notificationService.getPending().then(setPending).catch(() => toast.error('Failed to load pending reminders')).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchPending();
    settingsService.get().then((s) => setReminderDays(s.reminderDaysBefore)).catch(() => {});
  }, [fetchPending]);

  useEffect(() => {
    if (activeTab === 'sent') {
      notificationService.getAll().then((list) => setSentList(list)).catch(() => {});
    }
  }, [activeTab]);

  const handleSendAllNotifications = async () => {
    if (pending.length === 0) return;
    setSending(true);
    try {
      const res = await notificationService.sendReminders();
      toast.success(`${res.sent} reminder(s) sent`, res.failed > 0 ? { description: `${res.failed} failed` } : undefined);
      fetchPending();
    } catch {
      toast.error('Failed to send reminders');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center md:justify-end z-50 p-0 md:p-4">
      <div className="bg-white w-full md:w-[480px] md:max-h-[90vh] h-full md:h-auto md:rounded-xl shadow-xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between md:rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-100 rounded-lg">
              <Bell className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <h2 className="text-xl text-gray-900">Notifications</h2>
              <p className="text-sm text-gray-600">Remind {reminderDays} day{reminderDays !== 1 ? 's' : ''} before</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'upcoming'
                ? 'border-pink-600 text-pink-600'
                : 'border-transparent text-gray-600'
            }`}
          >
            Upcoming ({pending.length})
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`px-4 py-3 border-b-2 transition-colors ${
              activeTab === 'sent'
                ? 'border-pink-600 text-pink-600'
                : 'border-transparent text-gray-600'
            }`}
          >
            Sent ({sentList.length})
          </button>
        </div>

        {/* Send All Button */}
        {activeTab === 'upcoming' && pending.length > 0 && (
          <div className="p-4 border-b border-gray-200">
            <button
              disabled={sending}
              onClick={handleSendAllNotifications}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
              {sending ? 'Sending…' : `Send All Reminders (${pending.length})`}
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'upcoming' && (
            <div className="space-y-4">
              {loading ? (
                <p className="text-gray-500 text-center py-8">Loading…</p>
              ) : pending.length === 0 ? (
                <div className="text-center py-12 text-gray-600">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No upcoming reminders</p>
                  <p className="text-sm mt-1">Appointments 1–{reminderDays} day(s) ahead already reminded or none scheduled.</p>
                </div>
              ) : (
                pending.map((p) => (
                  <PendingCard key={p.id} pending={p} />
                ))
              )}
            </div>
          )}

          {activeTab === 'sent' && (
            <div className="space-y-4">
              {sentList.length === 0 ? (
                <div className="text-center py-12 text-gray-600">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No sent notifications</p>
                </div>
              ) : (
                sentList.map((rec: any) => (
                  <SentCard key={rec.id} record={rec} />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PendingCard({ pending }: { pending: PendingReminder }) {
  return (
    <div className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-gray-600" />
            <h3 className="font-medium text-gray-900">{pending.patientName}</h3>
          </div>
          <p className="text-sm text-gray-600">{pending.patientEmail || '—'}</p>
          {pending.patientPhone && <p className="text-xs text-gray-500">{pending.patientPhone}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Calendar className="w-4 h-4" />
          <span>{pending.date} at {pending.startTime}</span>
        </div>
        <div className="text-sm text-gray-700"><span className="font-medium">Doctor:</span> {pending.doctorName}</div>
        <div className="text-sm text-gray-700"><span className="font-medium">Services:</span> {pending.services || '—'}</div>
      </div>
    </div>
  );
}

function SentCard({ record }: { record: any }) {
  const sentAt = record.sentAt ? new Date(record.sentAt) : null;
  return (
    <div className="p-4 rounded-lg border-2 border-green-200 bg-green-50">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{record.patientName ?? '—'}</h3>
          <p className="text-sm text-gray-600">{record.method} · {record.status}</p>
        </div>
        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
      </div>
      {sentAt && (
        <p className="text-xs text-gray-600">Sent {sentAt.toLocaleDateString()} at {sentAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
      )}
    </div>
  );
}
