'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IBulkUpdateTuitionParams, IBulkUpdateTuitionResult } from '@/types/actions/tuition';

export interface BulkUpdateTuitionResponse {
  data: IBulkUpdateTuitionResult | null;
  errors: string[];
}

export async function bulkUpdateTuitionAction(
  classId: number,
  params: IBulkUpdateTuitionParams,
): Promise<BulkUpdateTuitionResponse> {
  try {
    const res = await api.patch('/api/v1/tuition', params);
    revalidatePath(`/admin/tuition/${classId}`);
    const body = res.data as { data: IBulkUpdateTuitionResult };
    return { data: body.data, errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { data: null, errors: extractErrors(error.response.data) };
    }
    return { data: null, errors: ['Lưu học phí thất bại'] };
  }
}
