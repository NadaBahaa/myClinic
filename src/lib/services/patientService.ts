import { apiFetch, unwrapLaravelData } from '../api';

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  address?: string;
  medicalHistory?: string;
  allergies?: string;
  lastVisit?: string;
  totalVisits: number;
  notes?: string;
}

export const patientService = {
  async getAll(search?: string): Promise<Patient[]> {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    const raw = await apiFetch<unknown>(`/patients${qs}`);
    const list = unwrapLaravelData<Patient[]>(raw);
    return Array.isArray(list) ? list : [];
  },

  async get(uuid: string): Promise<Patient> {
    const raw = await apiFetch<unknown>(`/patients/${uuid}`);
    return unwrapLaravelData<Patient>(raw);
  },

  async create(data: Partial<Patient>): Promise<Patient> {
    const raw = await apiFetch<unknown>('/patients', { method: 'POST', body: data });
    return unwrapLaravelData<Patient>(raw);
  },

  async update(uuid: string, data: Partial<Patient>): Promise<Patient> {
    const raw = await apiFetch<unknown>(`/patients/${uuid}`, { method: 'PUT', body: data });
    return unwrapLaravelData<Patient>(raw);
  },

  async remove(uuid: string): Promise<void> {
    await apiFetch(`/patients/${uuid}`, { method: 'DELETE' });
  },
};
