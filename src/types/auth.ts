export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type Role = 'ADMIN' | 'STUDENT';
export type UserStatus = 'ACTIVATED' | 'UNACTIVATED';

export interface UserRow {
  id: number;
  email: string;
  fullName: string | null;
  gender: Gender | null;
  birthday: string | null;
  provinceId: number | null;
  province: string | null;
  schoolName: string | null;
  parentPhonenumber: string | null;
  facebookLink: string | null;
  role: Role;
  status: UserStatus;
}

export interface Province {
  id: number;
  name: string;
}

export interface SessionInfo {
  userId: number;
  email: string;
  role: Role;
  fullName?: string | null;
  hasPassword: boolean;
}

export interface ListMeta {
  total: number;
  page: number;
  pageSize: number;
}
