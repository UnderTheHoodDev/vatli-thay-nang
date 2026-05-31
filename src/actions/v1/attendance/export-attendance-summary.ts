'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';

export interface ExportAttendanceSummaryResult {
  blob: Blob | null;
  filename: string;
  errors: string[];
}

export async function exportAttendanceSummaryAction(
  classSessionId: number,
): Promise<ExportAttendanceSummaryResult> {
  try {
    const res = await api.get(
      `/api/v1/class-sessions/${classSessionId}/attendance-summary/export`,
      { responseType: 'arraybuffer' },
    );

    const contentDisposition = (res.headers['content-disposition'] as string) ?? '';
    const match = contentDisposition.match(/filename="([^"]+)"/);
    const filename = match?.[1] ?? `attendance-${classSessionId}.xlsx`;

    const blob = new Blob([res.data as ArrayBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    return { blob, filename, errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      // responseType:'arraybuffer' delivers error bodies as Buffer/ArrayBuffer, not parsed JSON
      let data: unknown = error.response.data;
      if (Buffer.isBuffer(data) || data instanceof ArrayBuffer) {
        try {
          data = JSON.parse(Buffer.from(data as ArrayBuffer).toString('utf8'));
        } catch {
          data = null;
        }
      }
      if (data) return { blob: null, filename: '', errors: extractErrors(data) };
    }
    return { blob: null, filename: '', errors: ['Xuất báo cáo thất bại'] };
  }
}
