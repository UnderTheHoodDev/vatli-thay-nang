'use client';

import Image from 'next/image';
import { motion } from 'motion/react';
import { ASSETS } from '@/constants/assets';
import { ACHIEVEMENTS } from '@/constants/teacher';

export default function Teacher() {
  return (
    <section id="teacher" className="relative overflow-hidden bg-white py-20">
      {/* Line 2 — large vertical S-curve, right behind the teacher photo */}
      <Image
        src={ASSETS.line2}
        alt=""
        width={500}
        height={1500}
        className="pointer-events-none absolute top-[-5%] left-1/2 z-0 w-[460px] -translate-x-1/2"
      />

      {/* Pattern — two smaller instances, close to center behind person */}
      <Image
        src={ASSETS.pattern}
        alt=""
        width={130}
        height={130}
        className="pointer-events-none absolute top-[18%] left-[34%] z-0 w-[130px]"
      />
      <Image
        src={ASSETS.pattern}
        alt=""
        width={130}
        height={130}
        className="pointer-events-none absolute right-[34%] bottom-[12%] z-0 w-[130px]"
      />

      {/* Line 3 — two outer sides */}
      <Image
        src={ASSETS.line3}
        alt=""
        width={300}
        height={300}
        className="pointer-events-none absolute top-[-4%] left-[-4%] z-0 w-[24%]"
      />
      <Image
        src={ASSETS.line3}
        alt=""
        width={300}
        height={300}
        className="pointer-events-none absolute right-[-4%] bottom-[-4%] z-0 w-[24%] rotate-180"
      />

      <div className="relative z-[1] mx-auto max-w-[1200px] px-6">
        {/* Header */}
        <motion.p
          className="font-cabin mb-2 text-center text-sm font-light tracking-[0.25em] text-[#503c39] uppercase"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          GIÁO VIÊN
        </motion.p>
        <motion.h2
          className="font-paytone mb-2 text-center text-[3rem] text-[#503c39] max-md:text-[2.2rem]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
        >
          NGUYỄN <span className="text-purple">NĂNG</span> LINH
        </motion.h2>
        <motion.div
          className="bg-gold mx-auto mb-12 h-[4px] w-[160px] rounded-full"
          initial={{ scaleX: 0, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.25 }}
        />

        {/* Photo flanked by achievements */}
        <div className="flex items-center gap-6 max-[968px]:flex-col">
          {/* Left achievements — right-aligned, in cards */}
          <div className="flex flex-1 flex-col items-end gap-8 text-right max-[968px]:hidden">
            {[ACHIEVEMENTS[0], ACHIEVEMENTS[2]].map((a, i) => (
              <motion.div
                key={a.title}
                className="max-w-[260px] rounded-2xl bg-white p-4 shadow-[0_4px_18px_rgba(0,0,0,0.08)]"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.55, ease: 'easeOut', delay: i * 0.15 }}
                whileHover={{ y: -4, boxShadow: '0 8px_28px_rgba(0,0,0,0.12)' }}
              >
                <div className="mb-1 text-[2.2rem]">{a.medal}</div>
                <h3
                  className={`font-paytone mb-1 text-[1.25rem] ${
                    a.titleColor === 'pink' ? 'text-pink' : 'text-purple'
                  }`}
                >
                  {a.title}
                </h3>
                <ul className="list-none space-y-1 text-[0.95rem] leading-[1.6] text-[#503c39]">
                  {a.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Center: teacher photo */}
          <motion.div
            className="relative flex-shrink-0"
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.65, ease: 'easeOut', delay: 0.15 }}
          >
            <Image
              src={ASSETS.teacherPhoto}
              alt="Thầy Nguyễn Năng Linh"
              width={360}
              height={480}
              className="relative z-[1] max-h-[480px] w-auto object-contain"
            />
          </motion.div>

          {/* Right achievements — left-aligned, in cards */}
          <div className="flex flex-1 flex-col items-start gap-8 text-left max-[968px]:hidden">
            {[ACHIEVEMENTS[1], ACHIEVEMENTS[3]].map((a, i) => (
              <motion.div
                key={a.title}
                className="max-w-[260px] rounded-2xl bg-white p-4 shadow-[0_4px_18px_rgba(0,0,0,0.08)]"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.55, ease: 'easeOut', delay: i * 0.15 }}
                whileHover={{ y: -4, boxShadow: '0 8px 28px rgba(0,0,0,0.12)' }}
              >
                <div className="mb-1 text-[2.2rem]">{a.medal}</div>
                <h3
                  className={`font-paytone mb-1 text-[1.25rem] ${
                    a.titleColor === 'pink' ? 'text-pink' : 'text-purple'
                  }`}
                >
                  {a.title}
                </h3>
                <ul className="list-none space-y-1 text-[0.95rem] leading-[1.6] text-[#503c39]">
                  {a.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Mobile: 2-col grid below photo */}
          <div className="hidden w-full grid-cols-2 gap-4 max-[968px]:grid">
            {ACHIEVEMENTS.map((a, i) => (
              <motion.div
                key={a.title}
                className="rounded-2xl bg-white p-4 shadow-[0_4px_18px_rgba(0,0,0,0.08)]"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, ease: 'easeOut', delay: i * 0.08 }}
              >
                <div className="mb-1 text-[1.6rem]">{a.medal}</div>
                <h3
                  className={`font-paytone mb-1 text-[0.95rem] ${
                    a.titleColor === 'pink' ? 'text-pink' : 'text-purple'
                  }`}
                >
                  {a.title}
                </h3>
                <ul className="list-none text-[0.8rem] leading-[1.6] text-[#503c39]">
                  {a.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
