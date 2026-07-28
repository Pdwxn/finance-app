import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { exportMonthlyReport, type ReportData } from '@/lib/export-reports';

export function useExportReports() {
  const [isExporting, setIsExporting] = useState(false);

  const exportReport = useCallback(async (data: ReportData) => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await exportMonthlyReport(data);
      toast.success('Reporte exportado correctamente');
    } catch {
      toast.error('Error al exportar el reporte');
    } finally {
      setIsExporting(false);
    }
  }, [isExporting]);

  return { exportReport, isExporting };
}
