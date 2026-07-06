'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';

export interface ExportAttendanceAggregateParams {
  classIds: number[];
  from?: string;
  to?: string;
  format: 'csv' | 'xlsx';
}

export interface ExportAttendanceAggregateResult {
  blob: Blob | null;
  filename: string;
  errors: string[];
}

export async function exportAttendanceAggregateAction(
  params: ExportAttendanceAggregateParams,
): Promise<ExportAttendanceAggregateResult> {
  try {
    const res = await api.get('/api/v1/attendance/export', {
      params: {
        classIds: params.classIds.join(','),
        from: params.from,
        to: params.to,
        format: params.format,
      },
      responseType: 'arraybuffer',
    });

    const contentDisposition = (res.headers['content-disposition'] as string) ?? '';
    const match = contentDisposition.match(/filename="([^"]+)"/);
    const filename = match?.[1] ?? `attendance-export.${params.format}`;
    const contentType = (res.headers['content-type'] as string) ?? 'application/octet-stream';

    const blob = new Blob([res.data as ArrayBuffer], { type: contentType });

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
    return { blob: null, filename: '', errors: ['Xuất điểm danh thất bại'] };
  }
}
