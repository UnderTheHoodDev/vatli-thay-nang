import type { ListMeta } from '@/types/auth';
import type { ClassRow, ClassStatus } from '@/types/class-management';

export interface IListClassesParams {
  name?: string;
  code?: string;
  status?: ClassStatus;
  page?: number;
  pageSize?: number;
}

export interface IListClassesResult {
  data: ClassRow[];
  meta: ListMeta;
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
