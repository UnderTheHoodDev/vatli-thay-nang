import Image from 'next/image';
import Link from 'next/link';
import { ASSETS } from '@/constants/assets';

const HIGHLIGHTS = [
  { value: 'TOÀN DIỆN', label: 'Nội dung học', color: 'text-purple' },
  { value: 'BẢN CHẤT', label: 'Cách tiếp cận', color: 'text-pink' },
  { value: 'ONLINE', label: 'Lớp học', color: 'text-purple' },
];

export default function AuthSplitLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="bg-light-bg relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Image
          src={ASSETS.line4}
          alt=""
          width={600}
          height={600}
          className="pointer-events-none absolute top-[6%] left-[-12%] z-0 w-[70%] opacity-80"
        />
        <Image
          src={ASSETS.pattern}
          alt=""
          width={240}
          height={240}
          className="pointer-events-none absolute right-[-4%] bottom-[8%] z-0 w-[32%]"
        />

        <Link href="/" className="relative z-1 flex items-center gap-3">
          <Image
            src={ASSETS.logo}
            alt="Vật Lí Thầy Năng"
            width={80}
            height={80}
            className="h-20 w-auto"
          />
        </Link>

        <div className="relative z-1 flex flex-1 items-center justify-center py-8">
          <Image
            src={ASSETS.heroPhoto}
            alt="Thầy Nguyễn Năng Linh"
            width={480}
            height={560}
            priority
            className="max-h-110 w-auto object-contain object-bottom"
          />
        </div>

        <div className="relative z-1 space-y-6">
          <h2 className="font-paytone text-brown text-[1.9rem] leading-tight">
            Chinh phục các kì thi
            <span className="text-purple block">học sinh giỏi môn Vật Lí</span>
          </h2>
          <p className="text-brown max-w-md text-sm leading-[1.6] italic">
            Hệ thống quản lý lớp học VLTN — đồng hành cùng thầy giáo trẻ Nguyễn Năng Linh trên hành
            trình chinh phục Vật Lí.
          </p>
          <div className="flex max-w-md overflow-hidden rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
            {HIGHLIGHTS.flatMap((item, i) => {
              const cells = [];
              if (i > 0) {
                cells.push(
                  <div key={`sep-${i}`} className="h-10 w-px shrink-0 self-center bg-[#e8e8e8]" />,
                );
              }
              cells.push(
                <div key={item.value} className="flex flex-1 flex-col items-center gap-1 py-4">
                  <span className="font-cabin text-brown text-[0.78rem]">{item.label}</span>
                  <span className={`font-paytone text-[0.95rem] ${item.color}`}>{item.value}</span>
                </div>,
              );
              return cells;
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center bg-white px-4 py-12 lg:px-16">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 flex items-center gap-3 lg:hidden">
            <Image
              src={ASSETS.logo}
              alt="Vật Lí Thầy Năng"
              width={64}
              height={64}
              className="h-16 w-auto"
            />
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
