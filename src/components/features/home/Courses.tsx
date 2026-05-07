'use client';

import Image from 'next/image';
import { motion } from 'motion/react';
import { MAIN_COURSES, UPCOMING_COURSES } from '@/constants/courses';
import { ASSETS } from '@/constants/assets';

export default function Courses() {
  return (
    <section id="courses" className="bg-light-bg relative overflow-hidden py-20">
      {/* Line 4 — large diagonal S-curve, left side */}
      <Image
        src={ASSETS.line4}
        alt=""
        width={560}
        height={560}
        className="pointer-events-none absolute top-[-8%] left-[-8%] z-0 w-[46%]"
      />
      {/* Pattern — bottom-right background accent */}
      <Image
        src={ASSETS.pattern}
        alt=""
        width={200}
        height={200}
        className="pointer-events-none absolute right-[2%] bottom-[6%] z-0 w-[180px]"
      />

      <div className="relative z-[1] mx-auto flex max-w-[1200px] gap-8 px-6 max-[968px]:flex-col">
        {/* Main courses */}
        <div className="flex flex-2 gap-6 max-[968px]:flex-col">
          {MAIN_COURSES.map((course, i) => (
            <motion.div
              key={course.titleMain}
              className="flex flex-1 flex-col rounded-[20px] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, ease: 'easeOut', delay: i * 0.12 }}
              whileHover={{ y: -6, boxShadow: '0 12px 32px rgba(0,0,0,0.10)' }}
            >
              <div className="mb-4 w-full overflow-hidden rounded-xl">
                <motion.div whileHover={{ scale: 1.04 }} transition={{ duration: 0.35 }}>
                  <Image
                    src={course.image}
                    alt={course.imageAlt}
                    width={400}
                    height={220}
                    className="h-[220px] w-full object-cover"
                  />
                </motion.div>
              </div>
              <h3 className="font-paytone mb-1">
                <span className="font-cabin block text-[0.9rem] font-normal text-[#503c39]">
                  {course.titlePrefix}
                </span>
                <span className="text-pink block text-[1.4rem]">{course.titleMain}</span>
              </h3>
              <p className="mb-1 text-[0.95rem] text-[#503c39] line-through">{course.price}</p>
              <p className="mb-3 text-[0.85rem] leading-[1.5] text-[#503c39]">
                {course.promoText} <strong className="text-pink">{course.promoPrice}</strong>
                <br />
                {course.promoRange}
              </p>
              <div className="mt-auto flex items-center justify-between">
                <a
                  href="#contact"
                  className="bg-pink font-paytone hover:bg-pink-dark inline-block cursor-pointer rounded-full border-none px-6 py-2.5 text-[0.9rem] text-white no-underline transition-all duration-200 hover:-translate-y-0.5"
                >
                  ĐĂNG KÍ
                </a>
                <span className="text-[0.85rem] text-[#503c39]">{course.dateRange}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Sidebar: upcoming */}
        <div className="flex flex-1 flex-col gap-4">
          <motion.span
            className="font-paytone self-end rounded-[20px] bg-[#dbeafe] px-5 py-2 text-[0.85rem] text-[#2563eb]"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            SẮP TỚI
          </motion.span>
          {UPCOMING_COURSES.map((course, i) => (
            <motion.div
              key={course.title}
              className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-[0_2px_12px_rgba(0,0,0,0.05)]"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, ease: 'easeOut', delay: i * 0.1 }}
              whileHover={{ x: 4 }}
            >
              <Image
                src={course.image}
                alt={course.imageAlt}
                width={100}
                height={100}
                className="h-[100px] w-[100px] rounded-xl object-cover"
              />
              <div>
                <h4 className="font-paytone mb-0.5 text-[0.95rem] text-[#2563eb]">
                  {course.title}
                </h4>
                <p className="text-[0.8rem] text-[#503c39]">{course.subtitle}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
