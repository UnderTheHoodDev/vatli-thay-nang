import 'server-only';
import { cache } from 'react';
import type { SessionInfo } from '@/types/auth';
import { api } from '@/lib/axios';
import { getSessionId } from '@/lib/auth/session';

export const getCurrentSession = cache(async (): Promise<SessionInfo | null> => {
  const sid = await getSessionId();
  if (!sid) return null;
  try {
    const res = await api.get<SessionInfo>('/api/v1/me');
    return res.data;
  } catch {
    return null;
  }
});
