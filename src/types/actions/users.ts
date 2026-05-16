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
  page?: number;
  pageSize?: number;
}

export interface IListUsersResult {
  data: UserRow[];
  meta: ListMeta;
}

export interface IActionState {
  errors: string[];
}
