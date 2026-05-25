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
  notInClassId?: number;
  page?: number;
  pageSize?: number;
}

export interface UsersListStats {
  total: number;
  activated: number;
  unactivated: number;
  admins: number;
  students: number;
}

export interface IListUsersResult {
  data: UserRow[];
  meta: ListMeta;
  stats: UsersListStats;
}

export interface IActionState {
  errors: string[];
}
