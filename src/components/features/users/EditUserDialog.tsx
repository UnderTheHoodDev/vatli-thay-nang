'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ActionButton } from '@/components/ui/custom';
import { handleActionResult } from '@/lib/actions';
import { toDateInputValue } from '@/lib/format';
import { ROLE_OPTIONS } from '@/lib/constants';
import { validateProfileContact } from '@/lib/validation';
import { adminUpdateUserAction } from '@/actions/v1/users/admin-update-user';
import ProfileContactFields, { type ProfileContactValues } from './ProfileContactFields';
import type { Gender, Province, Role, UserRow } from '@/types/auth';
import type { IAdminUpdateUserPayload } from '@/types/actions/users';

interface FormState extends ProfileContactValues {
  birthday: string;
  role: Role;
}

function toForm(user: UserRow): FormState {
  return {
    fullName: user.fullName ?? '',
    gender: (user.gender ?? '') as Gender | '',
    birthday: toDateInputValue(user.birthday),
    provinceId: user.provinceId ? String(user.provinceId) : '',
    schoolName: user.schoolName ?? '',
    parentPhonenumber: user.parentPhonenumber ?? '',
    facebookLink: user.facebookLink ?? '',
    role: user.role,
  };
}

interface Props {
  user: UserRow;
  provinces: Province[];
}

export default function EditUserDialog({ user, provinces }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(() => toForm(user));
  const [pending, setPending] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((s) => ({ ...s, [key]: value }));
  }
  // Không thể tái dùng `update` trực tiếp cho ProfileContactFields dù
  // FormState extends ProfileContactValues — TS coi 2 kiểu hàm generic này
  // không tương thích (kiểm tra tại vị trí K, không suy luận được subset).
  const updateContact = <K extends keyof ProfileContactValues>(
    key: K,
    value: ProfileContactValues[K],
  ) => setForm((s) => ({ ...s, [key]: value }));

  function handleOpenChange(next: boolean) {
    if (next) setForm(toForm(user));
    setOpen(next);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    const error = validateProfileContact(form);
    if (error) {
      toast.error(error);
      return;
    }

    const payload: IAdminUpdateUserPayload = {
      fullName: form.fullName.trim(),
      schoolName: form.schoolName.trim(),
      parentPhonenumber: form.parentPhonenumber.trim(),
      facebookLink: form.facebookLink.trim(),
      birthday: form.birthday || null,
      role: form.role,
    };
    if (form.gender) payload.gender = form.gender as Gender;
    if (form.provinceId) payload.provinceId = Number(form.provinceId);

    setPending(true);
    try {
      const result = await adminUpdateUserAction(user.id, payload);
      const ok = handleActionResult(
        result.errors,
        () => router.refresh(),
        'Cập nhật thông tin thành công',
      );
      if (ok) setOpen(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              size="icon-sm"
              variant="outline"
              className="cursor-pointer"
              aria-label="Sửa thông tin"
            >
              <Pencil />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Sửa thông tin</TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Sửa thông tin tài khoản</DialogTitle>
          <DialogDescription>
            {user.email} — email và mật khẩu không đổi được ở đây.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ProfileContactFields
            values={form}
            onChange={updateContact}
            provinces={provinces}
            disabled={pending}
            idPrefix="edit-"
          />
          <div className="space-y-1.5">
            <Label htmlFor="edit-birthday">Ngày sinh</Label>
            <Input
              id="edit-birthday"
              type="date"
              value={form.birthday}
              onChange={(e) => update('birthday', e.target.value)}
              disabled={pending}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Vai trò</Label>
            <Select
              value={form.role}
              onValueChange={(v) => update('role', v as Role)}
              disabled={pending}
            >
              <SelectTrigger className="w-full cursor-pointer">
                <SelectValue placeholder="Chọn vai trò" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2 pt-2 sm:col-span-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
              className="cursor-pointer"
            >
              Huỷ
            </Button>
            <ActionButton
              type="submit"
              isLoading={pending}
              loadingText="Đang lưu..."
              className="cursor-pointer"
            >
              Lưu thay đổi
            </ActionButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
