'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { ExportFormat } from '@/types/tests';

export interface ExportSubmissionsResult {
  blob: Blob | null;
  filename: string;
  errors: string[];
}

/**
 * Tải kết quả bài kiểm tra (CSV/Excel).
 *
 * Phải đi qua server action chứ không link thẳng: BE xác thực bằng header
 * X-Session-Id (axios interceptor gắn vào), trình duyệt tải trực tiếp sẽ không có.
 */
export async function exportSubmissionsAction(
  testId: number,
  format: ExportFormat,
): Promise<ExportSubmissionsResult> {
  try {
    const res = await api.get(`/api/v1/tests/${testId}/submissions/export`, {
      params: { format },
      responseType: 'arraybuffer',
    });

    const contentDisposition = (res.headers['content-disposition'] as string) ?? '';
    const match = contentDisposition.match(/filename="([^"]+)"/);
    const filename = match?.[1] ?? `test-${testId}-results.${format}`;
    const contentType = (res.headers['content-type'] as string) ?? 'application/octet-stream';

    return {
      blob: new Blob([res.data as ArrayBuffer], { type: contentType }),
      filename,
      errors: [],
    };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      // responseType 'arraybuffer' → body lỗi về dạng Buffer, không phải JSON đã parse.
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
    return { blob: null, filename: '', errors: ['Xuất kết quả thất bại'] };
  }
}
