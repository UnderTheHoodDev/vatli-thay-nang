'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IImportTuitionPreviewResult } from '@/types/actions/tuition';

export interface ImportTuitionPreviewResponse {
  data: IImportTuitionPreviewResult | null;
  errors: string[];
}

export async function importTuitionPreviewAction(
  formData: FormData,
): Promise<ImportTuitionPreviewResponse> {
  try {
    // `api` đặt sẵn header Content-Type: application/json cho mọi request — phải bỏ
    // để axios tự tính lại thành multipart/form-data với đúng boundary cho FormData.
    const res = await api.post('/api/v1/tuition/import/preview', formData, {
      headers: { 'Content-Type': undefined },
    });
    const result = res.data as { data: IImportTuitionPreviewResult };
    return { data: result.data, errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { data: null, errors: extractErrors(error.response.data) };
    }
    return { data: null, errors: ['Xem trước file thất bại'] };
  }
}
