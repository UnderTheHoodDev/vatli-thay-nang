'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IBulkDeleteActionState } from '@/types/actions/users';

export async function bulkDeleteUsersAction(ids: number[]): Promise<IBulkDeleteActionState> {
  try {
    const res = await api.post('/api/v1/users/bulk-delete', { ids });
    revalidatePath('/admin/accounts');
    return { errors: [], data: res.data.data };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Xoá hàng loạt thất bại'] };
  }
}
