import { listUsers } from '@/actions/v1/users/list-users';
import { listProvinces } from '@/actions/v1/provinces';
import { ALL_VALUE } from '@/lib/constants';
import type { Gender, Role, UserStatus } from '@/types/auth';
import UsersPageClient, { type UrlState } from '@/app/admin/users/UsersPageClient';

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

function readUrlState(sp: Record<string, string | undefined>): UrlState {
  return {
    email: sp.email ?? '',
    fullName: sp.fullName ?? '',
    gender: sp.gender ?? ALL_VALUE,
    provinceId: sp.provinceId ?? ALL_VALUE,
    schoolName: sp.schoolName ?? '',
    parentPhonenumber: sp.parentPhonenumber ?? '',
    role: sp.role ?? ALL_VALUE,
    status: sp.status ?? ALL_VALUE,
    page: Number(sp.page) || 1,
    pageSize: Number(sp.pageSize) || 20,
  };
}

export default async function AccountsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const urlState = readUrlState(sp);

  const apiParams = {
    email: urlState.email || undefined,
    fullName: urlState.fullName || undefined,
    gender: urlState.gender !== ALL_VALUE ? (urlState.gender as Gender) : undefined,
    provinceId: urlState.provinceId !== ALL_VALUE ? Number(urlState.provinceId) : undefined,
    schoolName: urlState.schoolName || undefined,
    parentPhonenumber: urlState.parentPhonenumber || undefined,
    role: urlState.role !== ALL_VALUE ? (urlState.role as Role) : undefined,
    status: urlState.status !== ALL_VALUE ? (urlState.status as UserStatus) : undefined,
    page: urlState.page,
    pageSize: urlState.pageSize,
  };

  const [usersRes, provinces] = await Promise.all([listUsers(apiParams), listProvinces()]);

  return (
    <UsersPageClient
      urlState={urlState}
      rows={usersRes.data}
      meta={usersRes.meta}
      stats={usersRes.stats}
      provinces={provinces}
    />
  );
}
