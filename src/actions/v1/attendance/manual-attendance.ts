'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IActionState } from '@/types/actions/users';
import type { IManualAttendancePayload } from '@/types/actions/attendance';

export async function manualAttendanceAction(
  classSessionId: number,
  payload: IManualAttendancePayload,
): Promise<IActionState> {
  try {
    await api.patch(`/api/v1/class-sessions/${classSessionId}/attendance/manual`, payload);
    revalidatePath('/admin/classes/[id]/class-sessions/[sessionId]', 'page');
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Chỉnh sửa điểm danh thất bại'] };
  }
}
