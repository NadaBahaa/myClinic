import { apiFetch, unwrapLaravelData } from '../api';

export interface ServiceDefaultMaterial {
  materialId: string;
  defaultQuantity: number;
  name?: string;
  unitPrice?: number;
  unit?: string;
}

export interface ClinicService {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
  description?: string;
  popular?: boolean;
  allowedPractitionerTypeIds?: string[];
  defaultMaterials?: ServiceDefaultMaterial[];
}

export const serviceService = {
  async getAll(): Promise<ClinicService[]> {
    const raw = await apiFetch<unknown>('/services');
    const list = unwrapLaravelData<ClinicService[]>(raw);
    return Array.isArray(list) ? list : [];
  },

  async get(uuid: string): Promise<ClinicService> {
    const raw = await apiFetch<unknown>(`/services/${uuid}`);
    return unwrapLaravelData<ClinicService>(raw);
  },

  async create(data: Partial<ClinicService>): Promise<ClinicService> {
    const raw = await apiFetch<unknown>('/services', { method: 'POST', body: data });
    return unwrapLaravelData<ClinicService>(raw);
  },

  async update(uuid: string, data: Partial<ClinicService>): Promise<ClinicService> {
    const raw = await apiFetch<unknown>(`/services/${uuid}`, { method: 'PUT', body: data });
    return unwrapLaravelData<ClinicService>(raw);
  },

  async remove(uuid: string): Promise<void> {
    await apiFetch(`/services/${uuid}`, { method: 'DELETE' });
  },
};
