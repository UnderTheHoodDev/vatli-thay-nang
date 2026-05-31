'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActionButton } from '@/components/ui/custom';
import { handleActionResult, handleActionErrors } from '@/lib/actions';
import { createCourseAction } from '@/actions/v1/courses/create-course';
import { updateCourseAction } from '@/actions/v1/courses/update-course';
import { listUsers } from '@/actions/v1/users/list-users';
import ThumbnailUploader, { type ThumbnailValue } from './ThumbnailUploader';
import type { CourseCategoryRow, CourseDetail, CourseStatus } from '@/types/course-management';
import { COURSE_STATUS_OPTIONS } from '@/types/course-management';
import type { UserRow } from '@/types/auth';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  categories: CourseCategoryRow[];
  initialData?: CourseDetail;
}

interface FormState {
  code: string;
  title: string;
  categoryId: string;
  instructorId: string;
  description: string;
  thumbnail: ThumbnailValue | null;
  price: string;
  startDate: string;
  endDate: string;
  enrollmentDeadline: string;
  targetAudience: string;
  learningOutcomes: string;
  instructorBio: string;
  previewLessonCount: string;
  status: CourseStatus;
}

function emptyForm(): FormState {
  return {
    code: '',
    title: '',
    categoryId: '',
    instructorId: '',
    description: '',
    thumbnail: null,
    price: '0',
    startDate: '',
    endDate: '',
    enrollmentDeadline: '',
    targetAudience: '',
    learningOutcomes: '',
    instructorBio: '',
    previewLessonCount: '3',
    status: 'DRAFT',
  };
}

