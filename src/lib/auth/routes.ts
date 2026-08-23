import type { Role } from '@/types/auth';

/** Trang chủ tương ứng với từng role sau khi đăng nhập / đổi mật khẩu. */
export function roleHomePath(role: Role): string {
  if (role === 'STUDENT') return '/dashboard';
  if (role === 'TEACHING_ASSISTANT') return '/admin/classes';
  return '/admin/accounts';
}
