import type { Gender, ListMeta, Role, UserRow, UserStatus } from '@/types/auth';

export interface IListUsersParams {
  email?: string;
  fullName?: string;
  gender?: Gender;
  provinceId?: number;
  schoolName?: string;
  parentPhonenumber?: string;
  role?: Role;
  status?: UserStatus;
  classId?: number;
  notInClassId?: number;
  notInCourseId?: number;
  page?: number;
  pageSize?: number;
}

export interface UsersListStats {
  total: number;
  activated: number;
  unactivated: number;
  disabled: number;
  admins: number;
  students: number;
}

export interface IListUsersResult {
  data: UserRow[];
  meta: ListMeta;
  stats: UsersListStats;
}

export interface BulkSyncRow {
  email: string;
  status: 'active' | 'inactive';
}

export interface BulkJobStatus {
  status: 'RUNNING' | 'DONE' | 'FAILED';
  total: number;
  processed: number;
  created: number;
  activated: number;
  disabled: number;
  failed: number;
  failedItems?: { email: string; reason: string }[];
}

export interface IActionState {
  errors: string[];
}

export interface IAdminUpdateUserPayload {
  fullName?: string;
  gender?: Gender;
  birthday?: string | null;
  provinceId?: number;
  schoolName?: string;
  parentPhonenumber?: string;
  facebookLink?: string;
}

export interface IBulkDeleteSkippedItem {
  id: number;
  reason: 'notFound' | 'hasData';
}

export interface IBulkDeleteResult {
  deleted: number;
  deletedIds: number[];
  skipped: IBulkDeleteSkippedItem[];
}

export interface IBulkDeleteActionState {
  errors: string[];
  data?: IBulkDeleteResult;
}
