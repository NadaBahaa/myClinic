import { apiFetch } from '../api';
import type { PractitionerType } from '../../app/contexts/PractitionerTypeContext';

export const practitionerTypeService = {
  async getAll(): Promise<PractitionerType[]> {
    return apiFetch<PractitionerType[]>('/practitioner-types');
  },

  async get(uuid: string): Promise<PractitionerType> {
    return apiFetch<PractitionerType>(`/practitioner-types/${uuid}`);
  },

  async create(data: Partial<PractitionerType>): Promise<PractitionerType> {
    return apiFetch<PractitionerType>('/practitioner-types', { method: 'POST', body: data });
  },

  async update(uuid: string, data: Partial<PractitionerType>): Promise<PractitionerType> {
    return apiFetch<PractitionerType>(`/practitioner-types/${uuid}`, { method: 'PUT', body: data });
  },

  async remove(uuid: string): Promise<void> {
    await apiFetch(`/practitioner-types/${uuid}`, { method: 'DELETE' });
  },
};
