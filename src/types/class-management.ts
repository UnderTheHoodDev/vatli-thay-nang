export type ClassStatus = 'ACTIVE' | 'CLOSED';
export type ClassSessionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
export type ClassStudentStatus = 'STUDYING' | 'LEFT';
export type LeaveRequestStatus = 'SUBMITTED' | 'ACKNOWLEDGED';
export type LeaveType = 'FULL_SESSION' | 'EARLY_LEAVE';
export type AttendanceSessionStatus = 'ACTIVE' | 'CLOSED';
export type AttendanceSource = 'STUDENT' | 'MANUAL';
export type ManualEditAction =
  | 'MARK_ATTENDED'
  | 'REMOVE_ATTENDANCE'
  | 'ADD_NOTE'
  | 'ACKNOWLEDGE_LEAVE';

export const CLASS_STUDENT_STATUS_LABEL: Record<ClassStudentStatus, string> = {
  STUDYING: 'Đang học',
  LEFT: 'Đã nghỉ',
};

export interface ClassRow {
  id: number;
  name: string;
  code: string;
  description: string | null;
  status: ClassStatus;
  studentCount?: number;
  sessionCount?: number;
  createdAt?: string;
  /** Học phí mặc định / buổi (VND, số nguyên). Chỉ trả cho ADMIN. */
  defaultSessionFee?: number;
  // STUDENT only.
  attendedCount?: number;
  leaveCount?: number;
  notAttendedCount?: number;
  hasActiveAttendance?: boolean;
}

export interface ClassDetail extends ClassRow {
  createdAt: string;
}
