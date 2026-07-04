export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type LessonItemType = 'VIDEO' | 'DOCUMENT';
export type CourseEnrollmentStatus = 'ACTIVE' | 'REVOKED';
export type StorageFolder = 'course-thumbnails' | 'lesson-documents' | 'lesson-videos';
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

export interface CourseRow {
  id: number;
  code: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  price: number;
  status: CourseStatus;
  totalChapters: number;
  totalLessons: number;
  previewLessonCount: number;
  startDate: string | null;
  endDate: string | null;
  enrollmentDeadline: string | null;
  category: CourseCategoryBrief;
  instructor: CourseInstructor;
  enrollmentCount: number;
  isEnrolled?: boolean;
}

export interface LessonItemTree {
  id: number;
  title: string;
  type: LessonItemType;
  order: number;
  durationSeconds: number | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  videoUrl: string | null;
  videoStorageKey: string | null;
  bunnyVideoId: string | null;
  bunnyLibraryId: number | null;
  bunnyStatus: BunnyVideoStatus;
  thumbnailUrl: string | null;
  fileUrl: string | null;
  fileStorageKey: string | null;
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

export interface CourseStudentStatsLesson {
  lessonItemId: number;
  lessonItemTitle: string;
  chapterTitle: string;
  chapterOrder: number;
  lessonTitle: string;
  lessonOrder: number;
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
  lessons: CourseStudentStatsLesson[];
}

export interface VideoProgressInfo {
  totalWatchedSec: number;
  lastPositionSec: number;
  viewCount: number;
  lastViewedAt: string | null;
}

export interface LessonTree {
  id: number;
  title: string;
  description: string | null;
  order: number;
  isPreview: boolean;
  itemCount: number;
  items: LessonItemTree[];
}

export interface ChapterTree {
  id: number;
  title: string;
  description: string | null;
  order: number;
  lessons: LessonTree[];
}

export interface CourseDetail extends CourseRow {
  thumbnailStorageKey?: string | null;
  instructorBio: string | null;
  targetAudience: string | null;
  learningOutcomes: string | null;
  publishedAt: string | null;
  createdAt: string;
  chapters: ChapterTree[];
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

export interface LessonDetail {
  id: number;
  title: string;
  description: string | null;
  order: number;
  isPreview: boolean;
  chapter: {
    id: number;
    title: string;
    order: number;
    courseId: number;
  };
  course: {
    id: number;
    title: string;
    status: CourseStatus;
  };
  items: LessonItemTree[];
}

export const COURSE_STATUS_LABEL: Record<CourseStatus, string> = {
  DRAFT: 'Bản nháp',
  PUBLISHED: 'Đang phát hành',
  ARCHIVED: 'Đã lưu trữ',
};

export const LESSON_ITEM_TYPE_LABEL: Record<LessonItemType, string> = {
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

/** Bài học để resume khi học sinh vào khóa (trả từ GET /courses/:id/resume). */
export interface CourseResume {
  lessonItemId: number | null;
  lessonId: number | null;
}
