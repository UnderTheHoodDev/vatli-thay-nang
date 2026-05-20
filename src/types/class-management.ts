export type ClassStatus = 'ACTIVE' | 'CLOSED';
export type ClassSessionStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';
export type LeaveRequestStatus = 'SUBMITTED' | 'ACKNOWLEDGED';
export type AttendanceSessionStatus = 'ACTIVE' | 'CLOSED';
export type AttendanceSource = 'STUDENT' | 'MANUAL';
export type ManualEditAction =
  | 'MARK_ATTENDED'
  | 'REMOVE_ATTENDANCE'
  | 'ADD_NOTE'
  | 'ACKNOWLEDGE_LEAVE';

export interface ClassRow {
  id: number;
  name: string;
  code: string;
  description: string | null;
  status: ClassStatus;
  studentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClassStudentRow {
  id: number;
  classId: number;
  studentId: number;
  createdAt: string;
}

export interface ClassSessionRow {
  id: number;
  classId: number;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  meetingUrl: string | null;
  status: ClassSessionStatus;
  createdById: number;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequestRow {
  id: number;
  classSessionId: number;
  studentId: number;
  reason: string;
  status: LeaveRequestStatus;
  submittedAt: string;
  reviewedById: number | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceSessionRow {
  id: number;
  classSessionId: number;
  openedById: number;
  durationMinutes: number;
  openedAt: string;
  closedAt: string;
  status: AttendanceSessionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceLogRow {
  id: number;
  attendanceSessionId: number;
  classSessionId: number;
  studentId: number;
  checkedAt: string;
  source: AttendanceSource;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceManualEditLogRow {
  id: number;
  classSessionId: number;
  studentId: number;
  action: ManualEditAction;
  previousValue: string | null;
  newValue: string | null;
  note: string | null;
  editedBy: number;
  editedAt: string;
}