function toDateInput(value: string | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function fromForm(initial: CourseDetail | undefined): FormState {
  if (!initial) return emptyForm();
  return {
    code: initial.code,
    title: initial.title,
    categoryId: String(initial.category?.id ?? ''),
    instructorId: String(initial.instructor?.id ?? ''),
    description: initial.description ?? '',
    thumbnail:
      initial.thumbnailUrl || initial.thumbnailStorageKey
        ? {
            url: initial.thumbnailUrl ?? undefined,
            storageKey: initial.thumbnailStorageKey ?? undefined,
          }
        : null,
    price: String(initial.price ?? 0),
    startDate: toDateInput(initial.startDate),
    endDate: toDateInput(initial.endDate),
    enrollmentDeadline: toDateInput(initial.enrollmentDeadline),
    targetAudience: initial.targetAudience ?? '',
    learningOutcomes: initial.learningOutcomes ?? '',
    instructorBio: initial.instructorBio ?? '',
    previewLessonCount: String(initial.previewLessonCount ?? 3),
    status: initial.status,
  };
}

export default function CourseFormModal({
  open,
  onOpenChange,
  mode,
  categories,
  initialData,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<'info' | 'detail'>('info');
  const [form, setForm] = useState<FormState>(() => fromForm(initialData));
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [instructors, setInstructors] = useState<UserRow[]>([]);
  const [instructorsLoading, setInstructorsLoading] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return;
    setForm(fromForm(initialData));
    setSubmitted(false);
    setTab('info');
  }, [open, initialData]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setInstructorsLoading(true);
    listUsers({ role: 'ADMIN', pageSize: 200 })
      .then((res) => {
        if (!cancelled) setInstructors(res.data);
      })
      .finally(() => {
        if (!cancelled) setInstructorsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const codeError = submitted && !form.code.trim() ? 'Vui lòng nhập mã khóa học' : '';
  const titleError = submitted && !form.title.trim() ? 'Vui lòng nhập tên khóa học' : '';
  const categoryError = submitted && !form.categoryId ? 'Vui lòng chọn danh mục' : '';
  const instructorError = submitted && !form.instructorId ? 'Vui lòng chọn giảng viên' : '';

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!form.code.trim() || !form.title.trim() || !form.categoryId || !form.instructorId) {
      setTab('info');
      return;
    }

    const basePayload = {
      code: form.code.trim(),
      title: form.title.trim(),
      categoryId: Number(form.categoryId),
      instructorId: Number(form.instructorId),
      description: form.description.trim() || undefined,
      thumbnailUrl: form.thumbnail?.url || undefined,
      thumbnailStorageKey: form.thumbnail?.storageKey || undefined,
      instructorBio: form.instructorBio.trim() || undefined,
      price: form.price ? Number(form.price) : undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      enrollmentDeadline: form.enrollmentDeadline || undefined,
      targetAudience: form.targetAudience.trim() || undefined,
      learningOutcomes: form.learningOutcomes.trim() || undefined,
      previewLessonCount: form.previewLessonCount ? Number(form.previewLessonCount) : undefined,
    };

    setSubmitting(true);
    try {
      if (mode === 'create') {
        const res = await createCourseAction(basePayload);
        if (res.errors.length) {
          handleActionErrors(res.errors);
          return;
        }
        handleActionResult([], undefined, 'Tạo khóa học thành công');
        onOpenChange(false);
        if (res.data?.id) {
          router.push(`/admin/courses/${res.data.id}`);
        } else {
          router.refresh();
        }
      } else if (initialData) {
        const res = await updateCourseAction(initialData.id, {
          ...basePayload,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          enrollmentDeadline: form.enrollmentDeadline || null,
          status: form.status,
        });
        handleActionResult(
          res.errors,
          () => {
            onOpenChange(false);
            router.refresh();
          },
          'Cập nhật khóa học thành công',
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!submitting) onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-2xl lg:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Tạo khóa học' : 'Chỉnh sửa khóa học'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Nhập thông tin để tạo khóa học mới.'
              : 'Cập nhật thông tin khóa học.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'info' | 'detail')}>
            <TabsList>
              <TabsTrigger value="info" className="cursor-pointer">
                Thông tin chính
              </TabsTrigger>
              <TabsTrigger value="detail" className="cursor-pointer">
                Chi tiết
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="course-code">
                    Mã khóa học <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="course-code"
                    placeholder="VD: VL12-2025"
                    maxLength={50}
                    value={form.code}
                    onChange={(e) => set('code', e.target.value)}
                    aria-invalid={!!codeError}
                  />
                  {codeError && <p className="text-destructive text-xs">{codeError}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="course-title">
                    Tên khóa học <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="course-title"
                    placeholder="VD: Vật lý 12 toàn tập"
                    maxLength={200}
                    value={form.title}
                    onChange={(e) => set('title', e.target.value)}
                    aria-invalid={!!titleError}
                  />
                  {titleError && <p className="text-destructive text-xs">{titleError}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>
                    Danh mục <span className="text-destructive">*</span>
                  </Label>
                  <Select value={form.categoryId} onValueChange={(v) => set('categoryId', v)}>
                    <SelectTrigger className="cursor-pointer" aria-invalid={!!categoryError}>
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {categoryError && <p className="text-destructive text-xs">{categoryError}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>
                    Giảng viên <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={form.instructorId}
                    onValueChange={(v) => set('instructorId', v)}
                    disabled={instructorsLoading}
                  >
                    <SelectTrigger className="cursor-pointer" aria-invalid={!!instructorError}>
                      <SelectValue
                        placeholder={instructorsLoading ? 'Đang tải...' : 'Chọn giảng viên'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {instructors.map((u) => (
                        <SelectItem key={u.id} value={String(u.id)}>
                          {u.fullName ?? u.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {instructorError && <p className="text-destructive text-xs">{instructorError}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="course-desc">Mô tả</Label>
                <Textarea
                  id="course-desc"
                  rows={3}
                  placeholder="Mô tả ngắn về khóa học"
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Ảnh đại diện</Label>
                <ThumbnailUploader
                  value={form.thumbnail}
                  onChange={(v) => set('thumbnail', v)}
                  disabled={submitting}
                />
              </div>
            </TabsContent>

            <TabsContent value="detail" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="course-price">Học phí (VNĐ)</Label>
                  <Input
                    id="course-price"
                    type="number"
                    min={0}
                    step={1000}
                    value={form.price}
                    onChange={(e) => set('price', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="course-preview-count">Số bài học preview</Label>
                  <Input
                    id="course-preview-count"
                    type="number"
                    min={0}
                    value={form.previewLessonCount}
                    onChange={(e) => set('previewLessonCount', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="course-start">Ngày bắt đầu</Label>
                  <Input
                    id="course-start"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => set('startDate', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="course-end">Ngày kết thúc</Label>
                  <Input
                    id="course-end"
                    type="date"
                    value={form.endDate}
                    onChange={(e) => set('endDate', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="course-deadline">Hạn ghi danh</Label>
                  <Input
                    id="course-deadline"
                    type="date"
                    value={form.enrollmentDeadline}
                    onChange={(e) => set('enrollmentDeadline', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="course-audience">Đối tượng học viên</Label>
                <Textarea
                  id="course-audience"
                  rows={2}
                  placeholder="VD: Học sinh lớp 12 chuẩn bị thi THPTQG"
                  value={form.targetAudience}
                  onChange={(e) => set('targetAudience', e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="course-outcomes">Mục tiêu đạt được</Label>
                <Textarea
                  id="course-outcomes"
                  rows={4}
                  placeholder="Mỗi dòng 1 mục"
                  value={form.learningOutcomes}
                  onChange={(e) => set('learningOutcomes', e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="course-bio">Giới thiệu giảng viên</Label>
                <Textarea
                  id="course-bio"
                  rows={3}
                  placeholder="Giới thiệu kinh nghiệm của giảng viên"
                  value={form.instructorBio}
                  onChange={(e) => set('instructorBio', e.target.value)}
                />
              </div>

              {mode === 'edit' && (
                <div className="space-y-1.5">
                  <Label>Trạng thái</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => set('status', v as CourseStatus)}
                  >
                    <SelectTrigger className="cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COURSE_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="cursor-pointer"
            >
              Huỷ
            </Button>
            <ActionButton
              type="submit"
              isLoading={submitting}
              loadingText="Đang lưu..."
              className="cursor-pointer"
            >
              {mode === 'create' ? 'Tạo khóa học' : 'Lưu thay đổi'}
            </ActionButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
