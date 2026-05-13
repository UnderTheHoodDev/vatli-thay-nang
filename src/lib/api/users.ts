import api from '@/lib/axios';
import type { ListMeta, UserRow, UserStatus } from '@/types/auth';

export interface ListUsersParams {
  email?: string;
  fullName?: string;
  gender?: string;
  provinceId?: number;
  schoolName?: string;
  parentPhonenumber?: string;
  role?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export async function listUsers(params: ListUsersParams) {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null),
  );
  const { data } = await api.get<{ data: UserRow[]; meta: ListMeta }>(
    '/users',
    { params: cleaned },
  );
  return data;
}

export async function createUser(email: string) {
  const { data } = await api.post<{ message: string }>('/users', { email });
  return data;
}

export async function setUserStatus(id: number, status: UserStatus) {
  const { data } = await api.patch<{ message: string }>(
    `/users/${id}/status`,
    { status },
  );
  return data;
}

export async function resendActivation(email: string) {
  const { data } = await api.post<{ message: string }>('/users/activation', {
    email,
  });
  return data;
}
