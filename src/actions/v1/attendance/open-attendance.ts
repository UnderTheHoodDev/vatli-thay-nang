'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IActionState } from '@/types/actions/users';
import type { IOpenAttendancePayload } from '@/types/actions/attendance';

export async function openAttendanceAction(
  classSessionId: number,
  payload: IOpenAttendancePayload,
): Promise<IActionState> {
  try {
    await api.post(`/api/v1/class-sessions/${classSessionId}/attendance-sessions`, payload);
    revalidatePath(`/admin/class-sessions/${classSessionId}`);
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Bật điểm danh thất bại'] };
  }
}
