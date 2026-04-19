import { apiFetch, apiUpload, unwrapLaravelData } from '../api';
import type { PatientFile, SessionRecord, PatientPhoto, Prescription } from '../../app/types/index';

export const patientFileService = {
  // Patient Files
  async getFiles(patientUuid: string): Promise<PatientFile[]> {
    const raw = await apiFetch<unknown>(`/patients/${patientUuid}/files`);
    const list = unwrapLaravelData<PatientFile[]>(raw);
    return Array.isArray(list) ? list : [];
  },

  async getFile(patientUuid: string, doctorUuid: string): Promise<PatientFile> {
    const raw = await apiFetch<unknown>(`/patients/${patientUuid}/files/${doctorUuid}`);
    return unwrapLaravelData<PatientFile>(raw);
  },

  // Sessions
  async getSessions(fileUuid: string): Promise<SessionRecord[]> {
    const raw = await apiFetch<unknown>(`/patient-files/${fileUuid}/sessions`);
    const list = unwrapLaravelData<SessionRecord[]>(raw);
    return Array.isArray(list) ? list : [];
  },

  async createSession(fileUuid: string, data: Partial<SessionRecord>): Promise<SessionRecord> {
    const raw = await apiFetch<unknown>(`/patient-files/${fileUuid}/sessions`, {
      method: 'POST',
      body: data,
    });
    return unwrapLaravelData<SessionRecord>(raw);
  },

  async updateSession(fileUuid: string, sessionUuid: string, data: Partial<SessionRecord>): Promise<SessionRecord> {
    const raw = await apiFetch<unknown>(`/patient-files/${fileUuid}/sessions/${sessionUuid}`, {
      method: 'PUT',
      body: data,
    });
    return unwrapLaravelData<SessionRecord>(raw);
  },

  async deleteSession(fileUuid: string, sessionUuid: string): Promise<void> {
    await apiFetch(`/patient-files/${fileUuid}/sessions/${sessionUuid}`, { method: 'DELETE' });
  },

  // Photos
  async getPhotos(fileUuid: string): Promise<PatientPhoto[]> {
    const raw = await apiFetch<unknown>(`/patient-files/${fileUuid}/photos`);
    const list = unwrapLaravelData<PatientPhoto[]>(raw);
    return Array.isArray(list) ? list : [];
  },

  async uploadPhoto(fileUuid: string, photo: File, type: string, notes?: string, sessionId?: string): Promise<PatientPhoto> {
    const form = new FormData();
    form.append('photo', photo);
    form.append('type', type);
    if (notes) form.append('notes', notes);
    if (sessionId) form.append('session_id', sessionId);
    return apiUpload<PatientPhoto>(`/patient-files/${fileUuid}/photos`, form);
  },

  async deletePhoto(fileUuid: string, photoUuid: string): Promise<void> {
    await apiFetch(`/patient-files/${fileUuid}/photos/${photoUuid}`, { method: 'DELETE' });
  },

  // Prescriptions
  async getPrescriptions(fileUuid: string): Promise<Prescription[]> {
    const raw = await apiFetch<unknown>(`/patient-files/${fileUuid}/prescriptions`);
    const list = unwrapLaravelData<Prescription[]>(raw);
    return Array.isArray(list) ? list : [];
  },

  async createPrescription(fileUuid: string, data: Partial<Prescription>): Promise<Prescription> {
    const raw = await apiFetch<unknown>(`/patient-files/${fileUuid}/prescriptions`, {
      method: 'POST',
      body: data,
    });
    return unwrapLaravelData<Prescription>(raw);
  },

  async updatePrescription(fileUuid: string, rxUuid: string, data: Partial<Prescription>): Promise<Prescription> {
    const raw = await apiFetch<unknown>(`/patient-files/${fileUuid}/prescriptions/${rxUuid}`, {
      method: 'PUT',
      body: data,
    });
    return unwrapLaravelData<Prescription>(raw);
  },

  async deletePrescription(fileUuid: string, rxUuid: string): Promise<void> {
    await apiFetch(`/patient-files/${fileUuid}/prescriptions/${rxUuid}`, { method: 'DELETE' });
  },

  // Attachments (any file type; stored in patient file and DB)
  async getAttachments(fileUuid: string): Promise<{ id: string; name: string; path: string; mimeType?: string; sessionId?: string; createdAt: string }[]> {
    const raw = await apiFetch<unknown>(`/patient-files/${fileUuid}/attachments`);
    const list = unwrapLaravelData<{ id: string; name: string; path: string; mimeType?: string; sessionId?: string; createdAt: string }[]>(raw);
    return Array.isArray(list) ? list : [];
  },
  async uploadAttachment(fileUuid: string, file: File, name?: string, sessionId?: string): Promise<{ id: string; name: string; path: string; createdAt: string }> {
    const form = new FormData();
    form.append('file', file);
    if (name) form.append('name', name);
    if (sessionId) form.append('session_id', sessionId);
    return apiUpload<{ id: string; name: string; path: string; createdAt: string }>(`/patient-files/${fileUuid}/attachments`, form);
  },
  async deleteAttachment(fileUuid: string, attachmentUuid: string): Promise<void> {
    await apiFetch(`/patient-files/${fileUuid}/attachments/${attachmentUuid}`, { method: 'DELETE' });
  },
};
