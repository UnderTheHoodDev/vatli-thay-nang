'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type {
  IGetBunnyUploadUrlPayload,
  IGetBunnyUploadUrlResult,
} from '@/types/actions/course-management';

export interface GetBunnyUploadUrlResponse {
  data: IGetBunnyUploadUrlResult | null;
  errors: string[];
}

export async function getBunnyUploadUrlAction(
  payload: IGetBunnyUploadUrlPayload,
): Promise<GetBunnyUploadUrlResponse> {
  try {
    const res = await api.post('/api/v1/bunny/upload-url', payload);
    const data = (res.data as { data: IGetBunnyUploadUrlResult }).data;
    return { data, errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { data: null, errors: extractErrors(error.response.data) };
    }
    return { data: null, errors: ['Tạo URL upload video thất bại'] };
  }
}
