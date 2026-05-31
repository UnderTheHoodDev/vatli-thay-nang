import type { ListMeta } from '@/types/auth';
import type { ClassRow, ClassStatus } from '@/types/class-management';

export interface IListClassesParams {
  name?: string;
  code?: string;
  status?: ClassStatus;
  page?: number;
  pageSize?: number;
}

export interface ClassesListStats {
  total: number;
  active: number;
  closed: number;
  totalStudents: number;
}

export interface IListClassesResult {
  data: ClassRow[];
  meta: ListMeta;
  stats: ClassesListStats;
}

export interface ICreateClassPayload {
  name: string;
  code: string;
  description?: string;
}

export interface IUpdateClassPayload {
  name?: string;
  code?: string;
  description?: string;
  status?: ClassStatus;
}

export interface ClassStudentListRow {
  studentId: number;
  email: string;
  fullName: string | null;
  createdAt: string;
}

export interface IListClassStudentsParams {
  email?: string;
  fullName?: string;
  page?: number;
  pageSize?: number;
}

export interface IListClassStudentsResult {
  data: ClassStudentListRow[];
  meta: ListMeta;
}

export interface ClassSessionListRow {
  id: number;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  meetingUrl: string | null;
}

export interface IListClassSessionsParams {
  page?: number;
  pageSize?: number;
}

export interface IListClassSessionsResult {
  data: ClassSessionListRow[];
  meta: ListMeta;
}

export interface ClassSessionDetail {
  id: number;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  meetingUrl: string | null;
  activeAttendanceSession: { id: number; closedAt: string } | null;
}

export interface ICreateClassSessionPayload {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  meetingUrl?: string;
}

export interface IUpdateClassSessionPayload {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  meetingUrl?: string;
}
