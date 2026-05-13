import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export type ApiError = { errors: string[] };

export function extractErrors(err: unknown): string[] {
  const e = err as { response?: { data?: ApiError }; message?: string };
  return e?.response?.data?.errors ?? [e?.message ?? 'Đã có lỗi xảy ra'];
}

export default api;
