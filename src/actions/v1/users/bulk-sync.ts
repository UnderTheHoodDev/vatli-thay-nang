'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { BulkSyncRow } from '@/types/actions/users';

export interface BulkSyncResult {
  jobId?: string;
  errors: string[];
}

export async function bulkSyncAction(rows: BulkSyncRow[]): Promise<BulkSyncResult> {
  try {
    const res = await api.post('/api/v1/users/bulk-sync', { rows });
    return { jobId: res.data?.data?.jobId as string, errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Gửi yêu cầu đồng bộ thất bại'] };
  }
}
