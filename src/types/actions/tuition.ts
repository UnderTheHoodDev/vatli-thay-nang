import type { TuitionStatus } from '@/types/tuition';

export interface TuitionListRow {
  id: number;
  studentId: number;
  fullName: string | null;
  email: string;
  amountDue: number;
  amountPaid: number;
  /** true = admin đã sửa tay `amountDue`; "Tính lại" sẽ không ghi đè. */
  isDueOverridden: boolean;
  status: TuitionStatus;
  paidDate: string | null;
  note: string | null;
  /** Số tự tính theo buổi học hiện có — dùng để phát hiện lệch (isOutOfSync). */
  computedAmountDue: number;
  /** Lệch so với số tự tính mà KHÔNG phải do sửa tay — nên bấm "Tính lại". */
  isOutOfSync: boolean;
  /** HS không còn thuộc diện tháng này (đã dời ngày vào học / nghỉ học). */
  outOfScope: boolean;
  updatedAt: string;
}

/** Không dùng `ListMeta` từ @/types/auth: bảng học phí không phân trang theo UI. */
export interface TuitionListMeta {
  total: number;
  page: number;
  pageSize: number;
}

export interface TuitionListStats {
  classId: number;
  year: number;
  month: number;
  sessionCount: number;
  studentCount: number;
  totalDue: number;
  totalPaid: number;
  totalRemaining: number;
  paidCount: number;
  /** Đóng thiếu — đã thu được một phần. */
  partialCount: number;
  /** Chưa đóng đồng nào — khác với đóng thiếu. */
  unpaidCount: number;
  /** Không phải đóng (miễn học phí, hoặc tháng chưa có buổi). */
  nothingDueCount: number;
  outOfSyncCount: number;
}

export interface IListTuitionParams {
  classId: number;
  year: number;
  month: number;
}

export interface IListTuitionResult {
  data: TuitionListRow[];
  meta: TuitionListMeta;
  stats: TuitionListStats;
}

export type IRecomputeTuitionParams = IListTuitionParams;

export interface IRecomputeTuitionResult {
  created: number;
  updated: number;
  skipped: number;
  removed: number;
}

export interface IUpdateTuitionPayload {
  amountDue?: number;
  amountPaid?: number;
  paidDate?: string | null;
  note?: string | null;
  /** Bỏ override, quay về số tự tính. Không gửi kèm `amountDue`. */
  clearOverride?: boolean;
}

export interface IBulkUpdateTuitionItem extends IUpdateTuitionPayload {
  id: number;
}

export interface IBulkUpdateTuitionParams {
  items: IBulkUpdateTuitionItem[];
}

export interface IBulkUpdateTuitionResult {
  updated: number;
}

export interface IListTuitionOverviewParams {
  year: number;
  month: number;
  /** Lọc bảng theo 1 lớp — không ảnh hưởng 2 thẻ thống kê tổng. */
  classId?: number;
  page?: number;
  pageSize?: number;
}

export interface TuitionOverviewRow {
  classId: number;
  code: string;
  name: string;
  studentCount: number;
  paidStudentCount: number;
  amountDueTotal: number;
  amountPaidTotal: number;
}

export interface TuitionOverviewStats {
  year: number;
  month: number;
  receivedThisMonth: number;
  receivedToDate: number;
}

// Chỉ dùng để kẹp UI (xem TuitionMonthRangeFilter) — chặn thật nằm ở BE
// (vltn-backend/src/tuition/tuition.service.ts). Đổi giá trị thì sửa cả 2 nơi.
export const MAX_CHART_MONTHS = 16;

export interface IListTuitionOverviewChartParams {
  fromYear: number;
  fromMonth: number;
  toYear: number;
  toMonth: number;
  /** Lọc theo 1 lớp — không lọc thì tính toàn bộ hệ thống. */
  classId?: number;
}

export interface TuitionChartMonthRow {
  year: number;
  month: number;
  studentCount: number;
  paidCount: number;
  partialCount: number;
  unpaidCount: number;
  nothingDueCount: number;
  amountDueTotal: number;
  amountPaidTotal: number;
}

export interface TuitionChartStats {
  fromYear: number;
  fromMonth: number;
  toYear: number;
  toMonth: number;
  totalDue: number;
  totalPaid: number;
  totalRemaining: number;
  /** % đã thu / phải thu trong cả khoảng, làm tròn. */
  collectionRate: number;
}

export interface IListTuitionOverviewChartResult {
  data: TuitionChartMonthRow[];
  stats: TuitionChartStats;
}

export interface IListTuitionOverviewResult {
  data: TuitionOverviewRow[];
  meta: TuitionListMeta;
  stats: TuitionOverviewStats;
}

export type TuitionExportMode = 'month' | 'range';

export interface IExportTuitionParams {
  classId: number;
  mode: TuitionExportMode;
  year: number;
  month: number;
  fromSessionId?: number;
  toSessionId?: number;
}

export interface TuitionImportSessionChange {
  sessionId: number;
  ticked: boolean;
}

export interface TuitionImportPreviewRow {
  studentId: number | null;
  email: string;
  fullName: string | null;
  matched: boolean;
  /** Chỉ chứa các buổi có thay đổi so với điểm danh hiện tại. */
  sessionChanges: TuitionImportSessionChange[];
  amountDue: number | null;
  amountPaid: number | null;
  paidDate: string | null;
  note: string | null;
  rowErrors: string[];
}

export interface TuitionImportSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
}

export interface IImportTuitionPreviewResult {
  rows: TuitionImportPreviewRow[];
  summary: TuitionImportSummary;
}

export interface IImportTuitionConfirmRow {
  studentId: number;
  sessionChanges?: TuitionImportSessionChange[];
  amountDue?: number;
  amountPaid?: number;
  paidDate?: string | null;
  note?: string | null;
}

export interface IImportTuitionConfirmParams {
  classId: number;
  year: number;
  month: number;
  rows: IImportTuitionConfirmRow[];
}

export interface IImportTuitionConfirmResult {
  updated: number;
}
