'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon, Users, LayoutDashboard, UserRound, School } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const ADMIN_NAV: NavItem[] = [
  { label: 'Người dùng', href: '/admin/users', icon: Users },
  { label: 'Lớp học', href: '/admin/classes', icon: School },
  { label: 'Thông tin cá nhân', href: '/admin/profile', icon: UserRound },
];

export const DASHBOARD_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Thông tin cá nhân', href: '/dashboard/profile', icon: UserRound },
];

interface Props {
  title: string;
  items: NavItem[];
  userEmail?: string;
}

export default function AppSidebar({ title, items, userEmail }: Props) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-sidebar-border border-b">
        <Link
          href="/"
          className="font-paytone text-sidebar-foreground flex h-12 items-center px-2 text-base group-data-[collapsible=icon]:hidden"
        >
          {title}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map(({ label, href, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/');
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton asChild isActive={active} tooltip={label}>
                      <Link href={href}>
                        <Icon />
                        <span>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {userEmail && (
        <SidebarFooter className="border-sidebar-border border-t">
          <div className="text-sidebar-foreground/70 truncate px-2 py-1 text-xs group-data-[collapsible=icon]:hidden">
            {userEmail}
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
