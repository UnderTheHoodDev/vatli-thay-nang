import api from '@/lib/axios';

export async function login(email: string, password: string) {
  const { data } = await api.post<{ message: string; session_id: string }>(
    '/auth/login',
    { email, password },
  );
  return data;
}

export async function logout() {
  const { data } = await api.post<{ message: string }>('/auth/logout', {});
  return data;
}

export async function readActivation(token: string) {
  const { data } = await api.get<{
    userId: number;
    email: string;
    role: string;
    expiredAt: number;
  }>('/auth/activation', { params: { tk: token } });
  return data;
}

export async function confirmActivation(token: string, password: string) {
  const { data } = await api.patch<{ message: string; session_id: string }>(
    '/auth/activation',
    { token, password },
  );
  return data;
}

export async function changePassword(password: string, confirmPassword: string) {
  const { data } = await api.patch<{ message: string }>(
    '/auth/change-password',
    { password, confirmPassword },
  );
  return data;
}
