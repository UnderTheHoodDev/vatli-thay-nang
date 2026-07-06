'use server';

import { api } from '@/lib/axios';
import type { IListUsersParams, IListUsersResult } from '@/types/actions/users';

export async function listUsers(params: IListUsersParams): Promise<IListUsersResult> {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null),
  );
  try {
    const res = await api.get('/api/v1/users', { params: cleaned });
    return res.data as IListUsersResult;
  } catch {
    return {
      data: [],
      meta: { total: 0, page: 1, pageSize: 20 },
      stats: { total: 0, activated: 0, unactivated: 0, disabled: 0, admins: 0, students: 0 },
    };
  }
}
