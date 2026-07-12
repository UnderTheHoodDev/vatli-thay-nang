'use client';

import { Suspense, use, useCallback, useEffect, useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { FolderTree, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ActionButton } from '@/components/ui/custom';
import PageHeader from '@/components/app/PageHeader';
import DataPagination from '@/components/app/DataPagination';
import EmptyState from '@/components/app/EmptyState';
import TableSkeleton from '@/components/app/TableSkeleton';
import { PAGE_SIZE_OPTIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { handleActionResult } from '@/lib/actions';
import { createCourseCategoryAction } from '@/actions/v1/course-categories/create-course-category';
import { updateCourseCategoryAction } from '@/actions/v1/course-categories/update-course-category';
import { deleteCourseCategoryAction } from '@/actions/v1/course-categories/delete-course-category';
import type { CourseCategoryRow } from '@/types/course-management';
import type { ListCourseCategoriesResponse } from '@/actions/v1/course-categories/list-course-categories';

export interface UrlState {
  name: string;
  page: number;
  pageSize: number;
}

interface Props {
  urlState: UrlState;
  categoriesPromise: Promise<ListCourseCategoriesResponse>;
}

function buildUrlParams(state: UrlState): URLSearchParams {
  const sp = new URLSearchParams();
  if (state.name) sp.set('name', state.name);
  if (state.page !== 1) sp.set('page', String(state.page));
  if (state.pageSize !== 20) sp.set('pageSize', String(state.pageSize));
  return sp;
}

const SKELETON_COLUMNS = ['w-8', 'w-44', 'w-32', 'w-56', 'w-14', 'w-14', 'w-20'];

interface CategoryFormState {
  name: string;
  slug: string;
  description: string;
  order: string;
}

const EMPTY_FORM: CategoryFormState = { name: '', slug: '', description: '', order: '0' };

function CategoriesResultSummary({
  promise,
  page,
  pageSize,
}: {
  promise: Promise<ListCourseCategoriesResponse>;
  page: number;
  pageSize: number;
}) {
  const { meta } = use(promise);
  const total = meta.total;
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return (
    <p className="text-muted-foreground mt-1 text-sm">
      {total === 0
        ? 'Chưa có danh mục nào'
        : `Hiển thị ${start}–${end} trên tổng ${total} danh mục`}
    </p>
  );
}

function CategoriesTableHead() {
  return (
    <TableHeader>
      <TableRow className="bg-muted/40 hover:bg-muted/40">
        <TableHead className="w-14">ID</TableHead>
        <TableHead>Tên</TableHead>
        <TableHead>Slug</TableHead>
        <TableHead>Mô tả</TableHead>
        <TableHead className="w-24 text-center">Khóa học</TableHead>
        <TableHead className="w-20 text-center">Thứ tự</TableHead>
        <TableHead className="w-32 text-right">Hành động</TableHead>
      </TableRow>
    </TableHeader>
  );
}

function CategoriesTableFallback() {
  return (
    <Table>
      <CategoriesTableHead />
      <TableBody>
        <TableSkeleton columnWidths={SKELETON_COLUMNS} />
      </TableBody>
    </Table>
  );
}

function CategoriesTableSection({
  promise,
  isPending,
  onCreate,
  onEdit,
  onDelete,
}: {
  promise: Promise<ListCourseCategoriesResponse>;
  isPending: boolean;
  onCreate: () => void;
  onEdit: (row: CourseCategoryRow) => void;
  onDelete: (row: CourseCategoryRow) => void;
}) {
  const { data: rows, errors } = use(promise);

  useEffect(() => {
    errors.forEach((e) => toast.error(e));
  }, [errors]);

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={FolderTree}
        title="Chưa có danh mục nào"
        description="Tạo danh mục đầu tiên để bắt đầu phân loại khóa học."
        action={
          <Button onClick={onCreate} className="cursor-pointer">
            <Plus /> Tạo danh mục
          </Button>
        }
      />
    );
  }

  return (
    <div className={cn('transition-opacity', isPending && 'pointer-events-none opacity-60')}>
      <Table>
        <CategoriesTableHead />
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="text-muted-foreground">{row.id}</TableCell>
              <TableCell className="text-foreground font-medium">{row.name}</TableCell>
              <TableCell>
                <code className="bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-xs">
                  {row.slug}
                </code>
              </TableCell>
              <TableCell className="text-muted-foreground max-w-xs truncate text-sm">
                {row.description || <span className="italic">—</span>}
              </TableCell>
              <TableCell className="text-center font-medium">{row.courseCount ?? 0}</TableCell>
              <TableCell className="text-center">{row.order ?? 0}</TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Sửa"
                    className="cursor-pointer"
                    onClick={() => onEdit(row)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Xoá"
                    className="text-destructive hover:text-destructive cursor-pointer"
                    onClick={() => onDelete(row)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function CategoriesPaginationSection({
  promise,
  page,
  pageSize,
  onPageChange,
}: {
  promise: Promise<ListCourseCategoriesResponse>;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const { meta } = use(promise);
  const totalPages = Math.max(1, Math.ceil(meta.total / pageSize));
  if (totalPages <= 1) return null;
  return (
    <div className="border-divider flex flex-col items-center justify-between gap-3 border-t px-6 py-4 sm:flex-row">
      <div className="text-muted-foreground text-sm whitespace-nowrap">
        Trang {page} / {totalPages}
      </div>
      <DataPagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  );
}

export default function CourseCategoriesPageClient({ urlState, categoriesPromise }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [searchName, setSearchName] = useState(urlState.name);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingCategory, setEditingCategory] = useState<CourseCategoryRow | null>(null);
  const [form, setForm] = useState<CategoryFormState>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<CourseCategoryRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const updateUrl = useCallback(
    (next: Partial<UrlState>) => {
      const params = buildUrlParams({ ...urlState, ...next });
      const query = params.toString();
      startTransition(() => {
        router.push(query ? `${pathname}?${query}` : pathname);
      });
    },
    [router, pathname, urlState],
  );

  const handleSearch = () => {
    updateUrl({ name: searchName, page: 1 });
  };

  const handleResetFilters = () => {
    setSearchName('');
    updateUrl({ name: '', page: 1 });
  };

  const openCreateModal = () => {
    setModalMode('create');
    setEditingCategory(null);
    setForm(EMPTY_FORM);
    setSubmitted(false);
    setModalOpen(true);
  };

  const openEditModal = (row: CourseCategoryRow) => {
    setModalMode('edit');
    setEditingCategory(row);
    setForm({
      name: row.name,
      slug: row.slug,
      description: row.description ?? '',
      order: String(row.order ?? 0),
    });
    setSubmitted(false);
    setModalOpen(true);
  };

  const nameError = submitted && !form.name.trim() ? 'Vui lòng nhập tên danh mục' : '';
  const slugError = submitted && !form.slug.trim() ? 'Vui lòng nhập slug' : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!form.name.trim() || !form.slug.trim()) return;

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || undefined,
      order: form.order ? Number(form.order) : undefined,
    };

    setSubmitting(true);
    try {
      if (modalMode === 'create') {
        const res = await createCourseCategoryAction(payload);
        handleActionResult(
          res.errors,
          () => {
            setModalOpen(false);
            router.refresh();
          },
          'Tạo danh mục thành công',
        );
      } else if (editingCategory) {
        const res = await updateCourseCategoryAction(editingCategory.id, payload);
        handleActionResult(
          res.errors,
          () => {
            setModalOpen(false);
            router.refresh();
          },
          'Cập nhật danh mục thành công',
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingCategory) return;
    setDeleting(true);
    try {
      const res = await deleteCourseCategoryAction(deletingCategory.id);
      const ok = handleActionResult(res.errors, () => router.refresh(), 'Xoá danh mục thành công');
      if (ok) setDeletingCategory(null);
    } finally {
      setDeleting(false);
    }
  };

  const { page, pageSize } = urlState;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Danh mục khóa học"
        description="Quản lý các danh mục để phân loại khóa học."
      />

      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="search-name">Tên danh mục</Label>
              <Input
                id="search-name"
                placeholder="Tìm theo tên danh mục..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex flex-col items-center justify-end gap-2 pt-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={handleResetFilters}
                className="cursor-pointer"
              >
                <X /> Xoá bộ lọc
              </Button>
              <Button onClick={handleSearch} className="cursor-pointer">
                <Search /> Tìm kiếm
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 pb-0">
        <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Danh sách danh mục</CardTitle>
            <Suspense fallback={<Skeleton className="mt-1 h-4 w-56" />}>
              <CategoriesResultSummary
                promise={categoriesPromise}
                page={page}
                pageSize={pageSize}
              />
            </Suspense>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Hiển thị</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => updateUrl({ pageSize: Number(v), page: 1 })}
            >
              <SelectTrigger className="w-24 cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={openCreateModal} className="cursor-pointer">
              <Plus /> Tạo danh mục
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-0">
          <Suspense fallback={<CategoriesTableFallback />}>
            <CategoriesTableSection
              promise={categoriesPromise}
              isPending={isPending}
              onCreate={openCreateModal}
              onEdit={openEditModal}
              onDelete={setDeletingCategory}
            />
          </Suspense>
        </CardContent>
        <Suspense fallback={null}>
          <CategoriesPaginationSection
            promise={categoriesPromise}
            page={page}
            pageSize={pageSize}
            onPageChange={(p) => updateUrl({ page: p })}
          />
        </Suspense>
      </Card>

      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          if (!submitting) setModalOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modalMode === 'create' ? 'Tạo danh mục' : 'Chỉnh sửa danh mục'}
            </DialogTitle>
            <DialogDescription>
              {modalMode === 'create'
                ? 'Nhập thông tin để tạo danh mục mới.'
                : 'Cập nhật thông tin danh mục.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">
                Tên danh mục <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cat-name"
                placeholder="VD: Vật lý lớp 12"
                maxLength={100}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                aria-invalid={!!nameError}
              />
              {nameError && <p className="text-destructive text-xs">{nameError}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-slug">
                Slug <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cat-slug"
                placeholder="VD: vat-ly-lop-12"
                maxLength={120}
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                aria-invalid={!!slugError}
              />
              {slugError && <p className="text-destructive text-xs">{slugError}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-desc">Mô tả</Label>
              <Textarea
                id="cat-desc"
                rows={3}
                placeholder="Mô tả danh mục (không bắt buộc)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-order">Thứ tự hiển thị</Label>
              <Input
                id="cat-order"
                type="number"
                min={0}
                value={form.order}
                onChange={(e) => setForm({ ...form, order: e.target.value })}
              />
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
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
                {modalMode === 'create' ? 'Tạo danh mục' : 'Lưu thay đổi'}
              </ActionButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingCategory}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeletingCategory(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xoá danh mục</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xoá danh mục{' '}
              <span className="text-foreground font-medium">{deletingCategory?.name}</span>? Thao
              tác này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="cursor-pointer">
              Huỷ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90 cursor-pointer"
            >
              {deleting ? 'Đang xoá...' : 'Xoá danh mục'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
