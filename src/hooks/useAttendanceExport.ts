'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { handleActionErrors } from '@/lib/actions';
import { firstOfMonthISO, todayISO } from '@/lib/format';
import { exportAttendanceAggregateAction } from '@/actions/v1/attendance/export-attendance-aggregate';

export type AttendanceExportFormat = 'csv' | 'xlsx';

export function useAttendanceExport(classIds: number[]) {
  const [from, setFrom] = useState(firstOfMonthISO());
  const [to, setTo] = useState(todayISO());
  const [format, setFormat] = useState<AttendanceExportFormat>('csv');
  const [loading, setLoading] = useState(false);

  async function handleExport(): Promise<boolean> {
    setLoading(true);
    try {
      const result = await exportAttendanceAggregateAction({ classIds, from, to, format });
      if (result.errors.length > 0) {
        handleActionErrors(result.errors);
        return false;
      }
      if (!result.blob) return false;

      const url = URL.createObjectURL(result.blob);
      try {
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } finally {
        URL.revokeObjectURL(url);
      }
      toast.success('Xuất điểm danh thành công');
      return true;
    } finally {
      setLoading(false);
    }
  }

  return { from, setFrom, to, setTo, format, setFormat, loading, handleExport };
}
