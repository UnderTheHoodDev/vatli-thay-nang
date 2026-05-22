'use client';

import { useState, useTransition } from 'react';
import { Plus, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { FormTextField, ActionButton } from '@/components/ui/custom';
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

export default function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [pending, startTransition] = useTransition();

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <Plus /> Tạo user
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo tài khoản mới</DialogTitle>
          <DialogDescription>
            Hệ thống sẽ gửi mail kích hoạt đến email được nhập bên dưới.
          </DialogDescription>
        </DialogHeader>
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
      </DialogContent>
    </Dialog>
  );
}
