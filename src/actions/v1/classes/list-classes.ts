'use server';

import { api } from '@/lib/axios';
import type { IListClassesParams, IListClassesResult } from '@/types/actions/class-management';

export async function listClasses(params: IListClassesParams): Promise<IListClassesResult> {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null),
  );
  try {
    const res = await api.get('/api/v1/classes', { params: cleaned });
    return res.data as IListClassesResult;
  } catch {
    return { data: [], meta: { total: 0, page: 1, pageSize: 20 } };
  }
}
