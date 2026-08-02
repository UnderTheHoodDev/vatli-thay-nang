import { listClasses } from '@/actions/v1/classes/list-classes';
import { listTuitionOverview } from '@/actions/v1/tuition/list-tuition-overview';
import { vnCurrentYearMonth } from '@/lib/format';
import TuitionOverviewPageClient, { type TuitionOverviewUrlState } from './TuitionOverviewPageClient';

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

function readUrlState(
  sp: Record<string, string | undefined>,
  fallback: { year: number; month: number },
): TuitionOverviewUrlState {
  const year = Number(sp.year);
  const month = Number(sp.month);
  const classId = Number(sp.classId);
  const page = Number(sp.page);
  const pageSize = Number(sp.pageSize);
  return {
    year: Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : fallback.year,
    month: Number.isInteger(month) && month >= 1 && month <= 12 ? month : fallback.month,
    classId: Number.isInteger(classId) && classId > 0 ? classId : undefined,
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    pageSize: Number.isInteger(pageSize) && pageSize >= 1 ? pageSize : 20,
  };
}

export default async function TuitionOverviewPage({ searchParams }: Props) {
  // "Bây giờ" chỉ được tính ở server rồi truyền xuống — xem doc ở src/lib/format.ts.
  const now = vnCurrentYearMonth();
  const urlState = readUrlState(await searchParams, now);

  // Không await ngay — overviewPromise được stream xuống qua Suspense/use(), nên
  // khởi động request trước khi chờ listClasses (cần resolve ngay cho bộ lọc).
  const overviewPromise = listTuitionOverview(urlState);
  const classesRes = await listClasses({ page: 1, pageSize: 200 });

  return (
    <TuitionOverviewPageClient
      classes={classesRes.data}
      urlState={urlState}
      currentYear={now.year}
      overviewPromise={overviewPromise}
    />
  );
}
