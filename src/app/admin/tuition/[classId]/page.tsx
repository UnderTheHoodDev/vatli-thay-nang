import { notFound } from 'next/navigation';
import { getClass } from '@/actions/v1/classes/get-class';
import { listTuition } from '@/actions/v1/tuition/list-tuition';
import { vnCurrentYearMonth } from '@/lib/format';
import TuitionPageClient, { type TuitionUrlState } from './TuitionPageClient';

interface Props {
  params: Promise<{ classId: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

function readUrlState(
  sp: Record<string, string | undefined>,
  fallback: { year: number; month: number },
): TuitionUrlState {
  const year = Number(sp.year);
  const month = Number(sp.month);
  return {
    year: Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : fallback.year,
    month: Number.isInteger(month) && month >= 1 && month <= 12 ? month : fallback.month,
  };
}

export default async function TuitionByClassPage({ params, searchParams }: Props) {
  const { classId: raw } = await params;
  const classId = Number(raw);
  if (!Number.isInteger(classId) || classId <= 0) notFound();

  const classDetail = await getClass(classId);
  if (!classDetail) notFound();

  // "Bây giờ" chỉ được tính ở server rồi truyền xuống — client không bao giờ gọi
  // new Date() để suy ra tháng mặc định (xem doc ở src/lib/format.ts).
  const now = vnCurrentYearMonth();
  const urlState = readUrlState(await searchParams, now);

  const tuitionPromise = listTuition({ classId, year: urlState.year, month: urlState.month });

  return (
    <TuitionPageClient
      classDetail={classDetail}
      urlState={urlState}
      currentYear={now.year}
      tuitionPromise={tuitionPromise}
    />
  );
}
