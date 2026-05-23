'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import type { ClassSessionDetail } from '@/types/actions/class-management';

export async function getClassSession(id: number): Promise<ClassSessionDetail | null> {
  try {
    const res = await api.get(`/api/v1/class-sessions/${id}`);
    return (res.data as { data: ClassSessionDetail }).data;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}
