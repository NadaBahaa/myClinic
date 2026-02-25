import { apiFetch } from '../api';
import type { SystemUser } from '../../app/components/UserDetailModal';

export const userService = {
  async getAll(): Promise<SystemUser[]> {
    return apiFetch<SystemUser[]>('/users');
  },

  async create(data: Partial<SystemUser> & { password: string }): Promise<SystemUser> {
    return apiFetch<SystemUser>('/users', { method: 'POST', body: data });
  },

  async update(uuid: string, data: Partial<SystemUser>): Promise<SystemUser> {
    return apiFetch<SystemUser>(`/users/${uuid}`, { method: 'PUT', body: data });
  },

  async remove(uuid: string): Promise<void> {
    await apiFetch(`/users/${uuid}`, { method: 'DELETE' });
  },
};
