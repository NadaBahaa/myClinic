import { apiFetch } from '../api';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  doctorId: string;
  doctorName: string;
  services: string[];
  serviceIds?: string[];
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
}

const cache = new Map<string, { data: Appointment[]; ts: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCached(key: string): Appointment[] | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: Appointment[]): void {
  cache.set(key, { data: [...data], ts: Date.now() });
}

function invalidateCache(): void {
  cache.clear();
}

export const appointmentService = {
  _invalidateCache: invalidateCache,

  async getAll(): Promise<Appointment[]> {
    const key = 'all';
    try {
      const data = await apiFetch<Appointment[]>('/appointments');
      setCache(key, data);
      return data;
    } catch {
      const cached = getCached(key);
      if (cached) return cached;
      throw new Error('Failed to load appointments');
    }
  },

  async get(uuid: string): Promise<Appointment> {
    return apiFetch<Appointment>(`/appointments/${uuid}`);
  },

  async byDate(date: string): Promise<Appointment[]> {
    const key = `date:${date}`;
    try {
      const data = await apiFetch<Appointment[]>(`/appointments/date/${date}`);
      setCache(key, data);
      return data;
    } catch {
      const cached = getCached(key);
      if (cached) return cached;
      throw new Error('Failed to load appointments');
    }
  },

  async byDoctor(doctorUuid: string): Promise<Appointment[]> {
    const key = `doctor:${doctorUuid}`;
    try {
      const data = await apiFetch<Appointment[]>(`/appointments/doctor/${doctorUuid}`);
      setCache(key, data);
      return data;
    } catch {
      const cached = getCached(key);
      if (cached) return cached;
      throw new Error('Failed to load appointments');
    }
  },

  async byDateRange(dateFrom: string, dateTo: string): Promise<Appointment[]> {
    const key = `range:${dateFrom}:${dateTo}`;
    try {
      const data = await apiFetch<Appointment[]>(
        `/appointments?date_from=${encodeURIComponent(dateFrom)}&date_to=${encodeURIComponent(dateTo)}`
      );
      setCache(key, data);
      return data;
    } catch {
      const cached = getCached(key);
      if (cached) return cached;
      throw new Error('Failed to load appointments');
    }
  },

  async create(data: Partial<Appointment> & { serviceIds?: string[]; services?: string[] }): Promise<Appointment> {
    const body = { ...data, services: data.services ?? data.serviceIds } as Record<string, unknown>;
    if ('serviceIds' in body) delete body.serviceIds;
    const created = await apiFetch<Appointment>('/appointments', { method: 'POST', body });
    invalidateCache();
    return created;
  },

  async update(uuid: string, data: Partial<Appointment>): Promise<Appointment> {
    const updated = await apiFetch<Appointment>(`/appointments/${uuid}`, { method: 'PUT', body: data });
    invalidateCache();
    return updated;
  },

  async remove(uuid: string): Promise<void> {
    await apiFetch(`/appointments/${uuid}`, { method: 'DELETE' });
    invalidateCache();
  },
};
