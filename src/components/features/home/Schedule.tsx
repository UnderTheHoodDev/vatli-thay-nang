'use client';

import Image from 'next/image';
import { motion } from 'motion/react';
import { ASSETS } from '@/constants/assets';

export default function Schedule() {
  return (
    <section id="schedule" className="relative overflow-hidden bg-white py-20">
      {/* Line 1 — purple loopy line, behind the TEXT (left side) */}
      <Image
        src={ASSETS.line1}
        alt=""
        width={580}
        height={580}
        className="pointer-events-none absolute top-[-8%] left-[-5%] z-0 w-[50%]"
      />

      {/* Line 3 — cream curl, behind the SCHEDULE IMAGE (right side) */}
      <Image
        src={ASSETS.line3}
        alt=""
        width={580}
        height={580}
        className="pointer-events-none absolute top-[-5%] right-[-6%] z-0 w-[52%]"
      />

      {/* Pattern — pink plus grid, bottom-right accent */}
      <Image
        src={ASSETS.pattern}
        alt=""
        width={180}
        height={180}
        className="pointer-events-none absolute right-[3%] bottom-[4%] z-0 w-[160px]"
      />

      <div className="relative z-[1] mx-auto flex max-w-[1200px] items-center gap-12 px-6 max-[968px]:flex-col max-[968px]:text-center">
        {/* Text */}
        <motion.div
          className="flex-1"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <h2 className="font-paytone mb-4 leading-[1.25]">
            {/* "Lịch học" dark + inline yellow brush stroke */}
            <span className="flex items-center gap-4 text-[2.8rem] text-[#503c39] max-[968px]:justify-center max-md:text-[2rem]">
              Lịch học
              <span className="bg-gold inline-block h-[7px] w-[90px] -rotate-2 rounded-full" />
            </span>
            {/* "Các lớp năm học" purple */}
            <span className="text-purple block text-[2.8rem] max-md:text-[2.2rem]">
              Các lớp năm học
            </span>
          </h2>
          <motion.div
            className="bg-pink font-paytone inline-block rounded-[10px] px-6 py-2.5 text-[1.2rem] text-white"
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.4, ease: 'easeOut', delay: 0.25 }}
            whileHover={{ scale: 1.05 }}
          >
            2025-2026
          </motion.div>
        </motion.div>

        {/* Schedule image */}
        <motion.div
          className="flex flex-1 justify-center"
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.65, ease: 'easeOut', delay: 0.1 }}
        >
          <Image
            src={ASSETS.scheduleImage}
            alt="Lịch học các lớp"
            width={560}
            height={560}
            className="max-h-[560px] max-w-full rounded-[20px] object-contain"
          />
        </motion.div>
      </div>
    </section>
  );
}
