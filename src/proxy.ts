import { NextRequest, NextResponse } from 'next/server';
import { readSessionFromRedis } from '@/lib/redis';

const SESSION_COOKIE = 'session_id';
const CHANGE_PASSWORD_PATH = '/auth/change-password';
const LOGIN_PATH = '/auth/login';

const PROTECTED_PREFIXES = ['/admin', '/dashboard'];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function isChangePassword(pathname: string): boolean {
  return pathname === CHANGE_PASSWORD_PATH;
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const sessionId = request.cookies.get(SESSION_COOKIE)?.value;

  const needsSession = isProtected(pathname) || isChangePassword(pathname);

  if (!needsSession) {
    return NextResponse.next();
  }

  if (!sessionId) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  const session = await readSessionFromRedis(sessionId);

  if (!session) {
    const res = NextResponse.redirect(new URL(LOGIN_PATH, request.url));
    res.cookies.delete(SESSION_COOKIE);
    return res;
  }

  if (!session.hasChangedPassword && !isChangePassword(pathname)) {
    return NextResponse.redirect(new URL(CHANGE_PASSWORD_PATH, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/auth/change-password'],
  runtime: 'nodejs',
};
