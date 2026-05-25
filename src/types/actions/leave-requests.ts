import type { ListMeta } from '@/types/auth';
import type { LeaveRequestStatus } from '@/types/class-management';

export interface LeaveRequestListRow {
  id: number;
  student: {
    id: number;
    fullName: string | null;
    email: string;
  };
  reason: string;
  status: LeaveRequestStatus;
  submittedAt: string;
}

export interface IListLeaveRequestsParams {
  page?: number;
  pageSize?: number;
}

export interface IListLeaveRequestsResult {
  data: LeaveRequestListRow[];
  meta: ListMeta;
  errors: string[];
}

export interface ISubmitLeaveRequestPayload {
  reason: string;
}

export interface IAcknowledgeLeaveRequestPayload {
  status: 'ACKNOWLEDGED';
}
