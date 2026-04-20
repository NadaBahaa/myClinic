import { apiFetch, apiDownload } from '../api';
import type {
  FinancialSummary,
  FinancialByDoctor,
  FinancialByService,
  FinancialMonthlyTrend,
} from '../../app/types';

export interface ReportSession {
  id: string;
  patientFileId?: string;
  patientId?: string;
  patientName?: string;
  doctorId?: string;
  doctorName?: string;
  appointmentId?: string;
  date: string;
  serviceId?: string;
  serviceName: string;
  servicePrice: number;
  discountAmount?: number;
  originalServicePrice?: number;
  materialsUsed?: { materialId: string; materialName: string; quantity: number; unitPrice: number; totalPrice: number }[];
  totalMaterialsCost: number;
  netProfit: number;
  performedBy: string;
  notes?: string;
}

export interface ReportsSessionsResponse {
  data: ReportSession[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
  totals: {
    total_sales: number;
    total_discounts: number;
    total_materials_cost: number;
    net_profit: number;
    session_count: number;
  };
}

export interface FinancialReportResponse {
  summary: FinancialSummary;
  by_doctor: FinancialByDoctor[];
  by_service: FinancialByService[];
  monthly_trend: FinancialMonthlyTrend[];
  top_services: FinancialByService[];
  top_doctors: FinancialByDoctor[];
}

export const reportsService = {
  async getSessions(params?: {
    date_from?: string;
    date_to?: string;
    search?: string;
    page?: number;
    per_page?: number;
  }): Promise<ReportsSessionsResponse> {
    const search = new URLSearchParams();
    if (params?.date_from) search.set('date_from', params.date_from);
    if (params?.date_to) search.set('date_to', params.date_to);
    if (params?.search) search.set('search', params.search);
    if (params?.page) search.set('page', String(params.page));
    if (params?.per_page) search.set('per_page', String(params.per_page ?? 50));
    const qs = search.toString();
    return apiFetch<ReportsSessionsResponse>(`/reports/sessions${qs ? `?${qs}` : ''}`);
  },

  async getFinancial(params?: { date_from?: string; date_to?: string }): Promise<FinancialReportResponse> {
    const search = new URLSearchParams();
    if (params?.date_from) search.set('date_from', params.date_from);
    if (params?.date_to) search.set('date_to', params.date_to);
    const qs = search.toString();
    return apiFetch<FinancialReportResponse>(`/reports/financial${qs ? `?${qs}` : ''}`);
  },

  async exportSessionsCsv(params?: { date_from?: string; date_to?: string }): Promise<void> {
    const search = new URLSearchParams();
    if (params?.date_from) search.set('date_from', params.date_from);
    if (params?.date_to) search.set('date_to', params.date_to);
    const qs = search.toString();
    const { blob, filename } = await apiDownload(`/reports/sessions/export${qs ? `?${qs}` : ''}`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename ?? 'sessions-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  },

  async exportFinancialCsv(params?: { date_from?: string; date_to?: string }): Promise<void> {
    const search = new URLSearchParams();
    if (params?.date_from) search.set('date_from', params.date_from);
    if (params?.date_to) search.set('date_to', params.date_to);
    const qs = search.toString();
    const { blob, filename } = await apiDownload(`/reports/financial/export${qs ? `?${qs}` : ''}`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename ?? 'financial-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  },
};
