'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type {
  IGetBunnyTusUploadPayload,
  IGetBunnyTusUploadResult,
} from '@/types/actions/course-management';

export interface GetBunnyTusUploadResponse {
  data: IGetBunnyTusUploadResult | null;
  errors: string[];
}

/**
 * Tạo (hoặc ký lại cho) video record để upload qua TUS resumable.
 * Chữ ký ký server-side; apiKey không lộ ra client.
 */
export async function getBunnyTusUploadAction(
  payload: IGetBunnyTusUploadPayload,
): Promise<GetBunnyTusUploadResponse> {
  try {
    const res = await api.post('/api/v1/bunny/tus-upload', payload);
    const data = (res.data as { data: IGetBunnyTusUploadResult }).data;
    return { data, errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { data: null, errors: extractErrors(error.response.data) };
    }
    return { data: null, errors: ['Không tạo được phiên upload video'] };
  }
}
