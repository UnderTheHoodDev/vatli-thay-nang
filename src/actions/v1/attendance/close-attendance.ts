'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IActionState } from '@/types/actions/users';

export async function closeAttendanceAction(attendanceSessionId: number): Promise<IActionState> {
  try {
    await api.patch(`/api/v1/attendance-sessions/${attendanceSessionId}/close`);
    revalidatePath('/admin/classes/[id]/class-sessions/[sessionId]', 'page');
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Đóng phiên điểm danh thất bại'] };
  }
}
