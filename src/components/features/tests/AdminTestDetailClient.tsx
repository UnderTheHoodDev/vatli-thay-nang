'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Download,
  Search,
} from 'lucide-react';
import { exportSubmissionsAction } from '@/actions/v1/tests/export-submissions';
import { gradeSubmissionAction } from '@/actions/v1/tests/grade-submission';
import { listSubmissions } from '@/actions/v1/tests/list-submissions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Textarea } from '@/components/ui/textarea';
import { handleActionErrors, handleActionSuccess } from '@/lib/actions';
import type { SubmissionRow, TestDetail, TestPhase, TestStats } from '@/types/tests';
import ScoreDistributionChart from './ScoreDistributionChart';
import TestAttachmentViewer from './TestAttachmentViewer';

interface Props {
  courseId: number;
  test: TestDetail;
  initialRows: SubmissionRow[];
  initialStats: TestStats;
  errors: string[];
}

const PHASE: Record<TestPhase, { text: string; variant: 'secondary' | 'default' | 'outline' }> = {
  SCHEDULED: { text: 'Sắp diễn ra', variant: 'outline' },
  ONGOING: { text: 'Đang mở', variant: 'default' },
  ENDED: { text: 'Đã kết thúc', variant: 'secondary' },
};

const STATUS: Record<
  SubmissionRow['status'],
  { text: string; variant: 'secondary' | 'warning' | 'success' }
> = {
  NOT_SUBMITTED: { text: 'Chưa nộp', variant: 'secondary' },
  SUBMITTED: { text: 'Đã nộp', variant: 'warning' },
  GRADED: { text: 'Đã chấm', variant: 'success' },
};

