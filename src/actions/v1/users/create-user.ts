'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IActionState } from '@/types/actions/users';

export async function createUserAction(email: string): Promise<IActionState> {
  try {
    const trimmed = email.trim();
    if (!trimmed) return { errors: ['Vui lòng nhập email'] };

    await api.post('/api/v1/users', { email: trimmed });
    revalidatePath('/admin/users');
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Tạo user thất bại'] };
  }
}
