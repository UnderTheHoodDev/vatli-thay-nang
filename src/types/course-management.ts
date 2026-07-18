export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type CourseNodeType = 'FOLDER' | 'FILE';
export type CourseFileKind = 'VIDEO' | 'DOCUMENT';
export type CourseEnrollmentStatus = 'ACTIVE' | 'REVOKED';
export type StorageFolder =
  | 'course-thumbnails'
  | 'lesson-documents'
  | 'lesson-videos'
  | 'test-attachments'
  | 'test-submissions';
export type BunnyVideoStatus = 'UPLOADING' | 'QUEUED' | 'PROCESSING' | 'FINISHED' | 'ERROR';

export interface CourseCategoryRow {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  order: number;
  courseCount?: number;
}

export interface CourseInstructor {
  id: number;
  fullName: string | null;
  email: string;
  avatarUrl?: string | null;
}

export interface CourseCategoryBrief {
  id: number;
  name: string;
  slug: string;
}

export interface PublicCourse {
  id: number;
  code: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  price: number;
  status: CourseStatus;
  startDate: string | null;
  endDate: string | null;
  enrollmentDeadline: string | null;
  category: CourseCategoryBrief;
}

export interface CourseRow {
  id: number;
  code: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  price: number;
  status: CourseStatus;
  nodeCount: number;
  startDate: string | null;
  endDate: string | null;
  enrollmentDeadline: string | null;
  category: CourseCategoryBrief;
  instructor: CourseInstructor;
  enrollmentCount: number;
  isEnrolled?: boolean;
}

/**
 * Node trong cây khóa học (Google Drive style). FOLDER chứa `children`; FILE là
 * video (bunny) hoặc tài liệu (R2), phân biệt bằng `fileKind`.
 */
export interface CourseNodeTree {
  id: number;
  parentId: number | null;
  type: CourseNodeType;
  title: string;
  order: number;
  fileKind: CourseFileKind | null;
  // video (bunny)
  durationSeconds: number | null;
  bunnyStatus: BunnyVideoStatus | null;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  bunnyVideoId: string | null;
  bunnyLibraryId: number | null;
  // tài liệu (R2)
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  fileUrl: string | null;
  fileStorageKey: string | null;
  // chỉ FOLDER
  children?: CourseNodeTree[];
}

export interface CourseStatsRow {
  studentId: number;
  email: string;
  fullName: string | null;
  enrolledAt: string;
  totalViewCount: number;
  totalWatchedSec: number;
  lastViewedAt: string | null;
}

/** Một tệp video trong drilldown thống kê, kèm đường dẫn folder cha. */
export interface CourseStudentStatsFile {
  nodeId: number;
  nodeTitle: string;
  /** Breadcrumb các folder cha (từ gốc → gần nhất). */
  pathTitles: string[];
  durationSeconds: number | null;
  viewCount: number;
  totalWatchedSec: number;
  lastPositionSec: number;
  lastViewedAt: string | null;
}

export interface CourseStudentStatsDetail {
  student: {
    id: number;
    email: string;
    fullName: string | null;
  };
  files: CourseStudentStatsFile[];
}

export interface VideoProgressInfo {
  totalWatchedSec: number;
  lastPositionSec: number;
  viewCount: number;
  lastViewedAt: string | null;
}

export interface CourseDetail extends CourseRow {
  thumbnailStorageKey?: string | null;
  instructorBio: string | null;
  targetAudience: string | null;
  learningOutcomes: string | null;
  publishedAt: string | null;
  createdAt: string;
  /** Node gốc của cây khóa học (đã redact theo quyền). */
  nodes: CourseNodeTree[];
}

export interface CourseEnrollmentRow {
  id: number;
  studentId: number;
  email: string;
  fullName: string | null;
  status: CourseEnrollmentStatus;
  enrolledAt: string;
  revokedAt: string | null;
}

export const COURSE_STATUS_LABEL: Record<CourseStatus, string> = {
  DRAFT: 'Bản nháp',
  PUBLISHED: 'Đang phát hành',
  ARCHIVED: 'Đã lưu trữ',
};

export const COURSE_FILE_KIND_LABEL: Record<CourseFileKind, string> = {
  VIDEO: 'Video',
  DOCUMENT: 'Tài liệu',
};

export const COURSE_STATUS_OPTIONS = [
  { value: 'DRAFT', label: COURSE_STATUS_LABEL.DRAFT },
  { value: 'PUBLISHED', label: COURSE_STATUS_LABEL.PUBLISHED },
  { value: 'ARCHIVED', label: COURSE_STATUS_LABEL.ARCHIVED },
] as const;

type BadgeVariant = 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';

/** Nguồn duy nhất cho label + màu badge của trạng thái xử lý video bunny. */
export const BUNNY_STATUS_META: Record<
  BunnyVideoStatus,
  { label: string; variant: BadgeVariant; pending: boolean }
> = {
  UPLOADING: { label: 'Đang tải lên', variant: 'secondary', pending: true },
  QUEUED: { label: 'Đang chờ xử lý', variant: 'secondary', pending: true },
  PROCESSING: { label: 'Đang xử lý', variant: 'warning', pending: true },
  FINISHED: { label: 'Sẵn sàng', variant: 'success', pending: false },
  ERROR: { label: 'Lỗi xử lý', variant: 'destructive', pending: false },
};

/** Node để resume khi học sinh vào khóa (trả từ GET /courses/:id/resume). */
export interface CourseResume {
  nodeId: number | null;
}
