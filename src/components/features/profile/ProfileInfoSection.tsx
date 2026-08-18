'use client';

import { useState, useTransition } from 'react';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActionButton } from '@/components/ui/custom';
import { ROLE_OPTIONS, GENDER_OPTIONS } from '@/lib/constants';
import { validateProfileContact } from '@/lib/validation';
import { handleActionResult } from '@/lib/actions';
import { updateProfileAction } from '@/actions/v1/profile/update-profile';
import ProfileContactFields, {
  type ProfileContactValues,
} from '@/components/features/users/ProfileContactFields';
import type { Gender, Province } from '@/types/auth';
import type { IUpdateProfilePayload, IUserProfile } from '@/types/actions/profile';

type FormState = ProfileContactValues;

function toForm(profile: IUserProfile): FormState {
  return {
    fullName: profile.fullName ?? '',
    gender: (profile.gender ?? '') as Gender | '',
    provinceId: profile.provinceId ? String(profile.provinceId) : '',
    schoolName: profile.schoolName ?? '',
    parentPhonenumber: profile.parentPhonenumber ?? '',
    facebookLink: profile.facebookLink ?? '',
  };
}

interface Props {
  profile: IUserProfile;
  provinces: Province[];
}

export default function ProfileInfoSection({ profile, provinces }: Props) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>(() => toForm(profile));
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

    const error = validateProfileContact(form);
    if (error) {
      toast.error(error);
      return;
    }

    const payload: IUpdateProfilePayload = {
      fullName: form.fullName.trim(),
      schoolName: form.schoolName.trim(),
      parentPhonenumber: form.parentPhonenumber.trim(),
      facebookLink: form.facebookLink.trim(),
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

  const roleLabel = ROLE_OPTIONS.find((o) => o.value === profile.role)?.label ?? profile.role;
  const genderLabel = profile.gender
    ? (GENDER_OPTIONS.find((o) => o.value === profile.gender)?.label ?? '—')
    : '—';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin chi tiết</CardTitle>
        <p className="text-muted-foreground mt-1 text-sm">Thông tin liên hệ và hồ sơ học sinh.</p>
      </CardHeader>
      <CardContent className="pb-6">
        {!editing ? (
          <div className="space-y-6">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
              <ViewField label="Họ và tên" value={profile.fullName} />
              <ViewField label="Giới tính" value={genderLabel} />
              <ViewField label="Tỉnh" value={profile.province} />
              <ViewField label="Trường" value={profile.schoolName} />
              <ViewField label="Số điện thoại phụ huynh" value={profile.parentPhonenumber} />
              <ViewField label="Link Facebook" value={profile.facebookLink} isLink />
              <ViewField label="Vai trò" value={roleLabel} />
            </dl>
            <div className="flex justify-start pt-2">
              <Button onClick={enterEdit} className="cursor-pointer">
                <Pencil /> Chỉnh sửa
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ProfileContactFields
              values={form}
              onChange={update}
              provinces={provinces}
              disabled={pending}
              idPrefix=""
            />
            <div className="space-y-1.5">
              <Label>Vai trò</Label>
              <Input value={roleLabel} disabled readOnly />
            </div>

            <div className="flex justify-start gap-2 pt-2 md:col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={cancelEdit}
                disabled={pending}
                className="cursor-pointer"
              >
                Hủy
              </Button>
              <ActionButton
                type="submit"
                isLoading={pending}
                loadingText="Đang lưu..."
                className="cursor-pointer"
              >
                Lưu thay đổi
              </ActionButton>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function ViewField({
  label,
  value,
  isLink,
}: {
  label: string;
  value: string | null | undefined;
  isLink?: boolean;
}) {
  return (
    <div className="space-y-1">
      <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</dt>
      <dd className="text-foreground text-sm font-medium">
        {value && value.length > 0 ? (
          isLink ? (
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple break-all hover:underline"
            >
              {value}
            </a>
          ) : (
            value
          )
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </dd>
    </div>
  );
}
