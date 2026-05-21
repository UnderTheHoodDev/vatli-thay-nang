'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IActionState } from '@/types/actions/users';
import type { ICreateClassPayload } from '@/types/actions/class-management';

export async function createClassAction(payload: ICreateClassPayload): Promise<IActionState> {
  try {
    await api.post('/api/v1/classes', payload);
    revalidatePath('/admin/classes');
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Tạo lớp thất bại'] };
  }
}
