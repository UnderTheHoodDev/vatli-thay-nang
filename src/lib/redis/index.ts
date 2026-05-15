import 'server-only';
import Redis, { type RedisOptions } from 'ioredis';
import type { SessionInfo } from '@/types/auth';

const isDevelopment = process.env.NODE_ENV === 'development';

const MAX_RETRY_ATTEMPTS = 10;
const DEFAULT_DATABASE = isDevelopment ? 0 : 1;
const CONNECT_TIMEOUT = 5000;
const MAX_RETRIES_PER_REQUEST = 3;
const MAX_RETRY_DELAY = 3000;

const getRedisConfig = (): RedisOptions => {
  const host = process.env.REDIS_HOST;
  const port = Number(process.env.REDIS_PORT);
  const password = process.env.REDIS_PASSWORD;

  const config: RedisOptions = {
    host,
    port,
    password,
    db: DEFAULT_DATABASE,
    retryStrategy: (times: number) => {
      return times > MAX_RETRY_ATTEMPTS ? null : Math.min(times * 100, MAX_RETRY_DELAY);
    },
    maxRetriesPerRequest: MAX_RETRIES_PER_REQUEST,
    connectTimeout: CONNECT_TIMEOUT,
    enableReadyCheck: true,
  };

  if (!isDevelopment) {
    config.tls = {
      rejectUnauthorized: true,
      ca: process.env.REDIS_TLS_CERTIFICATE,
    };
  }

  return config;
};

let redisClient: Redis | null = null;

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    redisClient = new Redis(getRedisConfig());

    redisClient.on('error', (error) => {
      console.error('Redis Client Error:', error);
    });

    redisClient.on('connect', () => {
      console.log('Redis Client Connected');
    });
  }

  return redisClient;
};

export async function readSessionFromRedis(sessionId: string): Promise<SessionInfo | null> {
  try {
    const raw = await getRedisClient().get(`session:${sessionId}`);
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
    const raw = await getRedisClient().get(`activation:${token}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const LOGIN_RATE_LIMIT_MAX = 5;
const LOGIN_RATE_LIMIT_WINDOW_SECONDS = 15 * 60;

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export async function checkLoginRateLimit(identifier: string): Promise<RateLimitResult> {
  try {
    const client = getRedisClient();
    const key = `ratelimit:login:${identifier}`;
    const count = await client.incr(key);
    if (count === 1) {
      await client.expire(key, LOGIN_RATE_LIMIT_WINDOW_SECONDS);
    }
    if (count > LOGIN_RATE_LIMIT_MAX) {
      const ttl = await client.ttl(key);
      return { allowed: false, retryAfterSeconds: ttl > 0 ? ttl : LOGIN_RATE_LIMIT_WINDOW_SECONDS };
    }
    return { allowed: true, retryAfterSeconds: 0 };
  } catch (error) {
    console.error('Login rate limit check failed; fail-open', error);
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

export async function resetLoginRateLimit(identifier: string): Promise<void> {
  try {
    await getRedisClient().del(`ratelimit:login:${identifier}`);
  } catch (error) {
    console.error('Failed to reset login rate limit counter', error);
  }
}
