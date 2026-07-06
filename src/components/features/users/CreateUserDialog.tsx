'use client';

import { useRef, useState, useTransition } from 'react';
import { Plus, Upload, UserPlus } from 'lucide-react';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { FormTextField, ActionButton } from '@/components/ui/custom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { EMAIL_REGEX, VALIDATION_MESSAGES } from '@/lib/validation';
import { handleActionResult } from '@/lib/actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { createUserAction } from '@/actions/v1/users/create-user';
import { bulkSyncAction } from '@/actions/v1/users/bulk-sync';
import { getBulkJobStatusAction } from '@/actions/v1/users/bulk-job-status';
import type { BulkJobStatus, BulkSyncRow } from '@/types/actions/users';

export default function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [pending, startTransition] = useTransition();

  // Bulk sync state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvRows, setCsvRows] = useState<BulkSyncRow[]>([]);
  const [csvError, setCsvError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [jobStatus, setJobStatus] = useState<BulkJobStatus | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value) {
      toast.error(VALIDATION_MESSAGES.EMAIL_REQUIRED);
      return;
    }
    if (!EMAIL_REGEX.test(value)) {
      toast.error(VALIDATION_MESSAGES.EMAIL_INVALID);
      return;
    }
    startTransition(async () => {
      const res = await createUserAction(value);
      const succeeded = handleActionResult(res.errors);
      if (succeeded) {
        toast.success('Tạo user thành công. Mail kích hoạt đã được gửi.');
        setEmail('');
        setOpen(false);
      }
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setCsvError('');
    setCsvRows([]);
    setJobStatus(null);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const rows: BulkSyncRow[] = [];
        const errors: string[] = [];
        result.data.forEach((row, idx) => {
          const email = row.email?.trim();
          const status = row.status?.trim() as 'active' | 'inactive';
          if (!email) {
            errors.push(`Dòng ${idx + 2}: thiếu email`);
            return;
          }
          if (status !== 'active' && status !== 'inactive') {
            errors.push(`Dòng ${idx + 2}: status phải là "active" hoặc "inactive"`);
            return;
          }
          rows.push({ email, status });
        });
        if (errors.length > 0) {
          setCsvError(
            errors.slice(0, 3).join('; ') +
              (errors.length > 3 ? ` (và ${errors.length - 3} lỗi khác)` : ''),
          );
        } else {
          setCsvRows(rows);
        }
      },
      error: () => setCsvError('Không thể đọc file CSV'),
    });
  }

  function stopPoll() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  async function handleBulkSync() {
    if (csvRows.length === 0) return;
    setSyncing(true);
    setJobStatus(null);

    const res = await bulkSyncAction(csvRows);
    if (res.errors.length > 0) {
      res.errors.forEach((e) => toast.error(e));
      setSyncing(false);
      return;
    }
    const jobId = res.jobId!;

    pollRef.current = setInterval(async () => {
      const statusRes = await getBulkJobStatusAction(jobId);
      if (statusRes.errors.length > 0) {
        stopPoll();
        setSyncing(false);
        return;
      }
      const data = statusRes.data!;
      setJobStatus(data);
      if (data.status === 'DONE' || data.status === 'FAILED') {
        stopPoll();
        setSyncing(false);
        if (data.status === 'DONE') toast.success('Đồng bộ CSV hoàn tất');
        else toast.error('Đồng bộ CSV gặp lỗi');
      }
    }, 1500);
  }

  function handleClose(v: boolean) {
    if (!v) stopPoll();
    setOpen(v);
  }

  const progress = jobStatus
    ? jobStatus.total > 0
      ? Math.round((jobStatus.processed / jobStatus.total) * 100)
      : 0
    : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <Plus /> Tạo / Đồng bộ user
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Quản lý tài khoản</DialogTitle>
          <DialogDescription>Tạo 1 tài khoản hoặc đồng bộ hàng loạt từ CSV.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="single">
          <TabsList className="w-full">
            <TabsTrigger value="single" className="flex-1">
              Tạo 1 user
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex-1">
              Đồng bộ CSV
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="mt-4">
            <form onSubmit={handleCreateUser} className="space-y-4">
              <FormTextField
                id="create-email"
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="user@example.com"
                required
                disabled={pending}
              />
              <DialogFooter className="gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                  className="cursor-pointer"
                >
                  Hủy
                </Button>
                <ActionButton
                  type="submit"
                  isLoading={pending}
                  loadingText="Đang tạo..."
                  className="cursor-pointer"
                >
                  <UserPlus /> Tạo tài khoản
                </ActionButton>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="bulk" className="mt-4 space-y-4">
            <div className="bg-muted/50 rounded-md p-3 text-sm">
              <p className="font-medium">Định dạng CSV:</p>
              <code className="text-muted-foreground mt-1 block">email,status</code>
              <code className="text-muted-foreground block">user@example.com,active</code>
              <code className="text-muted-foreground block">other@example.com,inactive</code>
              <p className="text-muted-foreground mt-1 text-xs">
                <strong>active</strong> → kích hoạt; <strong>inactive</strong> → vô hiệu hóa
              </p>
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                disabled={syncing}
              >
                <Upload />
                {csvFile ? csvFile.name : 'Chọn file CSV...'}
              </Button>
              {csvError && <p className="text-destructive mt-1 text-sm">{csvError}</p>}
              {csvRows.length > 0 && !csvError && (
                <p className="text-muted-foreground mt-1 text-sm">
                  Đã đọc <strong>{csvRows.length}</strong> dòng hợp lệ
                </p>
              )}
            </div>

            {jobStatus && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <div className="text-muted-foreground grid grid-cols-3 gap-1 text-xs">
                  <span>
                    Đã xử lý: {jobStatus.processed}/{jobStatus.total}
                  </span>
                  <span>Tạo mới: {jobStatus.created}</span>
                  <span>Kích hoạt: {jobStatus.activated}</span>
                  <span>Vô hiệu: {jobStatus.disabled}</span>
                  <span>Lỗi: {jobStatus.failed}</span>
                  <span
                    className={
                      jobStatus.status === 'DONE'
                        ? 'text-green-600'
                        : jobStatus.status === 'FAILED'
                          ? 'text-destructive'
                          : ''
                    }
                  >
                    {jobStatus.status === 'RUNNING'
                      ? 'Đang xử lý...'
                      : jobStatus.status === 'DONE'
                        ? 'Hoàn tất'
                        : 'Thất bại'}
                  </span>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={syncing}
                className="cursor-pointer"
              >
                Đóng
              </Button>
              <Button
                type="button"
                onClick={handleBulkSync}
                disabled={csvRows.length === 0 || syncing || !!csvError}
                className="cursor-pointer"
              >
                {syncing ? 'Đang đồng bộ...' : 'Đồng bộ'}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
