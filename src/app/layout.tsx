import type { Metadata } from "next";
import { Paytone_One, Cabin } from "next/font/google";
import "./globals.css";

const paytoneOne = Paytone_One({
  weight: "400",
  subsets: ["latin", "vietnamese"],
  variable: "--font-paytone",
  display: "swap",
});

const cabin = Cabin({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cabin",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lớp học Vật Lí Thầy Năng",
  description:
    "Chắp cánh ước mơ chinh phục các kì thi Vật lí cho học sinh trên mọi miền cả nước cùng thầy giáo trẻ Nguyễn Năng Linh",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${paytoneOne.variable} ${cabin.variable}`}>
      <body className="overflow-x-hidden bg-light-bg font-cabin text-[#333]">
        {children}
      </body>
    </html>
  );
}
