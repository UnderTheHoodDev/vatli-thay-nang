import { listClasses } from '@/actions/v1/classes/list-classes';
import { listTuitionOverview } from '@/actions/v1/tuition/list-tuition-overview';
import { listTuitionOverviewChart } from '@/actions/v1/tuition/list-tuition-overview-chart';
import { shiftMonth, vnCurrentYearMonth } from '@/lib/format';
import TuitionOverviewPageClient, { type TuitionOverviewUrlState } from './TuitionOverviewPageClient';

/** Mặc định 12 tháng: 11 tháng trước + tháng hiện tại. */
const DEFAULT_RANGE_MONTHS = 12;

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

function pickYear(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 2000 && n <= 2100 ? n : fallback;
}

function pickMonth(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= 12 ? n : fallback;
}

function pickClassId(raw: string | undefined): number | undefined {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

function readUrlState(
  sp: Record<string, string | undefined>,
  fallback: {
    fromYear: number;
    fromMonth: number;
    toYear: number;
    toMonth: number;
    listYear: number;
    listMonth: number;
  },
): TuitionOverviewUrlState {
  const page = Number(sp.page);
  const pageSize = Number(sp.pageSize);
  return {
    fromYear: pickYear(sp.fromYear, fallback.fromYear),
    fromMonth: pickMonth(sp.fromMonth, fallback.fromMonth),
    toYear: pickYear(sp.toYear, fallback.toYear),
    toMonth: pickMonth(sp.toMonth, fallback.toMonth),
    listYear: pickYear(sp.listYear, fallback.listYear),
    listMonth: pickMonth(sp.listMonth, fallback.listMonth),
    chartClassId: pickClassId(sp.chartClassId),
    listClassId: pickClassId(sp.listClassId),
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    pageSize: Number.isInteger(pageSize) && pageSize >= 1 ? pageSize : 20,
  };
}

export default async function TuitionOverviewPage({ searchParams }: Props) {
  // "Bây giờ" chỉ được tính ở server rồi truyền xuống — xem doc ở src/lib/format.ts.
  const now = vnCurrentYearMonth();
  const defaultFrom = shiftMonth(now.year, now.month, -(DEFAULT_RANGE_MONTHS - 1));
  const urlState = readUrlState(await searchParams, {
    fromYear: defaultFrom.year,
    fromMonth: defaultFrom.month,
    toYear: now.year,
    toMonth: now.month,
    // Bảng "Danh sách các lớp" mặc định tháng hiện tại — độc lập với khoảng
    // fromYear/toYear của chart (xem yêu cầu tách bộ lọc riêng cho bảng).
    listYear: now.year,
    listMonth: now.month,
  });

  // Không await ngay — cả 2 promise được stream xuống qua Suspense/use(), nên
  // khởi động request trước khi chờ listClasses (cần resolve ngay cho bộ lọc).
  // Chỉ truyền đúng field mà DTO chart chấp nhận — ValidationPipe whitelist sẽ
  // từ chối cả request nếu lẫn page/pageSize của urlState vào.
  const chartPromise = listTuitionOverviewChart({
    fromYear: urlState.fromYear,
    fromMonth: urlState.fromMonth,
    toYear: urlState.toYear,
    toMonth: urlState.toMonth,
    classId: urlState.chartClassId,
  });
  const overviewPromise = listTuitionOverview({
    year: urlState.listYear,
    month: urlState.listMonth,
    classId: urlState.listClassId,
    page: urlState.page,
    pageSize: urlState.pageSize,
  });
  // Không await — chỉ 2 ô "Lớp" cần danh sách này, phần còn lại của trang
  // (tiêu đề, nhãn, bộ lọc tháng) không phụ thuộc nên không cần chờ.
  const classesPromise = listClasses({ page: 1, pageSize: 200 });

  return (
    <TuitionOverviewPageClient
      classesPromise={classesPromise}
      urlState={urlState}
      currentYear={now.year}
      chartPromise={chartPromise}
      overviewPromise={overviewPromise}
    />
  );
}
