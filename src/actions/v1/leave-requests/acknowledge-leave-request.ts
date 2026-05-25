'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IActionState } from '@/types/actions/users';

export async function acknowledgeLeaveRequestAction(
  leaveRequestId: number,
  classSessionId: number,
): Promise<IActionState> {
  try {
    await api.patch(`/api/v1/leave-requests/${leaveRequestId}/status`, {
      status: 'ACKNOWLEDGED',
    });
    revalidatePath(`/admin/class-sessions/${classSessionId}`);
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Xác nhận xin nghỉ thất bại'] };
  }
}
