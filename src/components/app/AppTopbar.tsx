'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, ChevronDown, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
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
      const result = await logoutAction();
      const succeeded = handleActionResult(result.errors, () => {
        if (result.redirectTo) {
          router.push(result.redirectTo);
        }
      });
      if (succeeded) {
        toast.success('Đăng xuất thành công');
      }
    });
  }

  const initial = email.charAt(0).toUpperCase();
  const isAdmin = role === 'ADMIN';
  const roleLabel = isAdmin ? 'Quản trị viên' : 'Học sinh';
  const profileHref = isAdmin ? '/admin/profile' : '/dashboard/profile';

  return (
    <header className="border-divider bg-background/85 sticky top-0 z-30 flex h-16 items-center justify-between border-b px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:-ml-1" />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors">
          <Avatar className="bg-primary text-primary-foreground size-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
              {initial}
            </AvatarFallback>
          </Avatar>
          <div className="hidden text-left sm:block">
            <div className="text-foreground max-w-45 truncate text-sm font-medium">{email}</div>
            <div className="text-muted-foreground text-xs">{roleLabel}</div>
          </div>
          <ChevronDown className="text-muted-foreground size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="text-foreground truncate text-sm">{email}</span>
            <span className="text-muted-foreground text-xs font-normal">{roleLabel}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={profileHref} className="cursor-pointer">
              <UserRound className="mr-2 size-4" />
              Thông tin cá nhân
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={handleLogout}
            disabled={pending}
            className="text-destructive focus:text-destructive cursor-pointer"
          >
            <LogOut className="mr-2 size-4" />
            {pending ? 'Đang đăng xuất...' : 'Đăng xuất'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
