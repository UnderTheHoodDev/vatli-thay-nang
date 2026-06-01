'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { LeaveType } from '@/types/class-management';

export interface MyLeaveRequest {
  id: number;
  reason: string;
  leaveType: LeaveType;
  status: 'SUBMITTED' | 'ACKNOWLEDGED';
  submittedAt: string;
}

export interface GetMyLeaveRequestResult {
  data: MyLeaveRequest | null;
  errors: string[];
}

export async function getMyLeaveRequestAction(
  classSessionId: number,
): Promise<GetMyLeaveRequestResult> {
  try {
    const res = await api.get(`/api/v1/class-sessions/${classSessionId}/my-leave-request`);
    return { data: (res.data as { data: MyLeaveRequest | null }).data, errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { data: null, errors: extractErrors(error.response.data) };
    }
    return { data: null, errors: [] };
  }
}
