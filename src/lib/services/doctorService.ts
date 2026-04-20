import { apiFetch, unwrapLaravelData } from '../api';

export interface Doctor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  specialty?: string;
  experience?: number;
  bio?: string;
  availability?: Record<string, string[]> | string[];
  practitionerTypeId?: string;
  practitionerTypeName?: string;
  userId?: string;
  totalPatients?: number;
  qualifications?: string;
  licenseNumber?: string;
  services?: { id: string; name: string; duration: number; price?: number; category?: string }[];
  serviceIds?: string[];
}

export const doctorService = {
  async getAll(): Promise<Doctor[]> {
    const raw = await apiFetch<unknown>('/doctors');
    const list = unwrapLaravelData<Doctor[]>(raw);
    return Array.isArray(list) ? list : [];
  },

  async get(uuid: string): Promise<Doctor> {
    const raw = await apiFetch<unknown>(`/doctors/${uuid}`);
    return unwrapLaravelData<Doctor>(raw);
  },

  async create(data: Partial<Doctor>): Promise<Doctor> {
    const raw = await apiFetch<unknown>('/doctors', { method: 'POST', body: data });
    return unwrapLaravelData<Doctor>(raw);
  },

  async update(uuid: string, data: Partial<Doctor>): Promise<Doctor> {
    const raw = await apiFetch<unknown>(`/doctors/${uuid}`, { method: 'PUT', body: data });
    return unwrapLaravelData<Doctor>(raw);
  },

  async remove(uuid: string): Promise<void> {
    await apiFetch(`/doctors/${uuid}`, { method: 'DELETE' });
  },
};
