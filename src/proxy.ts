import { NextRequest, NextResponse } from 'next/server';
import { readSessionFromRedis } from '@/lib/redis';

const SESSION_COOKIE = 'session_id';
const CHANGE_PASSWORD_PATH = '/auth/change-password';
const LOGIN_PATH = '/auth/login';
const ADMIN_HOME = '/admin/accounts';
const STUDENT_HOME = '/dashboard';

const PROTECTED_PREFIXES = ['/admin', '/dashboard'];
const ADMIN_ONLY_PREFIX = '/admin';

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isAdminOnly(pathname: string): boolean {
  return pathname === ADMIN_ONLY_PREFIX || pathname.startsWith(`${ADMIN_ONLY_PREFIX}/`);
}

function isChangePassword(pathname: string): boolean {
  return pathname === CHANGE_PASSWORD_PATH;
}

function isLogin(pathname: string): boolean {
  return pathname === LOGIN_PATH;
}

function homeForRole(role: string): string {
  return role === 'ADMIN' ? ADMIN_HOME : STUDENT_HOME;
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
  const session = sessionId ? await readSessionFromRedis(sessionId) : null;

  if (isLogin(pathname)) {
    if (session) {
      return NextResponse.redirect(new URL(homeForRole(session.role), request.url));
    }
    return NextResponse.next();
  }

  if (isProtected(pathname) || isChangePassword(pathname)) {
    if (!sessionId) {
      return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
    }

    if (!session) {
      const res = NextResponse.redirect(new URL(LOGIN_PATH, request.url));
      res.cookies.delete(SESSION_COOKIE);
      return res;
    }

    if (isAdminOnly(pathname) && session.role !== 'ADMIN') {
      return NextResponse.redirect(new URL(homeForRole(session.role), request.url));
    }
  }

  return NextResponse.next();
}

export const matcher = [
  '/admin/:path*',
  '/dashboard/:path*',
  '/auth/change-password',
  '/auth/login',
];
