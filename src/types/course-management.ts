export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type LessonItemType = 'VIDEO' | 'DOCUMENT';
export type CourseEnrollmentStatus = 'ACTIVE' | 'REVOKED';
export type StorageFolder =
  | 'course-thumbnails'
  | 'lesson-documents'
  | 'lesson-videos';

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
  fileUrl: string | null;
  fileStorageKey: string | null;
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
