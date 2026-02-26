import { apiFetch } from '../api';
import type { NotificationRecord } from '../../app/types/index';

export interface PendingReminder {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone?: string;
  doctorName: string;
  date: string;
  startTime: string;
  services: string;
  notes?: string;
}

export const notificationService = {
  async getAll(): Promise<NotificationRecord[]> {
    return apiFetch<NotificationRecord[]>('/notifications');
  },

  async getPending(): Promise<PendingReminder[]> {
    return apiFetch<PendingReminder[]>('/notifications/pending');
  },

  async sendReminders(options?: { appointmentIds?: string[]; alsoSms?: boolean; alsoWhatsApp?: boolean }): Promise<{ sent: number; failed: number; total: number }> {
    return apiFetch<{ sent: number; failed: number; total: number }>('/notifications/send-reminders', {
      method: 'POST',
      body: options || {},
    });
  },

  async create(data: Partial<NotificationRecord>): Promise<NotificationRecord> {
    return apiFetch<NotificationRecord>('/notifications', { method: 'POST', body: data });
  },
};
