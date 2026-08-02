'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type {
  IImportTuitionConfirmParams,
  IImportTuitionConfirmResult,
} from '@/types/actions/tuition';

export interface ImportTuitionConfirmResponse {
  data: IImportTuitionConfirmResult | null;
  errors: string[];
}

export async function importTuitionConfirmAction(
  params: IImportTuitionConfirmParams,
): Promise<ImportTuitionConfirmResponse> {
  try {
    const res = await api.post('/api/v1/tuition/import/confirm', params);
    const result = res.data as { data: IImportTuitionConfirmResult };
    revalidatePath(`/admin/tuition/${params.classId}`);
    return { data: result.data, errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { data: null, errors: extractErrors(error.response.data) };
    }
    return { data: null, errors: ['Đồng bộ học phí thất bại'] };
  }
}
