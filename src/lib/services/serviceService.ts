import { apiFetch } from '../api';

export interface ClinicService {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
  description?: string;
  popular?: boolean;
  practitionerTypeIds?: string[];
}

export const serviceService = {
  async getAll(): Promise<ClinicService[]> {
    return apiFetch<ClinicService[]>('/services');
  },

  async get(uuid: string): Promise<ClinicService> {
    return apiFetch<ClinicService>(`/services/${uuid}`);
  },

  async create(data: Partial<ClinicService>): Promise<ClinicService> {
    return apiFetch<ClinicService>('/services', { method: 'POST', body: data });
  },

  async update(uuid: string, data: Partial<ClinicService>): Promise<ClinicService> {
    return apiFetch<ClinicService>(`/services/${uuid}`, { method: 'PUT', body: data });
  },

  async remove(uuid: string): Promise<void> {
    await apiFetch(`/services/${uuid}`, { method: 'DELETE' });
  },
};
