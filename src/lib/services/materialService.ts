import { apiFetch } from '../api';
import type { MaterialOrTool } from '../../app/types/index';

export const materialService = {
  async getAll(): Promise<MaterialOrTool[]> {
    return apiFetch<MaterialOrTool[]>('/materials-tools');
  },

  async get(uuid: string): Promise<MaterialOrTool> {
    return apiFetch<MaterialOrTool>(`/materials-tools/${uuid}`);
  },

  async create(data: Partial<MaterialOrTool>): Promise<MaterialOrTool> {
    return apiFetch<MaterialOrTool>('/materials-tools', { method: 'POST', body: data });
  },

  async update(uuid: string, data: Partial<MaterialOrTool>): Promise<MaterialOrTool> {
    return apiFetch<MaterialOrTool>(`/materials-tools/${uuid}`, { method: 'PUT', body: data });
  },

  async remove(uuid: string): Promise<void> {
    await apiFetch(`/materials-tools/${uuid}`, { method: 'DELETE' });
  },
};
