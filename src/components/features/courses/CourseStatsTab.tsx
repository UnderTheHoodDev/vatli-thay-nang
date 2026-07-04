'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { BarChart3, Download, Eye, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import DataPagination from '@/components/app/DataPagination';
import EmptyState from '@/components/app/EmptyState';
import TableSkeleton from '@/components/app/TableSkeleton';
import { PAGE_SIZE_OPTIONS } from '@/lib/constants';
import { handleActionErrors } from '@/lib/actions';
import { formatDate } from '@/lib/utils';
import { listCourseStatsAction } from '@/actions/v1/courses/list-course-stats';
import { getStudentStatsAction } from '@/actions/v1/courses/get-student-stats';
import { exportCourseStatsAction } from '@/actions/v1/courses/export-course-stats';
import type { CourseStatsRow, CourseStudentStatsDetail } from '@/types/course-management';

const SKELETON_COLUMNS = ['w-8', 'w-48', 'w-36', 'w-32', 'w-24', 'w-24', 'w-24'];

interface Props {
  courseId: number;
}

export default function CourseStatsTab({ courseId }: Props) {
  const [q, setQ] = useState('');
  const [appliedQ, setAppliedQ] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [rows, setRows] = useState<CourseStatsRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [drilldown, setDrilldown] = useState<CourseStudentStatsDetail | null>(null);
  const [drillLoading, setDrillLoading] = useState(false);
  const [, startTransition] = useTransition();

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const res = await listCourseStatsAction(courseId, {
      q: appliedQ || undefined,
      page,
      pageSize,
    });
    if (res.errors.length) handleActionErrors(res.errors);
    setRows(res.data?.data ?? []);
    setTotal(res.data?.meta.total ?? 0);
    setLoading(false);
  }, [courseId, appliedQ, page, pageSize]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setAppliedQ(q.trim());
    setPage(1);
  }
  function reset() {
    setQ('');
    setAppliedQ('');
    setPage(1);
  }

  async function openDrilldown(studentId: number) {
    setDrillLoading(true);
    setDrilldown(null);
    const res = await getStudentStatsAction(courseId, studentId);
    if (res.errors.length) handleActionErrors(res.errors);
    setDrilldown(res.data);
    setDrillLoading(false);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await exportCourseStatsAction(courseId);
      if (res.errors.length || !res.csv) {
        handleActionErrors(res.errors.length ? res.errors : ['Xuất CSV thất bại']);
        return;
      }
      const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `course-${courseId}-stats.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tìm học sinh</CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <form onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="stats-search">Họ tên hoặc email</Label>
              <Input
                id="stats-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="VD: nguyenvana hoặc nguyenvana@vltn.vn"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button type="button" variant="outline" onClick={reset} className="cursor-pointer">
                <X /> Xoá
              </Button>
              <Button type="submit" className="cursor-pointer">
                <Search /> Tìm
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="gap-0 pb-0">
        <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Thống kê xem video</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">
              {total === 0
                ? 'Chưa có học sinh ghi danh hoặc chưa ai xem'
                : `Hiển thị ${start}–${end} trên tổng ${total} học sinh`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Hiển thị</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setPage(1);
              }}
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
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={exporting}
              className="cursor-pointer"
            >
              <Download /> {exporting ? 'Đang xuất...' : 'Xuất CSV'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-0">
          {!loading && rows.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="Chưa có dữ liệu thống kê"
              description="Khi học sinh xem video, dữ liệu sẽ hiển thị ở đây."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-12">TT</TableHead>
                    <TableHead>Họ và tên</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Lần truy cập gần nhất</TableHead>
                    <TableHead className="text-right">Lượt xem</TableHead>
                    <TableHead className="text-right">Số giờ xem</TableHead>
                    <TableHead className="w-28 text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableSkeleton columnWidths={SKELETON_COLUMNS} />
                  ) : (
                    rows.map((r, idx) => (
                      <TableRow key={r.studentId}>
                        <TableCell className="text-muted-foreground">
                          {(page - 1) * pageSize + idx + 1}
                        </TableCell>
                        <TableCell className="text-foreground font-medium">
                          {r.fullName ?? '—'}
                        </TableCell>
                        <TableCell>{r.email}</TableCell>
                        <TableCell>{r.lastViewedAt ? formatDate(r.lastViewedAt) : '—'}</TableCell>
                        <TableCell className="text-right">{r.totalViewCount}</TableCell>
                        <TableCell className="text-right">
                          {formatHours(r.totalWatchedSec)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="cursor-pointer"
                            onClick={() =>
                              startTransition(() => {
                                void openDrilldown(r.studentId);
                              })
                            }
                          >
                            <Eye /> Chi tiết
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        {totalPages > 1 && (
          <div className="border-divider flex flex-col items-center justify-between gap-3 border-t px-6 py-4 sm:flex-row">
            <div className="text-muted-foreground text-sm">
              Trang {page} / {totalPages}
            </div>
            <DataPagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </Card>

      <Dialog
        open={drillLoading || drilldown !== null}
        onOpenChange={(open) => {
          if (!open) setDrilldown(null);
        }}
      >
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>
              {drilldown
                ? `Chi tiết xem video — ${drilldown.student.fullName ?? drilldown.student.email}`
                : 'Đang tải...'}
            </DialogTitle>
          </DialogHeader>
          {drillLoading ? (
            <div className="text-muted-foreground py-8 text-center text-sm">
              Đang tải dữ liệu...
            </div>
          ) : drilldown && drilldown.files.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="Chưa có dữ liệu xem"
              description="Học sinh chưa xem video nào trong khóa học này."
            />
          ) : drilldown ? (
            <div className="max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead>Đường dẫn</TableHead>
                    <TableHead>Video</TableHead>
                    <TableHead className="text-right">Lượt xem</TableHead>
                    <TableHead className="text-right">Số giờ xem</TableHead>
                    <TableHead className="text-right">Vị trí cuối</TableHead>
                    <TableHead>Xem gần nhất</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drilldown.files.map((f) => (
                    <TableRow key={f.nodeId}>
                      <TableCell className="text-muted-foreground text-sm">
                        {f.pathTitles.length ? f.pathTitles.join(' / ') : '(gốc)'}
                      </TableCell>
                      <TableCell>{f.nodeTitle}</TableCell>
                      <TableCell className="text-right">{f.viewCount}</TableCell>
                      <TableCell className="text-right">{formatHours(f.totalWatchedSec)}</TableCell>
                      <TableCell className="text-right">
                        {formatPosition(f.lastPositionSec, f.durationSeconds)}
                      </TableCell>
                      <TableCell>{f.lastViewedAt ? formatDate(f.lastViewedAt) : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatHours(seconds: number): string {
  if (!seconds || seconds < 0) return '0h';
  if (seconds < 60) return `${seconds}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function formatPosition(pos: number, total: number | null): string {
  if (!pos) return '—';
  const fmt = formatHours(pos);
  if (total) {
    const pct = Math.min(100, Math.round((pos / total) * 100));
    return `${fmt} (${pct}%)`;
  }
  return fmt;
}
