'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import type { ClassDetail } from '@/types/class-management';

export async function getClass(id: number): Promise<ClassDetail | null> {
  try {
    const res = await api.get(`/api/v1/classes/${id}`);
    return (res.data as { data: ClassDetail }).data;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}
