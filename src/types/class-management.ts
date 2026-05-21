export type ClassStatus = 'ACTIVE' | 'ARCHIVED' | 'DELETED';
export type ClassStudentStatus = 'ACTIVE' | 'REMOVED';
export type ClassSessionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type LeaveRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
export type AttendanceMethod = 'QR_CODE' | 'MANUAL';

export interface ClassRow {
  id: number;
  name: string;
  description: string | null;
  status: ClassStatus;
  createdById: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClassStudentRow {
  id: number;
  classId: number;
  userId: number;
  status: ClassStudentStatus;
  joinedAt: string;
}

export interface ClassSessionRow {
  id: number;
  classId: number;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  status: ClassSessionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequestRow {
  id: number;
  classSessionId: number;
  userId: number;
  reason: string;
  status: LeaveRequestStatus;
  reviewedById: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceSessionRow {
  id: number;
  classSessionId: number;
  qrCode: string | null;
  qrExpiresAt: string | null;
  isOpen: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceLogRow {
  id: number;
  attendanceSessionId: number;
  userId: number;
  status: AttendanceStatus;
  method: AttendanceMethod | null;
  checkedInAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceManualEditLogRow {
  id: number;
  attendanceLogId: number;
  editedById: number;
  oldStatus: AttendanceStatus;
  newStatus: AttendanceStatus;
  reason: string | null;
  createdAt: string;
}
