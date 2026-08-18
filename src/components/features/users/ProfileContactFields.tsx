'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ProvinceCombobox from './ProvinceCombobox';
import { GENDER_OPTIONS } from '@/lib/constants';
import type { Gender, Province } from '@/types/auth';

export interface ProfileContactValues {
  fullName: string;
  gender: Gender | '';
  provinceId: string;
  schoolName: string;
  parentPhonenumber: string;
  facebookLink: string;
}

interface Props {
  values: ProfileContactValues;
  onChange: <K extends keyof ProfileContactValues>(key: K, value: ProfileContactValues[K]) => void;
  provinces: Province[];
  disabled?: boolean;
  idPrefix: string;
}

export default function ProfileContactFields({
  values,
  onChange,
  provinces,
  disabled,
  idPrefix,
}: Props) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}fullName`}>Họ và tên</Label>
        <Input
          id={`${idPrefix}fullName`}
          value={values.fullName}
          onChange={(e) => onChange('fullName', e.target.value)}
          disabled={disabled}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Giới tính</Label>
        <Select
          value={values.gender || undefined}
          onValueChange={(v) => onChange('gender', v as Gender)}
          disabled={disabled}
        >
          <SelectTrigger className="w-full cursor-pointer">
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
        <ProvinceCombobox
          value={values.provinceId}
          onChange={(v) => onChange('provinceId', v)}
          provinces={provinces}
          disabled={disabled}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}schoolName`}>Trường</Label>
        <Input
          id={`${idPrefix}schoolName`}
          value={values.schoolName}
          onChange={(e) => onChange('schoolName', e.target.value)}
          disabled={disabled}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}parentPhonenumber`}>Số điện thoại phụ huynh</Label>
        <Input
          id={`${idPrefix}parentPhonenumber`}
          value={values.parentPhonenumber}
          onChange={(e) => onChange('parentPhonenumber', e.target.value)}
          placeholder="0xxxxxxxxx"
          disabled={disabled}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}facebookLink`}>Link Facebook</Label>
        <Input
          id={`${idPrefix}facebookLink`}
          type="url"
          value={values.facebookLink}
          onChange={(e) => onChange('facebookLink', e.target.value)}
          placeholder="https://facebook.com/..."
          maxLength={255}
          disabled={disabled}
        />
      </div>
    </>
  );
}
