'use server';

import { api } from '@/lib/axios';
import type { IListClassStudentsParams, IListClassStudentsResult } from '@/types/actions/classes';

export async function listClassStudents(
  classId: number,
  params: IListClassStudentsParams,
): Promise<IListClassStudentsResult> {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null),
  );
  try {
    const res = await api.get(`/api/v1/classes/${classId}/students`, { params: cleaned });
    return res.data as IListClassStudentsResult;
  } catch {
    return { data: [], meta: { total: 0, page: 1, pageSize: 20 } };
  }
}
