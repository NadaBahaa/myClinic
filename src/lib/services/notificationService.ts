import { apiFetch } from '../api';
import type { NotificationRecord } from '../../app/types/index';

export const notificationService = {
  async getAll(): Promise<NotificationRecord[]> {
    return apiFetch<NotificationRecord[]>('/notifications');
  },

  async getPending(): Promise<NotificationRecord[]> {
    return apiFetch<NotificationRecord[]>('/notifications/pending');
  },

  async create(data: Partial<NotificationRecord>): Promise<NotificationRecord> {
    return apiFetch<NotificationRecord>('/notifications', { method: 'POST', body: data });
  },
};