type StatusFilter = 'ALL' | SubmissionRow['status'];

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminTestDetailClient({
  courseId,
  test,
  initialRows,
  initialStats,
  errors,
}: Props) {
  const [rows, setRows] = useState(initialRows);
  const [stats, setStats] = useState(initialStats);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  // Hàng đợi chấm bài = danh sách studentId ĐÓNG BĂNG lúc mở panel, cùng vị trí hiện tại.
  //
  // Không dùng index vào mảng đã sort: chấm xong là bài đó nhảy xuống cuối (sort đưa bài
  // chưa chấm lên trước), nên index cũ + 1 sẽ trỏ sang một học sinh khác — admin bấm
  // "Bài tiếp" là bỏ sót người.
  const [queue, setQueue] = useState<{ ids: number[]; pos: number } | null>(null);

  useEffect(() => {
    if (errors.length) handleActionErrors(errors);
  }, [errors]);

  // Chỉ chấm được bài đã nộp. Bài CHƯA chấm lên trước để admin chấm lần lượt không
  // phải tự dò.
  const gradable = useMemo(
    () =>
      rows
        .filter((r) => r.status !== 'NOT_SUBMITTED')
        .sort((a, b) => Number(a.status === 'GRADED') - Number(b.status === 'GRADED')),
    [rows],
  );

  // Lọc phía client trên danh sách đã tải sẵn — nhanh, không cần gọi lại BE.
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (!q) return true;
      return (r.fullName ?? '').toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
    });
  }, [rows, search, statusFilter]);

  const currentRow = useMemo(() => {
    if (!queue) return null;
    const id = queue.ids[queue.pos];
    return rows.find((r) => r.studentId === id) ?? null;
  }, [queue, rows]);

  const refresh = useCallback(async () => {
    const res = await listSubmissions(test.id);
    if (res.errors.length) return handleActionErrors(res.errors);
    setRows(res.data);
    setStats(res.stats);
  }, [test.id]);

  async function handleExport(format: 'csv' | 'xlsx') {
    setExporting(true);
    try {
      const res = await exportSubmissionsAction(test.id, format);
      if (!res.blob) return handleActionErrors(res.errors);
      const url = URL.createObjectURL(res.blob);
      try {
        const a = document.createElement('a');
        a.href = url;
        a.download = res.filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } finally {
        URL.revokeObjectURL(url);
      }
    } finally {
      setExporting(false);
    }
  }

  const phase = PHASE[test.phase];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Button asChild variant="ghost" size="sm" className="-ml-2 cursor-pointer">
            {/* tab=structure = tab "Nội dung", nơi có section bài kiểm tra */}
            <Link href={`/admin/courses/${courseId}?tab=structure`}>
              <ArrowLeft /> Nội dung khóa học
            </Link>
          </Button>
          <h1 className="mt-1 truncate text-xl font-semibold">{test.title}</h1>
          <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span>
              {formatDateTime(test.startTime)} → {formatDateTime(test.endTime)}
            </span>
            <span aria-hidden className="text-input-border">
              ·
            </span>
            <span>Thang điểm {test.maxScore}</span>
            <Badge variant={phase.variant}>{phase.text}</Badge>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={exporting}
            onClick={() => void handleExport('csv')}
            className="cursor-pointer"
          >
            <Download /> CSV
          </Button>
          <Button
            variant="outline"
            disabled={exporting}
            onClick={() => void handleExport('xlsx')}
            className="cursor-pointer"
          >
            <Download /> Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          title="Đã nộp / Tham gia"
          value={`${stats.submittedCount} / ${stats.participantCount}`}
        />
        <StatCard
          title="Đã chấm / Đã nộp"
          value={`${stats.gradedCount} / ${stats.submittedCount}`}
        />
        <StatCard
          title="Điểm trung bình"
          value={stats.avg === null ? '—' : String(stats.avg)}
          suffix={stats.avg === null ? undefined : `/ ${test.maxScore}`}
        />
        <StatCard
          title="Điểm cao nhất"
          value={stats.max === null ? '—' : String(stats.max)}
          suffix={stats.max === null ? undefined : `/ ${test.maxScore}`}
        />
        <StatCard
          title="Điểm thấp nhất"
          value={stats.min === null ? '—' : String(stats.min)}
          suffix={stats.min === null ? undefined : `/ ${test.maxScore}`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Phổ điểm</CardTitle>
        </CardHeader>
        <CardContent>
          <ScoreDistributionChart distribution={stats.distribution} maxScore={test.maxScore} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-3">
          <CardTitle>Bài nộp</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo họ tên hoặc email…"
                aria-label="Tìm theo họ tên hoặc email"
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger aria-label="Lọc theo trạng thái" className="sm:w-44">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                <SelectItem value="NOT_SUBMITTED">Chưa nộp</SelectItem>
                <SelectItem value="SUBMITTED">Đã nộp</SelectItem>
                <SelectItem value="GRADED">Đã chấm</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Nộp lúc</TableHead>
                  <TableHead className="text-center">Điểm</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-muted-foreground py-8 text-center text-sm"
                    >
                      {rows.length === 0 ? 'Chưa có học sinh nào' : 'Không có kết quả phù hợp'}
                    </TableCell>
                  </TableRow>
                )}
                {filteredRows.map((r) => (
                  <TableRow key={r.studentId} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">
                      {r.fullName ?? '—'}
                      {r.leftCourse && (
                        <Badge variant="outline" className="ml-2">
                          Đã rời khóa
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{r.email}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS[r.status].variant}>{STATUS[r.status].text}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDateTime(r.submittedAt)}
                      {/* Chỉ suy ra "đã sửa" khi bài CHƯA chấm: updatedAt của bài nộp bị
                          chạm mỗi lần ghi, kể cả lúc admin chấm điểm — bài đã chấm thì
                          updatedAt là thời điểm chấm, so với submittedAt sẽ luôn lệch và
                          báo "đã sửa" cho một học sinh không hề sửa gì. */}
                      {r.status === 'SUBMITTED' &&
                        r.submittedAt &&
                        r.updatedAt &&
                        r.updatedAt !== r.submittedAt && (
                          <span className="ml-1 text-xs">(đã sửa)</span>
                        )}
                    </TableCell>
                    <TableCell className="text-center">
                      {r.score === null ? (
                        <span className="text-muted-foreground">Chưa chấm</span>
                      ) : (
                        <strong>
                          {r.score}/{test.maxScore}
                        </strong>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status !== 'NOT_SUBMITTED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="cursor-pointer"
                          onClick={() =>
                            setQueue({
                              ids: gradable.map((g) => g.studentId),
                              pos: gradable.findIndex((g) => g.studentId === r.studentId),
                            })
                          }
                        >
                          <ClipboardCheck />
                          {r.status === 'GRADED' ? 'Xem lại' : 'Chấm bài'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {queue && currentRow && (
        <GradingDialog
          key={currentRow.studentId}
          courseId={courseId}
          testId={test.id}
          maxScore={test.maxScore}
          row={currentRow}
          index={queue.pos}
          total={queue.ids.length}
          gradedCount={stats.gradedCount}
          submittedCount={stats.submittedCount}
          onClose={() => setQueue(null)}
          onNavigate={(pos) => setQueue((q) => (q ? { ...q, pos } : q))}
          onGraded={refresh}
        />
      )}
    </div>
  );
}

function StatCard({ title, value, suffix }: { title: string; value: string; suffix?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{title}</p>
        <p className="mt-1.5 text-2xl font-bold tabular-nums">
          {value}
          {suffix && (
            <span className="text-muted-foreground ml-1 text-base font-medium">{suffix}</span>
          )}
        </p>
      </CardContent>
    </Card>
  );
}

function GradingDialog({
  courseId,
  testId,
  maxScore,
  row,
  index,
  total,
  gradedCount,
  submittedCount,
  onClose,
  onNavigate,
  onGraded,
}: {
  courseId: number;
  testId: number;
  maxScore: number;
  row: SubmissionRow;
  index: number;
  total: number;
  gradedCount: number;
  submittedCount: number;
  onClose: () => void;
  onNavigate: (i: number) => void;
  onGraded: () => Promise<void>;
}) {
  const [score, setScore] = useState(row.score === null ? '' : String(row.score));
  const [feedback, setFeedback] = useState(row.feedback ?? '');
  const [saving, setSaving] = useState(false);
  // setSaving chỉ có hiệu lực ở lần render sau, nên hai cú click liên tiếp cùng lọt qua
  // `saving === false`. Ref khoá ngay trong lần click đầu.
  const savingRef = useRef(false);

  async function save() {
    if (savingRef.current) return;

    const value = Number(score);
    if (!score.trim() || !Number.isFinite(value)) {
      return handleActionErrors(['Chưa nhập điểm']);
    }
    if (value < 0 || value > maxScore) {
      return handleActionErrors([`Điểm phải trong khoảng 0 – ${maxScore}`]);
    }

    savingRef.current = true;
    setSaving(true);
    try {
      const res = await gradeSubmissionAction(courseId, testId, row.studentId, {
        score: value,
        feedback: feedback.trim() || undefined,
      });
      if (res.errors.length) return handleActionErrors(res.errors);

      handleActionSuccess('Đã chấm điểm');
      // Phải chờ tải lại xong rồi mới sang bài kế: chuyển sớm thì dialog mở ra trên dữ
      // liệu cũ và điểm vừa nhập vẫn còn nằm trong ô.
      await onGraded();
      // Sang bài kế tiếp để chấm liên tục, hết thì đóng.
      if (index + 1 < total) onNavigate(index + 1);
      else onClose();
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent size="full" aria-describedby={undefined}>
        <div className="flex h-full min-h-0 flex-col">
          <DialogHeader className="border-divider shrink-0 border-b px-4 py-3">
            <div className="flex items-center justify-between gap-3 pr-8">
              <div className="min-w-0">
                <DialogTitle className="flex items-center gap-2">
                  <span className="truncate">{row.fullName ?? row.email}</span>
                  <Badge variant={STATUS[row.status].variant} className="shrink-0">
                    {STATUS[row.status].text}
                  </Badge>
                </DialogTitle>
                {row.fullName && (
                  <p className="text-muted-foreground truncate text-sm">{row.email}</p>
                )}
              </div>
              <span className="text-muted-foreground shrink-0 text-sm tabular-nums">
                Đã chấm {gradedCount}/{submittedCount}
              </span>
            </div>
          </DialogHeader>

          <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 lg:grid-cols-[1fr_320px]">
            <div className="min-w-0 space-y-3">
              {row.note && (
                <div className="bg-muted rounded-lg p-3 text-sm">
                  <p className="text-muted-foreground mb-1 text-xs font-medium">
                    Ghi chú của học sinh
                  </p>
                  {row.note}
                </div>
              )}
              <TestAttachmentViewer files={row.files} emptyHint="Học sinh không nộp tệp nào" />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="grade-score">Điểm (0 – {maxScore})</Label>
                <Input
                  id="grade-score"
                  type="number"
                  step="0.01"
                  min="0"
                  max={maxScore}
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade-feedback">Nhận xét</Label>
                <Textarea
                  id="grade-feedback"
                  rows={6}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  disabled={saving}
                  placeholder="Trình bày tốt, sai câu 3…"
                />
              </div>

              <Button
                onClick={() => void save()}
                disabled={saving}
                className="w-full cursor-pointer"
              >
                {saving ? 'Đang lưu…' : 'Lưu điểm'}
              </Button>

              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={index === 0 || saving}
                  onClick={() => onNavigate(index - 1)}
                  className="cursor-pointer"
                >
                  <ChevronLeft /> Bài trước
                </Button>
                <span className="text-muted-foreground text-xs">
                  {index + 1} / {total}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={index + 1 >= total || saving}
                  onClick={() => onNavigate(index + 1)}
                  className="cursor-pointer"
                >
                  Bài tiếp <ChevronRight />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
