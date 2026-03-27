export interface MenuItem {
  label: string;
  href: string;
  isButton?: boolean;
}

export const MENU_ITEMS: MenuItem[] = [
  { label: "Trang chủ", href: "#hero" },
  { label: "Khoá học", href: "#courses" },
  { label: "Giáo viên", href: "#teacher" },
  { label: "Lịch học", href: "#schedule" },
  { label: "ĐĂNG KÍ", href: "#contact", isButton: true },
];
