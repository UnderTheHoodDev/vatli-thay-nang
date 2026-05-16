import 'server-only';

import { cookies } from 'next/headers';

const SESSION_COOKIE = 'session_id';

export async function getSessionId(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}
