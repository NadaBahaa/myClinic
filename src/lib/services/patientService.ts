import { apiFetch } from '../api';

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
    return apiFetch<Patient[]>(`/patients${qs}`);
  },

  async get(uuid: string): Promise<Patient> {
    return apiFetch<Patient>(`/patients/${uuid}`);
  },

  async create(data: Partial<Patient>): Promise<Patient> {
    return apiFetch<Patient>('/patients', { method: 'POST', body: data });
  },

  async update(uuid: string, data: Partial<Patient>): Promise<Patient> {
    return apiFetch<Patient>(`/patients/${uuid}`, { method: 'PUT', body: data });
  },

  async remove(uuid: string): Promise<void> {
    await apiFetch(`/patients/${uuid}`, { method: 'DELETE' });
  },
};
