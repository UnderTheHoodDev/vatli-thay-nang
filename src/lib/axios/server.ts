import 'server-only';
import axios, { AxiosError, AxiosInstance } from 'axios';
import { cookies } from 'next/headers';

const BE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const SESSION_COOKIE = 'session_id';

function createServerApi(): AxiosInstance {
  const instance = axios.create({
    baseURL: BE_URL,
    headers: { 'Content-Type': 'application/json' },
    validateStatus: () => true,
  });

  instance.interceptors.request.use(async (config) => {
    const sid = (await cookies()).get(SESSION_COOKIE)?.value;
    if (sid) {
      config.headers = config.headers ?? {};
      config.headers['X-Session-ID'] = sid;
    }
    return config;
  });

  return instance;
}

export const serverApi = createServerApi();

export type BeResult<T> = {
  status: number;
  data: T | { errors: string[] };
};

export async function callBe<T>(
  fn: (api: AxiosInstance) => Promise<{ status: number; data: unknown }>,
): Promise<BeResult<T>> {
  try {
    const res = await fn(serverApi);
    return { status: res.status, data: res.data as T };
  } catch (err) {
    const e = err as AxiosError<{ errors?: string[] }>;
    if (e.response) {
      return {
        status: e.response.status,
        data: e.response.data as T,
      };
    }
    return {
      status: 502,
      data: { errors: ['Không thể kết nối tới backend'] },
    };
  }
}
