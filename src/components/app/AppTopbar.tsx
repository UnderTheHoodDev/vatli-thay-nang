'use client';

import { useRouter } from 'next/navigation';
import { LogOut, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { logout } from '@/lib/api/auth';
import { extractErrors } from '@/lib/axios';

interface Props {
  email: string;
  role: string;
}

export default function AppTopbar({ email, role }: Props) {
  const router = useRouter();

  async function handleLogout() {
    try {
      await logout();
      toast.success('Đăng xuất thành công');
      router.replace('/auth/login');
      router.refresh();
    } catch (err) {
      extractErrors(err).forEach((m) => toast.error(m));
    }
  }

  const initial = email.charAt(0).toUpperCase();

  return (
    <header className="border-divider flex h-16 items-center justify-end border-b bg-white px-6">
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
          <DropdownMenuItem onSelect={handleLogout} className="text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
