'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IGetUploadUrlPayload, IGetUploadUrlResult } from '@/types/actions/course-management';

export interface GetUploadUrlResponse {
  data: IGetUploadUrlResult | null;
  errors: string[];
}

export async function getUploadUrlAction(
  payload: IGetUploadUrlPayload,
): Promise<GetUploadUrlResponse> {
  try {
    const res = await api.post('/api/v1/storage/upload-url', payload);
    const data = (res.data as { data: IGetUploadUrlResult }).data;
    return { data, errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { data: null, errors: extractErrors(error.response.data) };
    }
    return { data: null, errors: ['Tạo URL upload thất bại'] };
  }
}
