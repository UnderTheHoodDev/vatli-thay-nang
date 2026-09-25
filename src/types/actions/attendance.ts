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

export interface MyAttendanceLog {
  attendanceSessionId: number;
  checkedAt: string;
}

export interface ClassAttendanceCounts {
  totalSessions: number;
  present: number;
  leaveFull: number;
  leaveEarly: number;
  totalLeave: number;
  absentNoCheckin: number;
}

export interface ClassAttendanceStudentRow extends ClassAttendanceCounts {
  studentId: number;
}

export const ATTENDANCE_COUNT_LABEL: Record<keyof ClassAttendanceCounts, string> = {
  totalSessions: 'Tổng số buổi',
  present: 'Đã điểm danh',
  leaveFull: 'Nghỉ cả buổi',
  leaveEarly: 'Nghỉ giữa chừng',
  totalLeave: 'Tổng nghỉ',
  absentNoCheckin: 'Vắng không điểm danh',
};

/** Chỉ số sắp xếp được ở bảng học sinh — khớp enum ClassStudentSortBy phía BE. */
export const ATTENDANCE_SORT_KEYS = [
  'present',
  'totalLeave',
  'leaveEarly',
  'absentNoCheckin',
] as const;

export type ClassStudentSortBy = (typeof ATTENDANCE_SORT_KEYS)[number];
