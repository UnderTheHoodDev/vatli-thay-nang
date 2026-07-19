'use server';

import { apiClient } from '@/lib/axios';
import type { IScheduleSettings } from '@/types/actions/schedule-settings';

export async function getScheduleSettings(): Promise<IScheduleSettings | null> {
  try {
    const res = await apiClient.get('/api/v1/schedule-settings');
    return (res.data?.data ?? null) as IScheduleSettings | null;
  } catch {
    return null;
  }
}
