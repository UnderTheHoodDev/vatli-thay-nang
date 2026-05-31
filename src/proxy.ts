import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'session_id';
const LOGIN_PATH = '/auth/login';
const GATED_PATHS = ['/admin', '/dashboard', '/auth/change-password'];

function isGated(pathname: string): boolean {
  return GATED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const sessionId = request.cookies.get(SESSION_COOKIE)?.value;

  if (isGated(pathname) && !sessionId) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  return NextResponse.next();
}

export const matcher = [
  '/admin/:path*',
  '/dashboard/:path*',
  '/auth/change-password',
  '/auth/login',
];
