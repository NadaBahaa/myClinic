// Central type definitions for the clinic management system

export interface MaterialOrTool {
  id: string;
  name: string;
  type: 'material' | 'tool';
  unitPrice: number;
  unit: string;
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
  /** Date of the appointment that this session is linked to */
  appointmentDate?: string;
  /** Start time of the linked appointment */
  appointmentTime?: string;
  date: Date;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  discountAmount?: number;
  originalServicePrice?: number | null;
  couponCode?: string | null;
  materialsUsed: SessionMaterialUsage[];
  totalMaterialsCost: number;
  netProfit: number;
  notes?: string;
  performedBy: string;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string | null;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  maxDiscountAmount?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  maxUses?: number | null;
  usesCount: number;
  isActive: boolean;
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
  url?: string;
  prescribedAt: Date;
  prescribedBy: string;
  notes?: string;
}

export interface NotificationRecord {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  appointmentId: string;
  appointmentDate?: string;
  appointmentTime?: string;
  type: 'reminder' | 'confirmation';
  sentAt: Date;
  sentBy: string;
  method: 'email' | 'sms' | 'whatsapp';
  status: 'sent' | 'failed';
  message?: string;
}

export interface PatientNotificationCount {
  patientId: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  count: number;
  lastSentAt: string;
  lastMessage?: string;
  lastSentBy?: string;
  lastMethod?: string;
  appointmentDate?: string;
  appointmentTime?: string;
}

export interface FinancialSummary {
  total_revenue: number;
  total_discounts: number;
  net_revenue: number;
  total_materials_cost: number;
  net_profit: number;
  session_count: number;
  avg_session_value: number;
}

export interface FinancialByDoctor {
  doctor: string;
  sessions: number;
  revenue: number;
  discounts: number;
  materials: number;
  net_profit: number;
}

export interface FinancialByService {
  service: string;
  sessions: number;
  revenue: number;
  discounts: number;
  materials: number;
  net_profit: number;
}

export interface FinancialMonthlyTrend {
  month: string;
  sessions: number;
  revenue: number;
  discounts: number;
  materials: number;
  net_profit: number;
}
