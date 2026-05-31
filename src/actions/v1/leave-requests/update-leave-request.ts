'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IActionState } from '@/types/actions/users';
import type { IUpdateLeaveRequestPayload } from '@/types/actions/leave-requests';

export async function updateLeaveRequestAction(
  leaveRequestId: number,
  payload: IUpdateLeaveRequestPayload,
): Promise<IActionState> {
  try {
    await api.patch(`/api/v1/leave-requests/${leaveRequestId}`, payload);
    revalidatePath('/dashboard/classes/[id]/class-sessions/[sessionId]', 'page');
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Cập nhật đơn xin nghỉ thất bại'] };
  }
}
