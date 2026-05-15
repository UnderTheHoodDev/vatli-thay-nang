import 'server-only';
import type { SessionInfo } from '@/types/auth';
import { readSessionFromRedis } from '@/lib/redis';
import { getSessionId } from '@/lib/auth/session';

export async function getCurrentSession(): Promise<SessionInfo | null> {
  const sessionId = await getSessionId();
  if (!sessionId) return null;
  return readSessionFromRedis(sessionId);
}
