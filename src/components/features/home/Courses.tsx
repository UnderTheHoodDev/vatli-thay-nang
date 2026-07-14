'use client';

import Image from 'next/image';
import { motion } from 'motion/react';
import { BookOpen, CalendarClock } from 'lucide-react';
import { ASSETS } from '@/constants/assets';
import type { PublicCourse } from '@/types/course-management';

interface Props {
  courses: PublicCourse[];
  upcoming: PublicCourse[];
}

function formatPrice(v: number): string {
  if (!v || v <= 0) return 'Miễn phí';
  return `${v.toLocaleString('vi-VN')} VNĐ`;
}

function formatStartDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `Khai giảng ${dd}/${mm}/${d.getUTCFullYear()}`;
}

function monthYear(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
}

function formatDateRange(start: string | null, end: string | null): string | null {
  if (start && end) return `${monthYear(start)} đến ${monthYear(end)}`;
  if (start) return `Từ ${monthYear(start)}`;
  if (end) return `Đến ${monthYear(end)}`;
  return null;
}

function OpenCard({ course, index }: { course: PublicCourse; index: number }) {
  const dateRange = formatDateRange(course.startDate, course.endDate);
  return (
    <motion.div
      className="flex flex-col rounded-[20px] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, ease: 'easeOut', delay: (index % 2) * 0.12 }}
      whileHover={{ y: -6, boxShadow: '0 12px 32px rgba(0,0,0,0.10)' }}
    >
      <div className="mb-4 w-full overflow-hidden rounded-xl">
        <motion.div whileHover={{ scale: 1.04 }} transition={{ duration: 0.35 }}>
          {course.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              loading="lazy"
              className="h-[220px] w-full object-cover"
            />
          ) : (
            <div className="text-purple/30 flex h-[220px] w-full items-center justify-center bg-[#f0eff5]">
              <BookOpen className="size-12" />
            </div>
          )}
        </motion.div>
      </div>
      <h3 className="font-paytone mb-1">
        {course.category?.name && (
          <span className="font-cabin block text-[0.9rem] font-normal text-[#503c39]">
            {course.category.name}
          </span>
        )}
        <span className="text-pink block text-[1.4rem]">{course.title}</span>
      </h3>
      {course.description && (
        <p className="mb-3 line-clamp-2 text-[0.85rem] leading-[1.5] text-[#503c39]">
          {course.description}
        </p>
      )}
      <div className="mt-auto">
        <p className="text-pink font-paytone mb-2 text-[1rem]">{formatPrice(course.price)}</p>
        <div className="flex items-center justify-between gap-2">
          <a
            href="#contact"
            className="bg-pink font-paytone hover:bg-pink-dark inline-block cursor-pointer rounded-full border-none px-6 py-2.5 text-[0.9rem] text-white no-underline transition-all duration-200 hover:-translate-y-0.5"
          >
            ĐĂNG KÍ
          </a>
          {dateRange && (
            <span className="text-right text-[0.8rem] text-[#503c39]">{dateRange}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function UpcomingCard({ course, index }: { course: PublicCourse; index: number }) {
  return (
    <motion.div
      className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-[0_2px_12px_rgba(0,0,0,0.05)]"
      initial={{ opacity: 0, x: 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, ease: 'easeOut', delay: index * 0.1 }}
      whileHover={{ x: 4 }}
    >
      {course.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={course.thumbnailUrl}
          alt={course.title}
          loading="lazy"
          className="h-[100px] w-[100px] shrink-0 rounded-xl object-cover"
        />
      ) : (
        <div className="text-purple/30 flex h-[100px] w-[100px] shrink-0 items-center justify-center rounded-xl bg-[#f0eff5]">
          <BookOpen className="size-8" />
        </div>
      )}
      <div className="min-w-0">
        <h4 className="font-paytone mb-0.5 line-clamp-2 text-[0.95rem] text-[#2563eb]">
          {course.title}
        </h4>
        <p className="text-[0.8rem] text-[#503c39]">
          {course.startDate ? formatStartDate(course.startDate) : formatPrice(course.price)}
        </p>
      </div>
    </motion.div>
  );
}

export default function Courses({ courses, upcoming }: Props) {
  return (
    <section id="courses" className="bg-light-bg relative overflow-hidden py-20">
      <Image
        src={ASSETS.line4}
        alt=""
        width={560}
        height={560}
        className="pointer-events-none absolute top-[-8%] left-[-8%] z-0 w-[46%]"
      />
      <Image
        src={ASSETS.pattern}
        alt=""
        width={200}
        height={200}
        className="pointer-events-none absolute right-[2%] bottom-[6%] z-0 w-[180px]"
      />

      <div className="relative z-[1] mx-auto flex max-w-[1200px] flex-col gap-8 px-6 min-[969px]:flex-row">
        <div className="min-[969px]:flex-2">
          {courses.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {courses.map((course, i) => (
                <OpenCard key={course.id} course={course} index={i} />
              ))}
            </div>
          ) : (
            <div className="rounded-[20px] bg-white/70 py-16 text-center shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
              <BookOpen className="text-purple/40 mx-auto mb-3 size-12" />
              <p className="font-cabin text-[1rem] text-[#503c39]">
                Các khóa học sẽ sớm được cập nhật. Vui lòng quay lại sau!
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 min-[969px]:flex-1">
          <motion.span
            className="font-paytone self-end rounded-[20px] bg-[#dbeafe] px-5 py-2 text-[0.85rem] text-[#2563eb]"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            SẮP TỚI
          </motion.span>
          {upcoming.length > 0 ? (
            upcoming.map((course, i) => <UpcomingCard key={course.id} course={course} index={i} />)
          ) : (
            <div className="rounded-2xl bg-white/70 p-6 text-center shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
              <CalendarClock className="mx-auto mb-2 size-8 text-[#2563eb]/40" />
              <p className="font-cabin text-[0.85rem] text-[#503c39]">
                Các khóa học sắp tới sẽ sớm được cập nhật.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
