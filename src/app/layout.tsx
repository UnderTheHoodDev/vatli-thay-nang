import type { Metadata } from 'next';
import { Paytone_One, Cabin } from 'next/font/google';
import NextTopLoader from 'nextjs-toploader';
import { ReactQueryProvider } from '@/lib/react-query/provider';
import '@/styles/globals.css';

const paytoneOne = Paytone_One({
  weight: '400',
  subsets: ['latin', 'vietnamese'],
  variable: '--font-paytone',
  display: 'swap',
});

const cabin = Cabin({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cabin',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Lớp học Vật Lí Thầy Năng',
  description:
    'Chắp cánh ước mơ chinh phục các kì thi Vật lí cho học sinh trên mọi miền cả nước cùng thầy giáo trẻ Nguyễn Năng Linh',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${paytoneOne.variable} ${cabin.variable}`}>
      <body className="bg-light-bg font-cabin overflow-x-hidden text-[#333]">
        <NextTopLoader color="#723bcf" showSpinner={false} />
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </body>
    </html>
  );
}
