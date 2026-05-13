'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { confirmActivation } from '@/lib/api/auth';
import { extractErrors } from '@/lib/axios';

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{6,}$/;

interface Props {
  token: string;
  email: string;
}

export default function ActivationForm({ token, email }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [step, setStep] = useState<'intro' | 'form'>('intro');

  const mutation = useMutation({
    mutationFn: () => confirmActivation(token, password),
    onSuccess: () => {
      toast.success('Tài khoản đã được kích hoạt');
      router.replace('/dashboard');
      router.refresh();
    },
    onError: (err) => {
      extractErrors(err).forEach((m) => toast.error(m));
    },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!PASSWORD_REGEX.test(password)) {
      toast.error('Mật khẩu cần ≥6 ký tự, có 1 chữ hoa và 1 chữ số');
      return;
    }
    if (password !== confirm) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    mutation.mutate();
  }

  if (step === 'intro') {
    return (
      <div className="space-y-4 text-center">
        <h1 className="font-paytone text-purple text-2xl">Kích hoạt tài khoản</h1>
        <p className="text-sm text-gray-600">
          Tài khoản <span className="font-medium">{email}</span> đã sẵn sàng. Vui lòng ấn vào nút
          dưới đây để đặt mật khẩu và kích hoạt tài khoản.
        </p>
        <Button className="w-full" onClick={() => setStep('form')}>
          Kích hoạt tài khoản
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1">
        <h1 className="font-paytone text-purple text-2xl">Đặt mật khẩu</h1>
        <p className="text-sm text-gray-500">
          Mật khẩu cần có ít nhất 1 chữ hoa, 1 số, độ dài tối thiểu 6 ký tự.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Mật khẩu</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm">Xác nhận mật khẩu</Label>
        <Input
          id="confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? 'Đang kích hoạt...' : 'Kích hoạt'}
      </Button>
    </form>
  );
}
