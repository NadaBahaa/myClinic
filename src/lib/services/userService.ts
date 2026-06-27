import { apiFetch, unwrapLaravelData } from '../api';
import type { SystemUser, UserPermissions } from '../../app/components/UserDetailModal';

function emptyPermissions(): UserPermissions {
  return {
    showCalendar: false,
    showPatients: false,
    showDoctors: false,
    showServices: false,
    showUsers: false,
    showSettings: false,
    showActivityLog: false,
    showReports: false,
    showMaterialsTools: false,
    showPractitionerTypes: false,
  };
}

function mapApiUser(raw: unknown): SystemUser {
  const u = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const perms =
    typeof u.permissions === 'object' && u.permissions !== null && !Array.isArray(u.permissions)
      ? (u.permissions as UserPermissions)
      : emptyPermissions();

  return {
    id: String(u.id ?? ''),
    name: String(u.name ?? ''),
    email: String(u.email ?? ''),
    password: '',
    role: (u.role as SystemUser['role']) ?? 'assistant',
    practitionerTypeId:
      typeof u.practitionerTypeId === 'string'
        ? u.practitionerTypeId
        : u.practitionerTypeId === null
          ? undefined
          : undefined,
    permissions: { ...emptyPermissions(), ...perms },
  };
}

export const userService = {
  async getAll(): Promise<SystemUser[]> {
    const raw = await apiFetch<unknown>('/users');
    const list = unwrapLaravelData<unknown[]>(raw);
    return Array.isArray(list) ? list.map(mapApiUser) : [];
  },

  async create(data: Partial<SystemUser> & { password: string }): Promise<SystemUser> {
    const raw = await apiFetch<unknown>('/users', { method: 'POST', body: data });
    return mapApiUser(unwrapLaravelData(raw));
  },

  async update(uuid: string, data: Partial<SystemUser>): Promise<SystemUser> {
    const payload: Record<string, unknown> = { ...data };
    delete payload.id;
    delete payload.password;
    if (data.password && data.password.trim() !== '') {
      payload.password = data.password;
    }
    const raw = await apiFetch<unknown>(`/users/${uuid}`, { method: 'PUT', body: payload });
    return mapApiUser(unwrapLaravelData(raw));
  },

  async remove(uuid: string): Promise<void> {
    await apiFetch(`/users/${uuid}`, { method: 'DELETE' });
  },
};
