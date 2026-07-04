'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { BulkJobStatus } from '@/types/actions/users';

export interface BulkJobStatusResult {
  data?: BulkJobStatus;
  errors: string[];
}

export async function getBulkJobStatusAction(jobId: string): Promise<BulkJobStatusResult> {
  try {
    const res = await api.get(`/api/v1/users/bulk-jobs/${jobId}`);
    return { data: res.data?.data as BulkJobStatus, errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Không thể lấy trạng thái job'] };
  }
}
