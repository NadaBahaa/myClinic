import { apiFetch } from '../api';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  doctorId: string;
  doctorName: string;
  services: string[];
  serviceIds?: string[];
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
}

export const appointmentService = {
  async getAll(): Promise<Appointment[]> {
    return apiFetch<Appointment[]>('/appointments');
  },

  async get(uuid: string): Promise<Appointment> {
    return apiFetch<Appointment>(`/appointments/${uuid}`);
  },

  async byDate(date: string): Promise<Appointment[]> {
    return apiFetch<Appointment[]>(`/appointments/date/${date}`);
  },

  async byDoctor(doctorUuid: string): Promise<Appointment[]> {
    return apiFetch<Appointment[]>(`/appointments/doctor/${doctorUuid}`);
  },

  async create(data: Partial<Appointment> & { serviceIds: string[] }): Promise<Appointment> {
    return apiFetch<Appointment>('/appointments', { method: 'POST', body: data });
  },

  async update(uuid: string, data: Partial<Appointment>): Promise<Appointment> {
    return apiFetch<Appointment>(`/appointments/${uuid}`, { method: 'PUT', body: data });
  },

  async remove(uuid: string): Promise<void> {
    await apiFetch(`/appointments/${uuid}`, { method: 'DELETE' });
  },
};
