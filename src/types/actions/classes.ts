import type { ListMeta } from '@/types/auth';
import type { ClassStatus } from '@/types/class-management';

export interface ClassDetail {
  id: number;
  name: string;
  code: string;
  description: string | null;
  status: ClassStatus;
  studentCount: number;
  createdAt: string;
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

export interface IActionState {
  errors: string[];
}
