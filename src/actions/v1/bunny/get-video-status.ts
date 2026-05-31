'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IBunnyVideoStatus } from '@/types/actions/course-management';

export interface GetBunnyVideoStatusResponse {
  data: IBunnyVideoStatus | null;
  errors: string[];
}

export async function getBunnyVideoStatusAction(
  videoId: string,
): Promise<GetBunnyVideoStatusResponse> {
  try {
    const res = await api.get(`/api/v1/bunny/videos/${encodeURIComponent(videoId)}/status`);
    const data = (res.data as { data: IBunnyVideoStatus }).data;
    return { data, errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { data: null, errors: extractErrors(error.response.data) };
    }
    return { data: null, errors: ['Không lấy được trạng thái video'] };
  }
}
