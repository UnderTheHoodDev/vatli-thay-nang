import type { ListMeta } from '@/types/auth';
import type {
  BunnyVideoStatus,
  CourseCategoryRow,
  CourseDetail,
  CourseEnrollmentRow,
  CourseEnrollmentStatus,
  CourseFileKind,
  CourseNodeType,
  CourseRow,
  CourseStatus,
  StorageFolder,
} from '@/types/course-management';

export interface CoursesListStats {
  total: number;
  draft: number;
  published: number;
  archived: number;
}

export interface IListCourseCategoriesParams {
  name?: string;
  page?: number;
  pageSize?: number;
}

export interface IListCourseCategoriesResult {
  data: CourseCategoryRow[];
  meta: ListMeta;
}

export interface ICreateCourseCategoryPayload {
  name: string;
  slug: string;
  description?: string;
  order?: number;
}

export interface IUpdateCourseCategoryPayload {
  name?: string;
  slug?: string;
  description?: string;
  order?: number;
}

export interface IListCoursesParams {
  title?: string;
  code?: string;
  categoryId?: number;
  status?: CourseStatus;
  instructorId?: number;
  page?: number;
  pageSize?: number;
}

export interface IListCoursesResult {
  data: CourseRow[];
  meta: ListMeta;
  stats: CoursesListStats;
}

export interface ICreateCoursePayload {
  code: string;
  title: string;
  categoryId: number;
  instructorId: number;
  description?: string;
  thumbnailUrl?: string;
  thumbnailStorageKey?: string;
  instructorBio?: string;
  price?: number;
  startDate?: string;
  endDate?: string;
  enrollmentDeadline?: string;
  targetAudience?: string;
  learningOutcomes?: string;
  status?: CourseStatus;
}

export interface IUpdateCoursePayload {
  code?: string;
  title?: string;
  categoryId?: number;
  instructorId?: number;
  description?: string;
  thumbnailUrl?: string;
  thumbnailStorageKey?: string;
  instructorBio?: string;
  price?: number;
  startDate?: string | null;
  endDate?: string | null;
  enrollmentDeadline?: string | null;
  targetAudience?: string;
  learningOutcomes?: string;
  status?: CourseStatus;
}

export interface IListEnrollmentsParams {
  email?: string;
  fullName?: string;
  status?: CourseEnrollmentStatus;
  page?: number;
  pageSize?: number;
}

export interface IListEnrollmentsResult {
  data: CourseEnrollmentRow[];
  meta: ListMeta;
}

export interface IAddEnrollmentsPayload {
  studentIds: number[];
}

/** Tạo folder hoặc tệp (video/tài liệu) trong cây khóa học. */
export interface ICreateCourseNodePayload {
  parentId?: number;
  type: CourseNodeType;
  title: string;
  fileKind?: CourseFileKind;
  // video (bunny)
  videoUrl?: string;
  bunnyVideoId?: string;
  bunnyLibraryId?: number;
  durationSeconds?: number;
  // tài liệu (R2)
  fileUrl?: string;
  fileStorageKey?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

/** Đổi tên / thay tệp của node (đổi cấp folder đi qua move). */
export interface IUpdateCourseNodePayload {
  title?: string;
  videoUrl?: string;
  bunnyVideoId?: string;
  bunnyLibraryId?: number;
  durationSeconds?: number;
  fileUrl?: string;
  fileStorageKey?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

/** Sắp xếp lại thứ tự node trong cùng folder (parentId null = nhóm gốc). */
export interface IReorderCourseNodesPayload {
  parentId?: number;
  items: Array<{ id: number; order: number }>;
}

/** Kéo-thả node sang folder khác. newParentId null = ra gốc. */
export interface IMoveCourseNodePayload {
  newParentId?: number | null;
  newOrder?: number;
}

export interface IGetBunnyUploadUrlPayload {
  title: string;
}

export interface IGetBunnyUploadUrlResult {
  videoId: string;
  libraryId: number;
  uploadUrl: string;
  accessKey: string;
  embedUrl: string;
}

export interface IGetBunnyTusUploadPayload {
  title: string;
  /** GUID video đã tồn tại — ký lại để resume (không tạo mới). */
  videoId?: string;
}

export interface IGetBunnyTusUploadResult {
  videoId: string;
  libraryId: number;
  signature: string;
  expire: number;
  tusEndpoint: string;
}

export interface IBunnyVideoStatus {
  videoId: string;
  status: 'QUEUED' | 'PROCESSING' | 'FINISHED' | 'ERROR';
  durationSeconds: number | null;
  thumbnailUrl: string | null;
}

export interface ICourseVideoStatusItem {
  nodeId: number;
  bunnyStatus: BunnyVideoStatus;
  durationSeconds: number | null;
  thumbnailUrl: string | null;
}

export interface ICourseVideoStatusResult {
  items: ICourseVideoStatusItem[];
  pending: number;
  allSettled: boolean;
}

interface GetUploadUrlBase {
  fileName: string;
  mimeType: string;
  /** BẮT BUỘC: BE ký fileSize vào ContentLength của presigned URL. */
  fileSize: number;
}

/**
 * Union chứ không phải `testId?: number`: BE bắt buộc testId khi nộp bài (cần biết bài
 * nào để kiểm tra ghi danh + bài có đang mở không). Để optional thì quên là 400 lúc
 * chạy — ép ở kiểu để TypeScript chặn ngay.
 */
export type IGetUploadUrlPayload =
  | (GetUploadUrlBase & { folder: 'test-submissions'; testId: number })
  | (GetUploadUrlBase & {
      folder: Exclude<StorageFolder, 'test-submissions'>;
      testId?: never;
    });

export interface IGetUploadUrlResult {
  url: string;
  storageKey: string;
  publicUrl: string;
  /**
   * Content-Type ĐÃ ĐƯỢC KÝ vào URL — phải PUT lên R2 đúng bằng giá trị này.
   *
   * BE tự suy Content-Type từ đuôi file khi browser trả File.type rỗng /
   * application/octet-stream. Client gửi lại giá trị của mình thì chữ ký sai và R2
   * từ chối request.
   */
  contentType: string;
  expiresIn: number;
}

export type { CourseDetail };
