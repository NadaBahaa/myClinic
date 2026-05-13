import { apiFetch, unwrapLaravelData } from '../api';
import type { MaterialOrTool } from '../../app/types/index';

export const materialService = {
  async getAll(): Promise<MaterialOrTool[]> {
    const raw = await apiFetch<unknown>('/materials-tools');
    const list = unwrapLaravelData<MaterialOrTool[]>(raw);
    return Array.isArray(list) ? list : [];
  },

  async get(uuid: string): Promise<MaterialOrTool> {
    const raw = await apiFetch<unknown>(`/materials-tools/${uuid}`);
    return unwrapLaravelData<MaterialOrTool>(raw);
  },

  async create(data: Partial<MaterialOrTool>): Promise<MaterialOrTool> {
    const raw = await apiFetch<unknown>('/materials-tools', { method: 'POST', body: data });
    return unwrapLaravelData<MaterialOrTool>(raw);
  },

  async update(uuid: string, data: Partial<MaterialOrTool>): Promise<MaterialOrTool> {
    const raw = await apiFetch<unknown>(`/materials-tools/${uuid}`, { method: 'PUT', body: data });
    return unwrapLaravelData<MaterialOrTool>(raw);
  },

  async remove(uuid: string): Promise<void> {
    await apiFetch(`/materials-tools/${uuid}`, { method: 'DELETE' });
  },
};
