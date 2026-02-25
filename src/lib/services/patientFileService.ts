import { apiFetch, apiUpload } from '../api';
import type { PatientFile, SessionRecord, PatientPhoto, Prescription } from '../../app/types/index';

export const patientFileService = {
  // Patient Files
  async getFiles(patientUuid: string): Promise<PatientFile[]> {
    return apiFetch<PatientFile[]>(`/patients/${patientUuid}/files`);
  },

  async getFile(patientUuid: string, doctorUuid: string): Promise<PatientFile> {
    return apiFetch<PatientFile>(`/patients/${patientUuid}/files/${doctorUuid}`);
  },

  // Sessions
  async getSessions(fileUuid: string): Promise<SessionRecord[]> {
    return apiFetch<SessionRecord[]>(`/patient-files/${fileUuid}/sessions`);
  },

  async createSession(fileUuid: string, data: Partial<SessionRecord>): Promise<SessionRecord> {
    return apiFetch<SessionRecord>(`/patient-files/${fileUuid}/sessions`, {
      method: 'POST',
      body: data,
    });
  },

  async updateSession(fileUuid: string, sessionUuid: string, data: Partial<SessionRecord>): Promise<SessionRecord> {
    return apiFetch<SessionRecord>(`/patient-files/${fileUuid}/sessions/${sessionUuid}`, {
      method: 'PUT',
      body: data,
    });
  },

  async deleteSession(fileUuid: string, sessionUuid: string): Promise<void> {
    await apiFetch(`/patient-files/${fileUuid}/sessions/${sessionUuid}`, { method: 'DELETE' });
  },

  // Photos
  async getPhotos(fileUuid: string): Promise<PatientPhoto[]> {
    return apiFetch<PatientPhoto[]>(`/patient-files/${fileUuid}/photos`);
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
    return apiFetch<Prescription[]>(`/patient-files/${fileUuid}/prescriptions`);
  },

  async createPrescription(fileUuid: string, data: Partial<Prescription>): Promise<Prescription> {
    return apiFetch<Prescription>(`/patient-files/${fileUuid}/prescriptions`, {
      method: 'POST',
      body: data,
    });
  },

  async updatePrescription(fileUuid: string, rxUuid: string, data: Partial<Prescription>): Promise<Prescription> {
    return apiFetch<Prescription>(`/patient-files/${fileUuid}/prescriptions/${rxUuid}`, {
      method: 'PUT',
      body: data,
    });
  },

  async deletePrescription(fileUuid: string, rxUuid: string): Promise<void> {
    await apiFetch(`/patient-files/${fileUuid}/prescriptions/${rxUuid}`, { method: 'DELETE' });
  },
};
