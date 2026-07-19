'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IActionState } from '@/types/actions/users';
import type { IUpdateScheduleSettingsPayload } from '@/types/actions/schedule-settings';

export async function updateScheduleSettingsAction(
  payload: IUpdateScheduleSettingsPayload,
): Promise<IActionState> {
  try {
    await api.patch('/api/v1/schedule-settings', payload);
    revalidatePath('/admin/courses');
    revalidatePath('/');
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Cập nhật lịch học thất bại'] };
  }
}
