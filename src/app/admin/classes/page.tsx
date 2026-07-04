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
    createdFrom: sp.createdFrom ?? '',
    createdTo: sp.createdTo ?? '',
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
    createdFrom: urlState.createdFrom || undefined,
    createdTo: urlState.createdTo || undefined,
    page: urlState.page,
    pageSize: urlState.pageSize,
  };

  const [result, allClassesResult] = await Promise.all([
    listClasses(apiParams),
    listClasses({ page: 1, pageSize: 200 }),
  ]);

  return (
    <ClassesPageClient
      urlState={urlState}
      rows={result.data}
      meta={result.meta}
      stats={result.stats}
      errors={result.errors}
      allClasses={allClassesResult.data}
    />
  );
}
