'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface ClassStudentSearchValues {
  email: string;
  fullName: string;
}

export const EMPTY_CLASS_STUDENT_SEARCH: ClassStudentSearchValues = {
  email: '',
  fullName: '',
};

interface Props {
  initial: ClassStudentSearchValues;
  onSearch: (values: ClassStudentSearchValues) => void;
}

export default function ClassStudentsSearchForm({ initial, onSearch }: Props) {
  const [values, setValues] = useState<ClassStudentSearchValues>(initial);
  const [prevInitial, setPrevInitial] = useState(initial);

  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setValues(initial);
  }

  function update<K extends keyof ClassStudentSearchValues>(
    key: K,
    value: ClassStudentSearchValues[K],
  ) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSearch(values);
  }

  function reset() {
    setValues(EMPTY_CLASS_STUDENT_SEARCH);
    onSearch(EMPTY_CLASS_STUDENT_SEARCH);
  }

  return (
    <form
      onSubmit={submit}
      className="border-divider grid grid-cols-1 gap-4 rounded-lg border bg-white p-4 md:grid-cols-3"
    >
      <div className="space-y-1.5">
        <Label htmlFor="class-student-email">Email</Label>
        <Input
          id="class-student-email"
          value={values.email}
          onChange={(e) => update('email', e.target.value)}
          placeholder="example@vltn.vn"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="class-student-fullName">Họ và tên</Label>
        <Input
          id="class-student-fullName"
          value={values.fullName}
          onChange={(e) => update('fullName', e.target.value)}
        />
      </div>
      <div className="flex items-end justify-end gap-2">
        <Button type="button" variant="outline" onClick={reset}>
          <X /> Xoá
        </Button>
        <Button type="submit">
          <Search /> Tìm kiếm
        </Button>
      </div>
    </form>
  );
}
