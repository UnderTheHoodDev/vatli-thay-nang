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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ActionButton } from '@/components/ui/custom';
import { handleActionResult } from '@/lib/actions';
import { toDateInputValue } from '@/lib/format';
import { validateProfileContact } from '@/lib/validation';
import { adminUpdateUserAction } from '@/actions/v1/users/admin-update-user';
import ProfileContactFields, {
  type ProfileContactValues,
} from './ProfileContactFields';
import type { Gender, Province, UserRow } from '@/types/auth';
import type { IAdminUpdateUserPayload } from '@/types/actions/users';

interface FormState extends ProfileContactValues {
  birthday: string;
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
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="cursor-pointer">
          <Pencil /> Sửa
        </Button>
      </DialogTrigger>
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
