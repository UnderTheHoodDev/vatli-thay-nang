import 'server-only';
import { cookies } from 'next/headers';
import type { SessionInfo } from '@/types/auth';
import { readSessionFromRedis } from '@/lib/redis';

export async function getCurrentSession(): Promise<SessionInfo | null> {
  const sessionId = (await cookies()).get('session_id')?.value;
  if (!sessionId) return null;
  return readSessionFromRedis(sessionId);
}
