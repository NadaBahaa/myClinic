import { apiFetch, setToken, removeToken, unwrapLaravelData, clearApiResponseCaches } from '../api';
import type { User } from '../../app/App';

interface LoginResponse {
  token: string;
  user: unknown;
}

const VALID_ROLES = ['superadmin', 'admin', 'doctor', 'assistant', 'accountant'] as const;

function emptyPermissions(): User['permissions'] {
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

/** Validate `/auth/login` and `/auth/me` payloads before trusting the session. */
export function parseSessionUser(raw: unknown): User | null {
  const data = unwrapLaravelData(raw);
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  const id = o.id;
  const name = o.name;
  const email = o.email;
  const role = o.role;
  if (typeof id !== 'string' || id.trim() === '') return null;
  if (typeof name !== 'string' || name.trim() === '') return null;
  if (typeof email !== 'string' || email.trim() === '') return null;
  if (typeof role !== 'string' || !VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    return null;
  }

  const perms = o.permissions;
  const permissions: User['permissions'] =
    typeof perms === 'object' && perms !== null && !Array.isArray(perms)
      ? { ...emptyPermissions(), ...(perms as User['permissions']) }
      : emptyPermissions();

  let moduleVisibility: User['moduleVisibility'];
  const mv = o.moduleVisibility;
  if (typeof mv === 'object' && mv !== null && !Array.isArray(mv)) {
    moduleVisibility = mv as User['moduleVisibility'];
  }

  return {
    id,
    name,
    email,
    role,
    isActive: typeof o.isActive === 'boolean' ? o.isActive : undefined,
    practitionerTypeId:
      typeof o.practitionerTypeId === 'string'
        ? o.practitionerTypeId
        : o.practitionerTypeId === null
          ? null
          : undefined,
    doctorId:
      typeof o.doctorId === 'string' ? o.doctorId : o.doctorId === null ? null : undefined,
    permissions,
    moduleVisibility,
  };
}

export const authService = {
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const data = await apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    const user = parseSessionUser(data.user);
    const token = typeof data.token === 'string' ? data.token.trim() : '';
    if (!user || !token) {
      removeToken();
      throw new Error('Invalid session data from server');
    }
    clearApiResponseCaches();
    setToken(token);
    return { token, user };
  },

  async logout(): Promise<void> {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // Network or 401: still clear local session
    } finally {
      removeToken();
    }
  },

  async me(): Promise<User> {
    const raw = await apiFetch<unknown>('/auth/me');
    const user = parseSessionUser(raw);
    if (!user) {
      removeToken();
      throw new Error('Invalid session');
    }
    return user;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiFetch('/auth/password', {
      method: 'PUT',
      body: { current_password: currentPassword, password: newPassword, password_confirmation: newPassword },
    });
  },

  async forgotPassword(email: string): Promise<void> {
    await apiFetch('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    });
  },

  async resetPassword(email: string, token: string, password: string, passwordConfirmation: string): Promise<void> {
    await apiFetch('/auth/reset-password', {
      method: 'POST',
      body: { email, token, password, password_confirmation: passwordConfirmation },
    });
  },
};
