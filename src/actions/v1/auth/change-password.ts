'use server';

import { AxiosError } from 'axios';
import { revalidatePath } from 'next/cache';
import { api } from '@/lib/axios';
import { clearSessionCookieInAction } from '@/lib/server/cookies';
import { extractErrors } from '@/lib/errors';
import type { Role } from '@/types/auth';
import type { IChangePasswordResult } from '@/types/actions/auth';

interface Args {
  currentPassword: string | undefined;
  password: string;
  confirmPassword: string;
  isInitialSetup: boolean;
  role: Role;
}

export async function changePasswordAction(args: Args): Promise<IChangePasswordResult> {
  try {
    await api.patch('/api/v1/change-password', {
      currentPassword: args.currentPassword,
      password: args.password,
      confirmPassword: args.confirmPassword,
    });

    if (args.isInitialSetup) {
      revalidatePath('/', 'layout');
      return {
        success: true,
        errors: [],
        redirectTo: args.role === 'ADMIN' ? '/admin/accounts' : '/dashboard',
      };
    }

    await clearSessionCookieInAction();
    revalidatePath('/', 'layout');
    return { success: true, errors: [], redirectTo: '/auth/login' };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { success: false, errors: extractErrors(error.response.data) };
    }
    return {
      success: false,
      errors: [args.isInitialSetup ? 'Đặt mật khẩu thất bại' : 'Đổi mật khẩu thất bại'],
    };
  }
}
