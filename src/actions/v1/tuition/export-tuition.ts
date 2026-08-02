'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IExportTuitionParams } from '@/types/actions/tuition';

export interface ExportTuitionResponse {
  blob: Blob | null;
  filename: string;
  errors: string[];
}

export async function exportTuitionAction(
  params: IExportTuitionParams,
): Promise<ExportTuitionResponse> {
  try {
    const res = await api.get('/api/v1/tuition/export', {
      params,
      responseType: 'arraybuffer',
    });

    const contentDisposition = (res.headers['content-disposition'] as string) ?? '';
    const match = contentDisposition.match(/filename="([^"]+)"/);
    const filename = match?.[1] ?? `hoc-phi-${params.classId}-${params.year}-${params.month}.xlsx`;
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
    return { blob: null, filename: '', errors: ['Xuất học phí thất bại'] };
  }
}
