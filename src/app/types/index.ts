// Central type definitions for the clinic management system

export interface MaterialOrTool {
  id: string;
  name: string;
  type: 'material' | 'tool';
  unitPrice: number;
  unit: string; // e.g., 'ml', 'piece', 'gram'
  stockQuantity?: number;
  supplier?: string;
  notes?: string;
}

export interface SessionMaterialUsage {
  materialId: string;
  materialName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PatientFile {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  createdAt: Date;
  sessions: SessionRecord[];
  photos: PatientPhoto[];
  prescriptions: Prescription[];
}

export interface SessionRecord {
  id: string;
  appointmentId: string;
  date: Date;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  materialsUsed: SessionMaterialUsage[];
  totalMaterialsCost: number;
  netProfit: number;
  notes?: string;
  performedBy: string; // doctor/assistant who performed
}

export interface PatientPhoto {
  id: string;
  url: string;
  type: 'before' | 'after' | 'during';
  sessionId?: string;
  uploadedAt: Date;
  uploadedBy: string;
  notes?: string;
}

export interface Prescription {
  id: string;
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  url?: string; // for uploaded prescription files
  prescribedAt: Date;
  prescribedBy: string;
  notes?: string;
}

export interface NotificationRecord {
  id: string;
  patientId: string;
  patientName: string;
  appointmentId: string;
  type: 'reminder' | 'confirmation';
  sentAt: Date;
  sentBy: string;
  method: 'email' | 'sms' | 'whatsapp';
  status: 'sent' | 'failed';
}
