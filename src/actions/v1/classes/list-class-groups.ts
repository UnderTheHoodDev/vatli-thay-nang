'use server';

import { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import { extractErrors } from '@/lib/errors';
import type { IListClassGroupsResult } from '@/types/actions/class-management';

export interface ListClassGroupsResponse extends IListClassGroupsResult {
  errors: string[];
}

export async function listClassGroups(classId: number): Promise<ListClassGroupsResponse> {
  try {
    const res = await api.get(`/api/v1/classes/${classId}/groups`);
    const result = res.data as IListClassGroupsResult;
    return { data: result.data, errors: [] };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return { data: [], errors: extractErrors(error.response.data) };
    }
    return { data: [], errors: ['Lấy danh sách nhóm thất bại'] };
  }
}
