'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Lock } from 'lucide-react';
import { getTest } from '@/actions/v1/tests/get-test';
import { listParticipants } from '@/actions/v1/tests/list-participants';
import { upsertSubmissionAction } from '@/actions/v1/tests/upsert-submission';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { handleActionErrors, handleActionSuccess } from '@/lib/actions';
import { formatDateTimeShort } from '@/lib/format';
import type {
  MySubmission,
  ParticipantsResult,
  StudentTestDetail as TDetail,
  TestFilePayload,
} from '@/types/tests';
import ScoreDistributionChart from './ScoreDistributionChart';
import TestAttachmentViewer from './TestAttachmentViewer';
import TestFileUploader from './TestFileUploader';

interface Props {
  courseId: number;
  testId: number;
  onBack: () => void;
}

type ScoreTier = 'low' | 'mid' | 'high';

const SCORE_TIER_CLASS: Record<ScoreTier, string> = {
  low: 'bg-red-500',
  mid: 'bg-yellow-500',
  high: 'bg-green-500',
};

function scoreTier(score: number, maxScore: number): ScoreTier {
  const ratio = maxScore > 0 ? score / maxScore : 0;
  if (ratio >= 0.8) return 'high';
  if (ratio >= 0.5) return 'mid';
  return 'low';
}

