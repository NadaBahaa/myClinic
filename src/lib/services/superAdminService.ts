import { apiFetch } from '../api';

export type ModuleEnabledForRoles = Record<string, boolean>;

export interface SystemModule {
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  enabledForRoles?: ModuleEnabledForRoles;
  sortOrder: number;
}

export interface SystemFeatureFlag {
  key: string;
  moduleKey: string;
  label: string;
  description: string | null;
  enabled: boolean;
  sortOrder: number;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  doctorId?: string;
}

export type RoleTabPermissions = Record<string, {
  showCalendar: boolean;
  showPatients: boolean;
  showDoctors: boolean;
  showServices: boolean;
  showUsers: boolean;
  showSettings: boolean;
  showActivityLog: boolean;
  showReports: boolean;
  showMaterialsTools: boolean;
  showPractitionerTypes: boolean;
}>;

export const superAdminService = {
  async getModules(): Promise<SystemModule[]> {
    const res = await apiFetch<{ data: SystemModule[] }>('/system/modules');
    return res.data;
  },

  async updateModules(modules: { key: string; enabledForRoles?: ModuleEnabledForRoles }[]): Promise<void> {
    await apiFetch('/system/modules', { method: 'PUT', body: { modules } });
  },

  async getFeatureFlags(): Promise<SystemFeatureFlag[]> {
    const res = await apiFetch<{ data: SystemFeatureFlag[] }>('/system/feature-flags');
    return res.data;
  },

  async updateFeatureFlags(flags: { key: string; enabled: boolean }[]): Promise<void> {
    await apiFetch('/system/feature-flags', { method: 'PUT', body: { flags } });
  },

  async getRoleTabVisibility(): Promise<RoleTabPermissions> {
    const res = await apiFetch<{ data: RoleTabPermissions }>('/system/role-tab-visibility');
    return res.data ?? {};
  },

  async updateRoleTabVisibility(perRole: RoleTabPermissions): Promise<void> {
    await apiFetch('/system/role-tab-visibility', { method: 'PUT', body: { perRole } });
  },

  async getActivityLog(params?: { subject_type?: string; action?: string; user_id?: string; date_from?: string; date_to?: string; page?: number }): Promise<{
    data: Array<{
      id: number;
      userName?: string;
      userEmail?: string;
      action: string;
      subjectType: string;
      subjectId?: string;
      oldValues?: Record<string, unknown>;
      newValues?: Record<string, unknown>;
      createdAt: string;
    }>;
    meta: { current_page: number; last_page: number; per_page: number; total: number };
  }> {
    const qs = new URLSearchParams();
    if (params?.subject_type) qs.set('subject_type', params.subject_type);
    if (params?.action) qs.set('action', params.action);
    if (params?.user_id) qs.set('user_id', params.user_id);
    if (params?.date_from) qs.set('date_from', params.date_from);
    if (params?.date_to) qs.set('date_to', params.date_to);
    if (params?.page) qs.set('page', String(params.page));
    const query = qs.toString();
    const res = await apiFetch<{ data: any[]; meta: any }>(`/system/activity-log${query ? `?${query}` : ''}`);
    return res;
  },

  async getUsers(params?: { role?: string; inactive_only?: boolean; active_only?: boolean }): Promise<SystemUser[]> {
    const qs = new URLSearchParams();
    if (params?.role) qs.set('role', params.role);
    if (params?.inactive_only) qs.set('inactive_only', '1');
    if (params?.active_only) qs.set('active_only', '1');
    const query = qs.toString();
    const res = await apiFetch<{ data?: SystemUser[] } | SystemUser[]>(`/system/users${query ? `?${query}` : ''}`);
    return Array.isArray(res) ? res : (res.data ?? []);
  },

  async setUserActive(userUuid: string, isActive: boolean): Promise<SystemUser> {
    return apiFetch<SystemUser>(`/system/users/${userUuid}/active`, { method: 'PUT', body: { isActive } });
  },

  async getApiLog(params?: { method?: string; path?: string; user_id?: string; status?: number; date_from?: string; date_to?: string; page?: number }): Promise<{
    data: Array<{
      id: number;
      method: string;
      path: string;
      userName?: string;
      ip?: string;
      responseStatus: number;
      requestPayload?: string;
      responseBody?: string;
      responseTimeMs?: number;
      createdAt: string;
    }>;
    meta: { current_page: number; last_page: number; per_page: number; total: number };
  }> {
    const qs = new URLSearchParams();
    if (params?.method) qs.set('method', params.method);
    if (params?.path) qs.set('path', params.path);
    if (params?.user_id) qs.set('user_id', params.user_id);
    if (params?.status) qs.set('status', String(params.status));
    if (params?.date_from) qs.set('date_from', params.date_from);
    if (params?.date_to) qs.set('date_to', params.date_to);
    if (params?.page) qs.set('page', String(params.page));
    const query = qs.toString();
    return apiFetch(`/system/api-log${query ? `?${query}` : ''}`);
  },

  async runArtisan(command: string): Promise<{ message: string; output: string }> {
    return apiFetch('/system/run-artisan', { method: 'POST', body: { command } });
  },
};
