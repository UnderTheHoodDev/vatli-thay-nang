'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type {
  ClassSessionListRowWithClass,
  IListAllClassSessionsParams,
  IListAllClassSessionsResult,
} from '@/types/actions/class-management';
import type { ListMeta } from '@/types/auth';

const EMPTY_META: ListMeta = { total: 0, page: 1, pageSize: 20 };

export interface ListAllClassSessionsResponse {
  data: ClassSessionListRowWithClass[];
  meta: ListMeta;
  errors: string[];
}

export async function listAllClassSessions(
  params: IListAllClassSessionsParams,
): Promise<ListAllClassSessionsResponse> {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null),
  );
  try {
    const res = await api.get('/api/v1/class-sessions', { params: cleaned });
    const result = res.data as IListAllClassSessionsResult;
    return { data: result.data, meta: result.meta, errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { data: [], meta: EMPTY_META, errors: extractErrors(error.response.data) };
    }
    return { data: [], meta: EMPTY_META, errors: ['Lấy danh sách buổi học thất bại'] };
  }
}
