import { listAllClassSessions } from '@/actions/v1/class-sessions/list-all-class-sessions';
import { listClasses } from '@/actions/v1/classes/list-classes';
import ClassSessionsAllPageClient, { type UrlState } from './ClassSessionsAllPageClient';

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

function readUrlState(sp: Record<string, string | undefined>): UrlState {
  return {
    classCode: sp.classCode ?? '',
    startDate: sp.startDate ?? '',
    endDate: sp.endDate ?? '',
    page: Number(sp.page) || 1,
    pageSize: Number(sp.pageSize) || 20,
  };
}

export default async function ClassSessionsAllPage({ searchParams }: Props) {
  const sp = await searchParams;
  const urlState = readUrlState(sp);

  const [result, allClassesResult] = await Promise.all([
    listAllClassSessions({
      classCode: urlState.classCode || undefined,
      startDate: urlState.startDate || undefined,
      endDate: urlState.endDate || undefined,
      page: urlState.page,
      pageSize: urlState.pageSize,
    }),
    listClasses({ page: 1, pageSize: 200 }),
  ]);

  return (
    <ClassSessionsAllPageClient
      urlState={urlState}
      rows={result.data}
      meta={result.meta}
      errors={result.errors}
      classes={allClassesResult.data}
    />
  );
}
