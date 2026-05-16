'use client';

import { useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import UserSearchForm, { type UserSearchValues } from '@/components/features/users/UserSearchForm';
import UsersTable from '@/components/features/users/UsersTable';
import CreateUserDialog from '@/components/features/users/CreateUserDialog';
import { ALL_VALUE, PAGE_SIZE_OPTIONS } from '@/lib/constants';
import type { ListMeta, Province, UserRow } from '@/types/auth';

export interface UrlState extends UserSearchValues {
  page: number;
  pageSize: number;
}

interface Props {
  urlState: UrlState;
  rows: UserRow[];
  meta: ListMeta;
  provinces: Province[];
}

const SEARCH_KEYS: (keyof UserSearchValues)[] = [
  'email',
  'fullName',
  'gender',
  'provinceId',
  'schoolName',
  'parentPhonenumber',
  'role',
  'status',
];

function buildUrlParams(state: UrlState): URLSearchParams {
  const sp = new URLSearchParams();
  for (const key of SEARCH_KEYS) {
    const v = state[key];
    if (v && v !== ALL_VALUE && v !== '') sp.set(key, v);
  }
  if (state.page !== 1) sp.set('page', String(state.page));
  if (state.pageSize !== 20) sp.set('pageSize', String(state.pageSize));
  return sp;
}

export default function UsersPageClient({ urlState, rows, meta, provinces }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const updateUrl = useCallback(
    (next: Partial<UrlState>) => {
      const params = buildUrlParams({ ...urlState, ...next });
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [router, pathname, urlState],
  );

  const { page, pageSize } = urlState;
  const total = meta.total;
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-paytone text-purple text-2xl">Quản lý người dùng</h1>
      </div>

      <UserSearchForm
        provinces={provinces}
        initial={urlState}
        onSearch={(v) => updateUrl({ ...v, page: 1 })}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-gray-600">
          {total} học sinh: {start} ~ {end}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Hiển thị</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => updateUrl({ pageSize: Number(v), page: 1 })}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <CreateUserDialog />
        </div>
      </div>

      <UsersTable rows={rows} />

      <div className="flex items-center justify-end gap-3 pt-2">
        <div className="text-sm text-gray-500">
          Trang {page} / {totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={page === 1}
          onClick={() => updateUrl({ page: Math.max(1, page - 1) })}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => updateUrl({ page: page + 1 })}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
