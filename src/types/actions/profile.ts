import type { Gender, Role, UserStatus } from '@/types/auth';

export interface IUserProfile {
  id: number;
  email: string;
  fullName: string | null;
  gender: Gender | null;
  provinceId: number | null;
  province: string | null;
  schoolName: string | null;
  parentPhonenumber: string | null;
  role: Role;
  status: UserStatus;
}

export interface IUpdateProfilePayload {
  fullName?: string;
  gender?: Gender;
  provinceId?: number;
  schoolName?: string;
  parentPhonenumber?: string;
}

export interface IUpdateProfileResult {
  success: boolean;
  errors: string[];
}
