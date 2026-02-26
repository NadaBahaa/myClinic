import { apiFetch } from '../api';

export interface AppSettings {
  reminderDaysBefore: number;
}

export const settingsService = {
  async get(): Promise<AppSettings> {
    return apiFetch<AppSettings>('/settings');
  },
  async update(data: Partial<AppSettings>): Promise<void> {
    await apiFetch('/settings', { method: 'PUT', body: data });
  },
};
