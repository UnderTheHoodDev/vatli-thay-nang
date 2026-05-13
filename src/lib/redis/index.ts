import 'server-only';
import Redis from 'ioredis';
import type { SessionInfo } from '@/types/auth';

declare global {
  var __redis: Redis | undefined;
}

function getClient(): Redis {
  if (!global.__redis) {
    const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
    global.__redis = new Redis(url, {
      lazyConnect: false,
      maxRetriesPerRequest: 2,
    });
  }
  return global.__redis;
}

export async function readSessionFromRedis(
  sessionId: string,
): Promise<SessionInfo | null> {
  try {
    const raw = await getClient().get(`session:${sessionId}`);
    if (!raw) return null;
    return JSON.parse(raw) as SessionInfo;
  } catch {
    return null;
  }
}

export async function readActivationFromRedis(
  token: string,
): Promise<{ userId: number; email: string; role: string } | null> {
  try {
    const raw = await getClient().get(`activation:${token}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
