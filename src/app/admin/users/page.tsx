import { listUsers } from '@/actions/v1/users/list-users';
import { listProvinces } from '@/actions/v1/provinces';
import { ALL_VALUE } from '@/lib/constants';
import UsersPageClient, { type UrlState } from './UsersPageClient';

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

export default async function UsersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const urlState = readUrlState(sp);

  const apiParams = {
    email: urlState.email || undefined,
    fullName: urlState.fullName || undefined,
    gender: urlState.gender !== ALL_VALUE ? urlState.gender : undefined,
    provinceId: urlState.provinceId !== ALL_VALUE ? Number(urlState.provinceId) : undefined,
    schoolName: urlState.schoolName || undefined,
    parentPhonenumber: urlState.parentPhonenumber || undefined,
    role: urlState.role !== ALL_VALUE ? urlState.role : undefined,
    status: urlState.status !== ALL_VALUE ? urlState.status : undefined,
    page: urlState.page,
    pageSize: urlState.pageSize,
  };

  const [usersRes, provinces] = await Promise.all([listUsers(apiParams), listProvinces()]);

  return (
    <UsersPageClient
      urlState={urlState}
      rows={usersRes.data}
      meta={usersRes.meta}
      provinces={provinces}
    />
  );
}
