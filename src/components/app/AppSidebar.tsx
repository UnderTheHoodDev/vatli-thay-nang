'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon, Users, LayoutDashboard, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface Props {
  title: string;
  items: NavItem[];
}

export const ADMIN_NAV: NavItem[] = [
  { label: 'Người dùng', href: '/admin/users', icon: Users },
  { label: 'Cài đặt', href: '/admin/settings', icon: Settings },
];

export const DASHBOARD_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Đổi mật khẩu', href: '/auth/change-password', icon: Settings },
];

export default function AppSidebar({ title, items }: Props) {
  const pathname = usePathname();
  return (
    <aside className="md:border-divider hidden md:flex md:w-64 md:flex-col md:border-r md:bg-white">
      <div className="border-divider flex h-16 items-center border-b px-6">
        <Link href="/" className="font-paytone text-purple text-lg">
          {title}
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {items.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-purple/10 text-purple' : 'text-dark hover:bg-divider',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
