'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IRecomputeTuitionParams, IRecomputeTuitionResult } from '@/types/actions/tuition';

export interface RecomputeTuitionResponse {
  data: IRecomputeTuitionResult | null;
  errors: string[];
}

export async function recomputeTuitionAction(
  params: IRecomputeTuitionParams,
): Promise<RecomputeTuitionResponse> {
  try {
    // KHÔNG truyền `null` làm body: axios sẽ JSON.stringify thành chuỗi "null",
    // và body-parser (strict mode) của Nest từ chối mọi JSON top-level không phải
    // object/array, trả về 400 "null is not valid JSON". Không cần body cho route
    // này (params nằm ở query) nên để axios không gửi body nào cả.
    const res = await api.post('/api/v1/tuition/recompute', undefined, { params });
    const data = (res.data as { data: IRecomputeTuitionResult }).data;
    revalidatePath(`/admin/tuition/${params.classId}`);
    return { data, errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { data: null, errors: extractErrors(error.response.data) };
    }
    return { data: null, errors: ['Tính lại học phí thất bại'] };
  }
}
