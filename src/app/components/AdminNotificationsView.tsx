import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell, Mail, MessageSquare, Phone, RefreshCw, Calendar, Clock,
  User, CheckCircle, XCircle, ChevronDown, ChevronUp, Send,
} from 'lucide-react';
import { notificationService } from '../../lib/services/notificationService';
import type { NotificationRecord, PatientNotificationCount } from '../types';
import { toast } from 'sonner';

type TabType = 'counts' | 'log';

const METHOD_ICON: Record<string, React.ReactNode> = {
  email:    <Mail className="w-3.5 h-3.5" />,
  sms:      <MessageSquare className="w-3.5 h-3.5" />,
  whatsapp: <Phone className="w-3.5 h-3.5" />,
};

const METHOD_COLOR: Record<string, string> = {
  email:    'bg-blue-100 text-blue-700',
  sms:      'bg-green-100 text-green-700',
  whatsapp: 'bg-teal-100 text-teal-700',
};

function formatDateTime(dt: string | Date): string {
  const d = typeof dt === 'string' ? new Date(dt) : dt;
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function CountsTab() {
  const [counts, setCounts] = useState<PatientNotificationCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [history, setHistory] = useState<Record<string, NotificationRecord[]>>({});

  const loadCounts = useCallback(() => {
    setLoading(true);
    notificationService.getPatientCounts()
      .then(setCounts)
      .catch(() => toast.error('Failed to load notification counts'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadCounts(); }, [loadCounts]);

  const toggleExpand = async (patientId: string) => {
    if (expanded === patientId) {
      setExpanded(null);
      return;
    }
    setExpanded(patientId);
    if (!history[patientId]) {
      try {
        const all = await notificationService.getAll({ active_only: true });
        const patientRecords = all.filter(n => n.patientId === patientId);
        setHistory(prev => ({ ...prev, [patientId]: patientRecords }));
      } catch {
        toast.error('Failed to load notification history');
      }
    }
  };

  if (loading) return <div className="py-12 text-center text-gray-500">Loading...</div>;

  if (counts.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>No active notifications (all appointment dates have passed or no reminders sent yet).</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 mb-2">
        Showing notifications for upcoming appointments only. Count resets automatically after the appointment date passes.
      </p>
      {counts.map(c => (
        <div key={c.patientId} className="border border-gray-200 rounded-xl overflow-hidden">
          {/* Row */}
          <div className="flex items-center gap-4 p-4 bg-white hover:bg-gray-50 cursor-pointer"
            onClick={() => toggleExpand(c.patientId!)}>
            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-pink-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-gray-900">{c.patientName}</p>
                <span className="px-2 py-0.5 bg-pink-600 text-white rounded-full text-xs font-bold">
                  {c.count} notification{c.count !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                {c.patientEmail && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Mail className="w-3 h-3" />{c.patientEmail}
                  </p>
                )}
                {c.patientPhone && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Phone className="w-3 h-3" />{c.patientPhone}
                  </p>
                )}
              </div>
              {c.appointmentDate && (
                <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Appointment: {c.appointmentDate}
                  {c.appointmentTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{c.appointmentTime}</span>}
                </p>
              )}
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="text-xs text-gray-500">Last sent by</p>
              <p className="text-sm font-medium text-gray-700">{c.lastSentBy ?? '—'}</p>
              <p className="text-xs text-gray-400">{c.lastSentAt ? formatDateTime(c.lastSentAt) : '—'}</p>
            </div>
            {expanded === c.patientId ? (
              <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
            )}
          </div>

          {/* Last Message */}
          {c.lastMessage && (
            <div className="px-4 pb-2 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-500 mt-2 mb-1 font-medium">Last message sent:</p>
              <p className="text-xs text-gray-700 whitespace-pre-wrap bg-white border border-gray-200 rounded p-2 max-h-24 overflow-y-auto">
                {c.lastMessage}
              </p>
            </div>
          )}

          {/* Expanded history */}
          {expanded === c.patientId && (
            <div className="border-t border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold text-gray-700 mb-3">Notification History (active appointments)</p>
              {(history[c.patientId!] ?? []).length === 0 ? (
                <p className="text-xs text-gray-500">No history records loaded yet.</p>
              ) : (
                <div className="space-y-2">
                  {(history[c.patientId!] ?? []).map(n => (
                    <div key={n.id} className="flex items-start gap-3 bg-white border border-gray-200 rounded-lg p-3">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${METHOD_COLOR[n.method] ?? 'bg-gray-100 text-gray-700'}`}>
                        {METHOD_ICON[n.method]}
                        {n.method.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium text-gray-700">{n.type}</span>
                          {n.status === 'sent' ? (
                            <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-red-500" />
                          )}
                          <span className={`text-xs ${n.status === 'sent' ? 'text-green-700' : 'text-red-700'}`}>{n.status}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDateTime(n.sentAt)} · Sent by {n.sentBy}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function LogTab() {
  const [records, setRecords] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    notificationService.getAll()
      .then(setRecords)
      .catch(() => toast.error('Failed to load notification log'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="py-12 text-center text-gray-500">Loading...</div>;

  if (records.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        <Send className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>No notification records found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left py-3 px-4 font-medium text-gray-700">Patient</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">Appointment</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">Method</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">Sent At</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">Sent By</th>
            <th className="text-left py-3 px-4 font-medium text-gray-700">Message</th>
          </tr>
        </thead>
        <tbody>
          {records.map(n => (
            <tr key={n.id} className="border-b border-gray-100 hover:bg-gray-50 align-top">
              <td className="py-3 px-4">
                <p className="font-medium text-gray-900">{n.patientName}</p>
                {n.patientEmail && <p className="text-xs text-gray-500">{n.patientEmail}</p>}
              </td>
              <td className="py-3 px-4">
                {n.appointmentDate && (
                  <p className="text-xs text-blue-600">
                    {n.appointmentDate}
                    {n.appointmentTime && ` at ${n.appointmentTime}`}
                  </p>
                )}
              </td>
              <td className="py-3 px-4">
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">{n.type}</span>
              </td>
              <td className="py-3 px-4">
                <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs w-fit ${METHOD_COLOR[n.method] ?? 'bg-gray-100 text-gray-700'}`}>
                  {METHOD_ICON[n.method]}{n.method}
                </span>
              </td>
              <td className="py-3 px-4">
                {n.status === 'sent' ? (
                  <span className="flex items-center gap-1 text-green-700 text-xs">
                    <CheckCircle className="w-3.5 h-3.5" /> Sent
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-700 text-xs">
                    <XCircle className="w-3.5 h-3.5" /> Failed
                  </span>
                )}
              </td>
              <td className="py-3 px-4 text-xs text-gray-600 whitespace-nowrap">
                {formatDateTime(n.sentAt)}
              </td>
              <td className="py-3 px-4 text-xs text-gray-700">{n.sentBy}</td>
              <td className="py-3 px-4 max-w-xs">
                {n.message ? (
                  <p className="text-xs text-gray-600 line-clamp-2" title={n.message}>{n.message}</p>
                ) : <span className="text-gray-400 text-xs">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminNotificationsView() {
  const [tab, setTab] = useState<TabType>('counts');
  const [sending, setSending] = useState(false);
  const [alsoSms, setAlsoSms] = useState(false);

  const handleSendReminders = async () => {
    setSending(true);
    try {
      const result = await notificationService.sendReminders({ alsoSms });
      toast.success(`Reminders sent: ${result.sent} succeeded, ${result.failed} failed (${result.total} appointments)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send reminders');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setTab('counts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
              tab === 'counts' ? 'bg-pink-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-pink-400'
            }`}
          >
            <Bell className="w-4 h-4" /> Patient Counts
          </button>
          <button
            onClick={() => setTab('log')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
              tab === 'log' ? 'bg-pink-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-pink-400'
            }`}
          >
            <Send className="w-4 h-4" /> Full Log
          </button>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={alsoSms} onChange={e => setAlsoSms(e.target.checked)}
              className="rounded border-gray-300" />
            Also SMS
          </label>
          <button
            onClick={handleSendReminders}
            disabled={sending}
            className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 text-sm"
          >
            {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
            Send Reminders
          </button>
        </div>
      </div>

      {tab === 'counts' ? <CountsTab /> : <LogTab />}
    </div>
  );
}
