'use client';

import { useState, useTransition } from 'react';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { ActionButton } from '@/components/ui/custom';
import { GENDER_OPTIONS, ROLE_OPTIONS } from '@/lib/constants';
import {
  FULL_NAME_MAX_LENGTH,
  VN_PHONE_REGEX,
  VALIDATION_MESSAGES,
} from '@/lib/validation';
import { handleActionResult } from '@/lib/actions';
import { updateProfileAction } from '@/actions/v1/profile/update-profile';
import type { Gender, Province } from '@/types/auth';
import type {
  IUpdateProfilePayload,
  IUserProfile,
} from '@/types/actions/profile';

interface FormState {
  fullName: string;
  gender: Gender | '';
  provinceId: string;
  schoolName: string;
  parentPhonenumber: string;
}

function toForm(profile: IUserProfile): FormState {
  return {
    fullName: profile.fullName ?? '',
    gender: (profile.gender ?? '') as Gender | '',
    provinceId: profile.provinceId ? String(profile.provinceId) : '',
    schoolName: profile.schoolName ?? '',
    parentPhonenumber: profile.parentPhonenumber ?? '',
  };
}

interface Props {
  profile: IUserProfile;
  provinces: Province[];
}

export default function ProfileInfoSection({ profile, provinces }: Props) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>(() => toForm(profile));
  const [provinceOpen, setProvinceOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  function enterEdit() {
    setForm(toForm(profile));
    setEditing(true);
  }

  function cancelEdit() {
    setForm(toForm(profile));
    setEditing(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();

    const fullName = form.fullName.trim();
    if (fullName.length > FULL_NAME_MAX_LENGTH) {
      toast.error(VALIDATION_MESSAGES.FULL_NAME_TOO_LONG);
      return;
    }
    const schoolName = form.schoolName.trim();
    const phone = form.parentPhonenumber.trim();
    if (phone && !VN_PHONE_REGEX.test(phone)) {
      toast.error(VALIDATION_MESSAGES.PHONE_INVALID);
      return;
    }

    const payload: IUpdateProfilePayload = {
      fullName,
      schoolName,
      parentPhonenumber: phone,
    };
    if (form.gender) payload.gender = form.gender as Gender;
    if (form.provinceId) payload.provinceId = Number(form.provinceId);

    startTransition(async () => {
      const result = await updateProfileAction(payload);
      const ok = handleActionResult(result.errors);
      if (ok) {
        toast.success('Thay đổi thông tin cá nhân thành công');
        setEditing(false);
      }
    });
  }

  const roleLabel =
    ROLE_OPTIONS.find((o) => o.value === profile.role)?.label ?? profile.role;
  const genderLabel = profile.gender
    ? (GENDER_OPTIONS.find((o) => o.value === profile.gender)?.label ?? '-')
    : '-';
  const provinceLabel =
    form.provinceId === ''
      ? 'Chọn tỉnh'
      : (provinces.find((p) => String(p.id) === form.provinceId)?.name ??
        'Chọn tỉnh');

  return (
    <section className="border-divider rounded-lg border bg-white p-6">
      <h2 className="font-paytone text-purple mb-4 text-lg">
        Thông tin cá nhân
      </h2>

      {!editing ? (
        <>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
            <ViewField label="Họ và tên" value={profile.fullName} />
            <ViewField label="Giới tính" value={genderLabel} />
            <ViewField label="Tỉnh" value={profile.province} />
            <ViewField label="Trường" value={profile.schoolName} />
            <ViewField
              label="Số điện thoại phụ huynh"
              value={profile.parentPhonenumber}
            />
            <ViewField label="Vai trò" value={roleLabel} />
          </dl>
          <div className="mt-6 flex justify-start">
            <Button onClick={enterEdit}>
              <Pencil /> Chỉnh sửa
            </Button>
          </div>
        </>
      ) : (
        <form
          onSubmit={submit}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Họ và tên</Label>
            <Input
              id="fullName"
              maxLength={FULL_NAME_MAX_LENGTH}
              value={form.fullName}
              onChange={(e) => update('fullName', e.target.value)}
              disabled={pending}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Giới tính</Label>
            <Select
              value={form.gender || undefined}
              onValueChange={(v) => update('gender', v as Gender)}
              disabled={pending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn giới tính" />
              </SelectTrigger>
              <SelectContent>
                {GENDER_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Tỉnh</Label>
            <Popover open={provinceOpen} onOpenChange={setProvinceOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  type="button"
                  className="w-full justify-between font-normal"
                  disabled={pending}
                >
                  <span className="truncate">{provinceLabel}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Tìm tỉnh..." />
                  <CommandList>
                    <CommandEmpty>Không tìm thấy tỉnh</CommandEmpty>
                    <CommandGroup>
                      {provinces.map((p) => (
                        <CommandItem
                          key={p.id}
                          value={p.name}
                          onSelect={() => {
                            update('provinceId', String(p.id));
                            setProvinceOpen(false);
                          }}
                        >
                          {p.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="schoolName">Trường</Label>
            <Input
              id="schoolName"
              value={form.schoolName}
              onChange={(e) => update('schoolName', e.target.value)}
              disabled={pending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="parentPhonenumber">Số điện thoại phụ huynh</Label>
            <Input
              id="parentPhonenumber"
              value={form.parentPhonenumber}
              onChange={(e) => update('parentPhonenumber', e.target.value)}
              placeholder="0xxxxxxxxx"
              disabled={pending}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Vai trò</Label>
            <Input value={roleLabel} disabled readOnly />
          </div>

          <div className="md:col-span-2 flex justify-start gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={cancelEdit}
              disabled={pending}
            >
              Hủy
            </Button>
            <ActionButton
              type="submit"
              isLoading={pending}
              loadingText="Đang lưu..."
            >
              Thay đổi
            </ActionButton>
          </div>
        </form>
      )}
    </section>
  );
}

function ViewField({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-dark mt-1 text-sm font-medium">
        {value && value.length > 0 ? value : '-'}
      </dd>
    </div>
  );
}
