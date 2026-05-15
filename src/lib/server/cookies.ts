import 'server-only';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const SESSION_COOKIE = 'session_id';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

const SESSION_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_MAX_AGE,
};

export function setSessionCookie(res: NextResponse, sessionId: string) {
  res.cookies.set(SESSION_COOKIE, sessionId, SESSION_OPTIONS);
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.delete(SESSION_COOKIE);
}

export async function setSessionCookieInAction(sessionId: string) {
  (await cookies()).set(SESSION_COOKIE, sessionId, SESSION_OPTIONS);
}

export async function clearSessionCookieInAction() {
  (await cookies()).delete(SESSION_COOKIE);
}
