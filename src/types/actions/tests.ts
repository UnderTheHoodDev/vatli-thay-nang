import type {
  AdminTestRow,
  ExportFormat,
  PageMeta,
  StudentTestRow,
  SubmissionFilterStatus,
  SubmissionRow,
  TestFilePayload,
  TestStats,
} from '@/types/tests';

export interface IListTestsParams {
  page?: number;
  pageSize?: number;
}

export interface IListTestsResult<T = AdminTestRow | StudentTestRow> {
  data: T[];
  meta: PageMeta;
}

export interface ICreateTestPayload {
  title: string;
  description?: string;
  /** ISO 8601. BE chặn nếu endTime <= startTime. */
  startTime: string;
  endTime: string;
  /** 0.01 … 999.99 (Decimal(5,2) ở BE). */
  maxScore: number;
  attachments?: TestFilePayload[];
}

/** attachments là danh sách ĐẦY ĐỦ mới — BE diff để xoá file bị bỏ khỏi R2. */
export type IUpdateTestPayload = Partial<ICreateTestPayload>;

export interface IUpsertSubmissionPayload {
  note?: string;
  /** Tối đa 30 file, ít nhất 1. */
  files: TestFilePayload[];
}

export interface IGradeSubmissionPayload {
  score: number;
  feedback?: string;
}

export interface IListSubmissionsParams {
  page?: number;
  pageSize?: number;
  status?: SubmissionFilterStatus;
}

export interface IListSubmissionsResult {
  data: SubmissionRow[];
  meta: PageMeta;
  stats: TestStats;
}

export interface IExportSubmissionsParams {
  format: ExportFormat;
}
