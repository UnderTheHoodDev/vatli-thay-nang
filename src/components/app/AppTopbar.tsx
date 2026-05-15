'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { handleActionResult } from '@/lib/actions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { logoutAction } from '@/actions/v1/auth/logout';

interface Props {
  email: string;
  role: string;
}

export default function AppTopbar({ email, role }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      try {
        const result = await logoutAction();
        const succeeded = handleActionResult(result.errors, () => {
          if (result.redirectTo) {
            router.push(result.redirectTo);
          }
        });
        if (succeeded) {
          toast.success('Đăng xuất thành công');
        }
      } finally {
      }
    });
  }

  const initial = email.charAt(0).toUpperCase();

  return (
    <header className="border-divider flex h-16 items-center justify-between border-b bg-white px-4 md:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-5" />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger className="hover:bg-divider flex items-center gap-2 rounded-md px-2 py-1.5 text-sm">
          <Avatar>
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          <div className="hidden text-left sm:block">
            <div className="text-dark text-sm font-medium">{email}</div>
            <div className="text-xs text-gray-500">{role === 'ADMIN' ? 'Admin' : 'Học sinh'}</div>
          </div>
          <ChevronDown className="h-4 w-4 opacity-60" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleLogout} disabled={pending} className="text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            {pending ? 'Đang đăng xuất...' : 'Đăng xuất'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
