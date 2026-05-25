'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IActionState } from '@/types/actions/users';
import type { ISubmitLeaveRequestPayload } from '@/types/actions/leave-requests';

export async function submitLeaveRequestAction(
  classSessionId: number,
  payload: ISubmitLeaveRequestPayload,
): Promise<IActionState> {
  try {
    await api.post(`/api/v1/class-sessions/${classSessionId}/leave-requests`, payload);
    revalidatePath('/dashboard');
    return { errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { errors: extractErrors(error.response.data) };
    }
    return { errors: ['Gửi yêu cầu xin nghỉ thất bại'] };
  }
}