/** Màn chi tiết một bài kiểm tra phía học sinh. Gate theo phase chỉ để ẩn UI — BE mới chốt. */
export default function StudentTestDetail({ courseId, testId, onBack }: Props) {
  const [test, setTest] = useState<TDetail | null>(null);
  const [participants, setParticipants] = useState<ParticipantsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const mountedRef = useRef(true);
  const requestSeqRef = useRef(0);

  const load = useCallback(async (): Promise<boolean> => {
    const seq = requestSeqRef.current + 1;
    requestSeqRef.current = seq;
    const isCurrent = () => mountedRef.current && requestSeqRef.current === seq;

    const res = await getTest<TDetail>(testId);
    if (!isCurrent()) return false;

    if (!res.data) {
      handleActionErrors(res.errors);
      setTest(null);
      setParticipants(null);
      setLoading(false);
      return false;
    }

    setTest(res.data);
    setLoading(false);

    // Chưa tới giờ thì BE chặn tab thống kê (403) — đừng gọi cho phí.
    if (res.data.phase === 'SCHEDULED') {
      setParticipants(null);
      return true;
    }

    const p = await listParticipants(testId);
    if (!isCurrent()) return false;
    setParticipants(p.errors.length ? null : p);
    return true;
  }, [testId]);

  useEffect(() => {
    mountedRef.current = true;
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => {
      window.clearTimeout(timer);
      mountedRef.current = false;
      requestSeqRef.current += 1;
    };
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-4" role="status" aria-label="Đang tải bài kiểm tra">
        <Skeleton className="h-8 w-40" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-md" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }
  if (!test) {
    return (
      <div className="space-y-3">
        <BackButton onBack={onBack} />
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            Không mở được bài kiểm tra này.
          </CardContent>
        </Card>
      </div>
    );
  }

  const scheduled = test.phase === 'SCHEDULED';
  const ongoing = test.phase === 'ONGOING';
  const ended = test.phase === 'ENDED';
  const hasResult = ended && test.mySubmissionStatus === 'GRADED';

  return (
    <div className="space-y-4">
      <BackButton onBack={onBack} disabled={uploading} />

      <div>
        <h2 className="text-lg font-semibold">{test.title}</h2>
        <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span>
            {formatDateTimeShort(test.startTime)} → {formatDateTimeShort(test.endTime)}
          </span>
          <span aria-hidden className="text-input-border">
            ·
          </span>
          <span>Thang điểm {test.maxScore}</span>
          <Badge variant={ongoing ? 'default' : ended ? 'secondary' : 'outline'}>
            {scheduled ? 'Sắp diễn ra' : ongoing ? 'Đang mở' : 'Đã kết thúc'}
          </Badge>
        </div>
      </div>

      {scheduled ? (
        <Card>
          <CardContent className="text-muted-foreground space-y-2 py-10 text-center text-sm">
            <Lock className="mx-auto size-8" />
            <p>
              Chưa tới giờ làm bài. Đề mở lúc{' '}
              <strong className="text-foreground">{formatDateTimeShort(test.startTime)}</strong>.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={ongoing ? 'submit' : hasResult ? 'result' : 'paper'}>
          {/*
            Khoá đổi tab khi đang tải tệp: tab Nộp bài bị unmount là uploader đi theo,
            tệp vẫn lên tới R2 nhưng không còn ai giữ nó — quay lại thấy form trống như
            chưa từng chọn, còn tệp thì nằm lại đó không ai dọn.
          */}
          <TabsList>
            <TabsTrigger value="paper" disabled={uploading} className="cursor-pointer">
              Đề bài
            </TabsTrigger>
            <TabsTrigger value="submit" disabled={uploading} className="cursor-pointer">
              Nộp bài
              {/* Chấm nhỏ báo đã nộp — quét nhanh không cần mở tab. */}
              {test.mySubmissionStatus !== 'NOT_SUBMITTED' && (
                <span className="inline-block size-1.5 rounded-full bg-green-500" aria-hidden />
              )}
            </TabsTrigger>
            <TabsTrigger value="stats" disabled={uploading} className="cursor-pointer">
              Thống kê
            </TabsTrigger>
            <TabsTrigger value="result" disabled={uploading} className="cursor-pointer">
              Kết quả
              {hasResult && (
                <span className="bg-purple inline-block size-1.5 rounded-full" aria-hidden />
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="paper" className="mt-4">
            {test.description && (
              <div className="bg-muted mb-3 rounded-lg p-3 text-sm whitespace-pre-wrap">
                {test.description}
              </div>
            )}
            <TestAttachmentViewer files={test.attachments} emptyHint="Bài này không có tệp đề" />
          </TabsContent>

          <TabsContent value="submit" className="mt-4">
            <SubmitTab
              // Remount sau mỗi lần nộp để form nạp lại đúng bài vừa lưu.
              key={test.mySubmission?.updatedAt ?? 'chua-nop'}
              courseId={courseId}
              testId={testId}
              ongoing={ongoing}
              endTime={test.endTime}
              status={test.mySubmissionStatus}
              mySubmission={test.mySubmission}
              onSubmitted={load}
              onUploadingChange={setUploading}
            />
          </TabsContent>

          <TabsContent value="stats" className="mt-4">
            <StatsTab participants={participants} maxScore={test.maxScore} ended={ended} />
          </TabsContent>

          <TabsContent value="result" className="mt-4">
            {hasResult ? (
              <div className="space-y-4">
                <Card>
                  <CardContent className="space-y-3 py-6">
                    <p className="text-muted-foreground text-sm">Điểm của bạn</p>
                    <p className="text-3xl font-semibold">
                      {test.myScore}
                      <span className="text-muted-foreground text-lg"> / {test.maxScore}</span>
                    </p>
                    {test.myScore !== null && (
                      <Progress
                        value={(test.myScore / test.maxScore) * 100}
                        indicatorClassName={
                          SCORE_TIER_CLASS[scoreTier(test.myScore, test.maxScore)]
                        }
                      />
                    )}
                  </CardContent>
                </Card>

                {test.mySubmission?.feedback && (
                  <Card>
                    <CardContent className="space-y-2 py-6">
                      <p className="text-muted-foreground text-sm">Nhận xét của giáo viên</p>
                      <p className="text-sm whitespace-pre-wrap">{test.mySubmission.feedback}</p>
                    </CardContent>
                  </Card>
                )}

                {test.mySubmission && (
                  <Card>
                    <CardContent className="space-y-3 py-6">
                      <p className="text-sm font-medium">Bài làm của bạn</p>
                      {test.mySubmission.note && (
                        <div className="bg-muted rounded-md p-3 text-sm whitespace-pre-wrap">
                          {test.mySubmission.note}
                        </div>
                      )}
                      <TestAttachmentViewer
                        files={test.mySubmission.files}
                        emptyHint="Bạn không nộp tệp nào"
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="text-muted-foreground py-10 text-center text-sm">
                  {ended
                    ? 'Giáo viên chưa chấm bài của bạn.'
                    : 'Điểm chỉ hiện sau khi bài kiểm tra kết thúc.'}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function BackButton({ onBack, disabled }: { onBack: () => void; disabled?: boolean }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onBack}
      // Rời màn giữa lúc tải tệp: tệp vẫn lên tới R2 nhưng không bài nộp nào trỏ vào nó
      // nữa — thành rác không ai dọn, còn học sinh tưởng mình đã huỷ.
      disabled={disabled}
      className="-ml-2 cursor-pointer"
    >
      <ArrowLeft /> Danh sách bài kiểm tra
    </Button>
  );
}

function SubmitTab({
  courseId,
  testId,
  ongoing,
  endTime,
  status,
  mySubmission,
  onSubmitted,
  onUploadingChange,
}: {
  courseId: number;
  testId: number;
  ongoing: boolean;
  endTime: string;
  status: TDetail['mySubmissionStatus'];
  mySubmission: MySubmission | null;
  onSubmitted: () => Promise<boolean>;
  onUploadingChange: (uploading: boolean) => void;
}) {
  // Nạp sẵn bài đã nộp: nộp lại là GHI ĐÈ, nên form trống đồng nghĩa bổ sung một tấm ảnh
  // cũng phải tải lại toàn bộ từ đầu, còn ghi chú cũ thì mất. Cha remount tab này bằng
  // key = updatedAt sau mỗi lần nộp, nên state khởi tạo luôn khớp dữ liệu mới nhất.
  const [files, setFiles] = useState<TestFilePayload[]>(() =>
    (mySubmission?.files ?? []).map((f, i) => ({
      fileStorageKey: f.fileStorageKey!,
      fileName: f.fileName,
      fileSize: f.fileSize ?? undefined,
      mimeType: f.mimeType ?? undefined,
      order: i,
    })),
  );
  const [note, setNote] = useState(mySubmission?.note ?? '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const mountedRef = useRef(true);
  const submittingRef = useRef(false);

  // Tab này còn cần `uploading` cho nút bấm của mình, nhưng cha cũng phải biết để khoá
  // nút Quay lại — nên báo lên cả hai nơi.
  const handleUploadingChange = useCallback(
    (busy: boolean) => {
      setUploading(busy);
      onUploadingChange(busy);
    },
    [onUploadingChange],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Đổi tab giữa lúc tải sẽ unmount tab này. Không trả cờ về false thì nút Quay lại
      // của cha kẹt disabled vĩnh viễn.
      onUploadingChange(false);
    };
  }, [onUploadingChange]);

  // Hết giờ là khoá hẳn. BE cũng chặn (403) — đây chỉ là để không mời gọi bấm.
  if (!ongoing) {
    return (
      <Card>
        <CardContent className="text-muted-foreground space-y-2 py-10 text-center text-sm">
          <Lock className="mx-auto size-8" />
          <p>Đã hết thời gian nộp bài.</p>
          {status !== 'NOT_SUBMITTED' && (
            <p className="text-foreground">Bài của bạn đã được ghi nhận.</p>
          )}
        </CardContent>
      </Card>
    );
  }

  async function submit() {
    if (submittingRef.current || uploading) return;
    if (!files.length) return handleActionErrors(['Chưa chọn tệp bài làm nào']);
    submittingRef.current = true;
    setSaving(true);
    try {
      const res = await upsertSubmissionAction(courseId, testId, {
        note: note.trim() || undefined,
        files,
      });

      if (!mountedRef.current) return;
      if (res.errors.length) {
        handleActionErrors(res.errors);
        return;
      }

      handleActionSuccess('Nộp bài thành công');
      // Không xoá form ở đây: cha tải lại rồi remount tab này với bài vừa nộp, để học
      // sinh thấy đúng thứ mình đang giữ và sửa tiếp được.
      await onSubmitted();
    } finally {
      submittingRef.current = false;
      if (mountedRef.current) setSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 py-6">
        {mySubmission && (
          <p className="bg-muted rounded-md p-3 text-sm">
            Đã nộp lúc <strong>{formatDateTimeShort(mySubmission.updatedAt)}</strong> — bạn có thể
            cập nhật đến <strong>{formatDateTimeShort(endTime)}</strong>. Bài nộp mới sẽ thay thế
            bài cũ.
          </p>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">Tệp bài làm (ảnh / PDF / .txt)</p>
          <TestFileUploader
            folder="test-submissions"
            testId={testId}
            value={files}
            onChange={setFiles}
            disabled={saving}
            onBusyChange={handleUploadingChange}
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Ghi chú (tuỳ chọn)</p>
          <Textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={saving}
            placeholder="Em nộp 3 trang ạ…"
          />
        </div>

        <Button
          onClick={() => void submit()}
          disabled={saving || uploading || files.length === 0}
          className="w-full cursor-pointer"
        >
          {uploading
            ? 'Đang tải tệp lên…'
            : saving
              ? 'Đang nộp…'
              : status === 'NOT_SUBMITTED'
                ? 'Nộp bài'
                : 'Cập nhật bài nộp'}
        </Button>
      </CardContent>
    </Card>
  );
}

function StatsTab({
  participants,
  maxScore,
  ended,
}: {
  participants: ParticipantsResult | null;
  maxScore: number;
  ended: boolean;
}) {
  if (!participants) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-10 text-center text-sm">
          Chưa có dữ liệu thống kê.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {ended && (
        <Card>
          <CardContent className="py-6">
            <p className="mb-2 text-sm font-medium">
              Phổ điểm cả lớp
              {participants.myScore !== null && (
                <span className="text-muted-foreground ml-2 font-normal">
                  · điểm của bạn: {participants.myScore}/{maxScore}
                </span>
              )}
            </p>
            {participants.distribution ? (
              <ScoreDistributionChart
                distribution={participants.distribution}
                highlightScore={participants.myScore}
                maxScore={maxScore}
              />
            ) : (
              // BE giấu phổ điểm khi lớp quá ít bài đã chấm: biểu đồ "ẩn danh" của lớp
              // vài người thì nhìn là biết điểm của nhau.
              <p className="text-muted-foreground py-8 text-center text-sm">
                Chưa đủ dữ liệu để hiển thị phổ điểm
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="py-6">
          <p className="mb-3 text-sm font-medium">Tình hình nộp bài của lớp</p>
          <ul className="divide-divide divide-y text-sm">
            {participants.data.map((p, i) => (
              <li key={`${p.fullName}-${i}`} className="flex items-center justify-between py-2">
                <span>
                  <span className="text-muted-foreground mr-2">{i + 1}.</span>
                  {p.fullName ?? '—'}
                </span>
                <Badge variant={p.hasSubmitted ? 'default' : 'outline'}>
                  {p.hasSubmitted ? 'Đã nộp' : 'Chưa nộp'}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
