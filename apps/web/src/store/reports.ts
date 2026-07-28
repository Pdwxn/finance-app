import { create } from 'zustand';
import { apiGet, apiPost, apiDelete } from '../lib/api';
import type { FinancialReport, ReportType } from '@finance-app/types';

interface ReportsState {
  reports: FinancialReport[];
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  fetchReports: (type?: ReportType) => Promise<void>;
  generateReport: (type: ReportType) => Promise<void>;
  deleteReport: (id: string) => Promise<void>;
}

export const useReportsStore = create<ReportsState>((set) => ({
  reports: [],
  isLoading: false,
  isGenerating: false,
  error: null,

  fetchReports: async (type?: ReportType) => {
    set({ isLoading: true, error: null });
    try {
      const params = type ? `?type=${type}` : '';
      const res = await apiGet<FinancialReport[]>(`/api/reports${params}`);
      if (res.success && res.data) {
        set({ reports: res.data, isLoading: false });
      } else {
        set({ error: res.message ?? 'Error al cargar reportes', isLoading: false });
      }
    } catch {
      set({ error: 'Error de conexión', isLoading: false });
    }
  },

  generateReport: async (type: ReportType) => {
    set({ isGenerating: true, error: null });
    try {
      const res = await apiPost<unknown>('/api/reports/generate', { type });
      if (!res.success) {
        set({ error: res.message ?? 'Error al generar reporte', isGenerating: false });
        return;
      }
      set({ isGenerating: false });
    } catch {
      set({ error: 'Error de conexión', isGenerating: false });
    }
  },

  deleteReport: async (id: string) => {
    try {
      await apiDelete(`/api/reports/${id}`);
      set(state => ({ reports: state.reports.filter(r => r.id !== id) }));
    } catch {
      set({ error: 'Error al eliminar reporte' });
    }
  },
}));
