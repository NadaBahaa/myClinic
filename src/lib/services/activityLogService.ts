import { apiFetch } from '../api';

export interface ActivityLogEntry {
  id: number;
  userId?: string;
  userName?: string;
  userEmail?: string;
  action: string;
  subjectType: string;
  subjectId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ip?: string;
  createdAt: string;
}

export interface ActivityLogResponse {
  data: ActivityLogEntry[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export const activityLogService = {
  async getList(params?: {
    subject_type?: string;
    action?: string;
    user_id?: number;
    date_from?: string;
    date_to?: string;
    page?: number;
    per_page?: number;
  }): Promise<ActivityLogResponse> {
    const search = new URLSearchParams();
    if (params?.subject_type) search.set('subject_type', params.subject_type);
    if (params?.action) search.set('action', params.action);
    if (params?.user_id) search.set('user_id', String(params.user_id));
    if (params?.date_from) search.set('date_from', params.date_from);
    if (params?.date_to) search.set('date_to', params.date_to);
    if (params?.page) search.set('page', String(params.page));
    if (params?.per_page) search.set('per_page', String(params.per_page));
    const qs = search.toString();
    return apiFetch<ActivityLogResponse>(`/activity-log${qs ? `?${qs}` : ''}`);
  },
};
