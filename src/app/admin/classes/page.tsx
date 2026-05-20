import { listClasses } from '@/actions/v1/classes/list-classes';
import { ALL_VALUE } from '@/lib/constants';
import type { ClassStatus } from '@/types/class-management';
import ClassesPageClient, { type UrlState } from './ClassesPageClient';

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

function readUrlState(sp: Record<string, string | undefined>): UrlState {
  return {
    name: sp.name ?? '',
    code: sp.code ?? '',
    status: sp.status ?? ALL_VALUE,
    page: Number(sp.page) || 1,
    pageSize: Number(sp.pageSize) || 20,
  };
}

export default async function ClassesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const urlState = readUrlState(sp);

  const apiParams = {
    name: urlState.name || undefined,
    code: urlState.code || undefined,
    status: urlState.status !== ALL_VALUE ? (urlState.status as ClassStatus) : undefined,
    page: urlState.page,
    pageSize: urlState.pageSize,
  };

  const result = await listClasses(apiParams);

  return (
    <ClassesPageClient
      urlState={urlState}
      rows={result.data}
      meta={result.meta}
      errors={result.errors}
    />
  );
}
