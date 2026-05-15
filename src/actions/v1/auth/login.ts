'use server';

import { AxiosError } from 'axios';
import { headers } from 'next/headers';
import { apiClient } from '@/lib/axios';
import { setSessionCookieInAction } from '@/lib/server/cookies';
import { extractErrors } from '@/lib/errors';
import { checkLoginRateLimit, resetLoginRateLimit } from '@/lib/redis';
import type { Role } from '@/types/auth';
import type { IAuthActionResult } from '@/types/actions/auth';

async function getClientIdentifier(email: string): Promise<string> {
  const headerStore = await headers();
  const forwarded = headerStore.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || headerStore.get('x-real-ip') || 'unknown';
  return `${ip}:${email.toLowerCase()}`;
}

export async function loginAction(email: string, password: string): Promise<IAuthActionResult> {
  const trimmedEmail = email.trim();
  const identifier = await getClientIdentifier(trimmedEmail);

  const rateLimit = await checkLoginRateLimit(identifier);
  if (!rateLimit.allowed) {
    const minutes = Math.ceil(rateLimit.retryAfterSeconds / 60);
    return {
      success: false,
      errors: [`Quá nhiều lần đăng nhập sai. Vui lòng thử lại sau ${minutes} phút.`],
    };
  }

  try {
    const res = await apiClient.post('/api/v1/login', { email: trimmedEmail, password });
    const data = res.data as { session_id: string; role: Role };
    await setSessionCookieInAction(data.session_id);
    await resetLoginRateLimit(identifier);

    return {
      success: true,
      errors: [],
      redirectTo: data.role === 'ADMIN' ? '/admin/users' : '/dashboard',
    };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { success: false, errors: extractErrors(error.response.data) };
    }
    return { success: false, errors: ['Đăng nhập thất bại'] };
  }
}
