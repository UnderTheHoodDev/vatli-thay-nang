import type { ListMeta } from '@/types/auth';
import type {
  AttendanceSessionStatus,
  AttendanceSource,
  LeaveRequestStatus,
  LeaveType,
  ManualEditAction,
} from '@/types/class-management';

export interface AttendanceSessionListRow {
  id: number;
  openedAt: string;
  closedAt: string;
  durationMinutes: number;
  status: AttendanceSessionStatus;
}

export interface IListAttendanceSessionsParams {
  page?: number;
  pageSize?: number;
}

export interface IListAttendanceSessionsResult {
  data: AttendanceSessionListRow[];
  meta: ListMeta;
}

export interface IOpenAttendancePayload {
  durationMinutes: number;
}

export interface IOpenAttendanceResult {
  id: number;
  openedAt: string;
  closedAt: string;
  durationMinutes: number;
}

export interface AttendanceSummaryStudentLog {
  attendanceSessionId: number;
  checkedAt: string;
  source: AttendanceSource;
  note: string | null;
}

export interface AttendanceSummaryLeaveRequest {
  reason: string;
  leaveType: LeaveType;
  status: LeaveRequestStatus;
  submittedAt: string;
}

export interface AttendanceSummaryStudent {
  studentId: number;
  fullName: string | null;
  email: string;
  leaveRequest: AttendanceSummaryLeaveRequest | null;
  attendances: AttendanceSummaryStudentLog[];
}

export interface AttendanceSummary {
  counts: {
    total: number;
    attended: number;
    notAttended: number;
    onLeave: number;
  };
  attendanceSessions: AttendanceSessionListRow[];
  students: AttendanceSummaryStudent[];
}

export interface IManualAttendancePayload {
  studentId: number;
  action: ManualEditAction;
  attendanceSessionId?: number;
  note?: string;
}

export interface AttendanceLogListRow {
  id: number;
  attendanceSessionId: number;
  checkedAt: string;
  source: AttendanceSource;
  note: string | null;
  student: {
    id: number;
    fullName: string | null;
    email: string;
  };
}

export interface IListAttendanceLogsParams {
  attendanceSessionId?: number;
  page?: number;
  pageSize?: number;
}

export interface IListAttendanceLogsResult {
  data: AttendanceLogListRow[];
  meta: ListMeta;
}

export interface MyAttendanceLog {
  attendanceSessionId: number;
  checkedAt: string;
}
