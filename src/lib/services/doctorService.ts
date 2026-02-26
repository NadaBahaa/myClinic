import { apiFetch } from '../api';

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
  userId?: string;
  totalPatients?: number;
  qualifications?: string;
  licenseNumber?: string;
}

export const doctorService = {
  async getAll(): Promise<Doctor[]> {
    return apiFetch<Doctor[]>('/doctors');
  },

  async get(uuid: string): Promise<Doctor> {
    return apiFetch<Doctor>(`/doctors/${uuid}`);
  },

  async create(data: Partial<Doctor>): Promise<Doctor> {
    return apiFetch<Doctor>('/doctors', { method: 'POST', body: data });
  },

  async update(uuid: string, data: Partial<Doctor>): Promise<Doctor> {
    return apiFetch<Doctor>(`/doctors/${uuid}`, { method: 'PUT', body: data });
  },

  async remove(uuid: string): Promise<void> {
    await apiFetch(`/doctors/${uuid}`, { method: 'DELETE' });
  },
};
