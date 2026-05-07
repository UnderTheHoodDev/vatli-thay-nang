'use client';

import Image from 'next/image';
import { motion } from 'motion/react';
import { ASSETS } from '@/constants/assets';

interface HeroFeature {
  icon: string;
  iconAlt: string;
  label: string;
  value: string;
  valueColor: string;
}

const FEATURES: HeroFeature[] = [
  {
    icon: ASSETS.featureContent,
    iconAlt: 'Toàn diện',
    label: 'Nội dung học',
    value: 'TOÀN DIỆN',
    valueColor: 'text-purple',
  },
  {
    icon: ASSETS.featureApproach,
    iconAlt: 'Bản chất',
    label: 'Cách tiếp cận',
    value: 'BẢN CHẤT',
    valueColor: 'text-pink',
  },
  {
    icon: ASSETS.featureOnline,
    iconAlt: 'Online',
    label: 'Lớp học',
    value: 'ONLINE',
    valueColor: 'text-purple',
  },
];

export default function Hero() {
  return (
    <section id="hero" className="bg-light-bg relative flex items-end overflow-hidden pt-25">
      <div className="relative z-1 mx-auto flex w-full max-w-7xl items-end max-[968px]:flex-col max-[968px]:items-center max-[968px]:px-6 max-[968px]:pb-10">
        {/* Left: photo with Line 4 + Pattern behind it */}
        <motion.div
          className="relative flex flex-1 items-end justify-center self-stretch max-[968px]:max-h-[380px] max-[968px]:w-full"
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
        >
          {/* Line 4 — lavender wavy line, main background decorative */}
          <Image
            src={ASSETS.line4}
            alt=""
            width={600}
            height={600}
            className="pointer-events-none absolute top-[8%] left-[-5%] z-0 w-[85%]"
          />
          {/* Pattern — pink plus grid, bottom-right of left column */}
          <Image
            src={ASSETS.pattern}
            alt=""
            width={240}
            height={240}
            className="pointer-events-none absolute right-[-2%] bottom-[18%] z-0 w-[40%]"
          />
          <Image
            src={ASSETS.heroPhoto}
            alt="Thầy Nguyễn Năng Linh"
            width={560}
            height={640}
            className="relative z-[1] max-h-[640px] w-auto object-contain object-bottom max-[968px]:max-h-[340px]"
          />
        </motion.div>

        {/* Right: text content */}
        <div className="relative flex-1 py-16 pr-8 pl-4 max-[968px]:px-0 max-[968px]:py-8 max-[968px]:text-center">
          <motion.h1
            className="font-paytone mb-4 leading-[1.2] text-[#503c39]"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
          >
            {/* "CHINH PHỤC" inline with atom icon */}
            <span className="flex items-center gap-3 text-[2.8rem] max-[968px]:justify-center max-md:text-[2rem]">
              CHINH PHỤC
              <motion.div
                className="flex-shrink-0"
                animate={{ rotate: [-8, 8, -8] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Image
                  src={ASSETS.atomIcon}
                  alt=""
                  width={80}
                  height={80}
                  className="h-20 w-20 max-md:h-12 max-md:w-12"
                />
              </motion.div>
            </span>
            <span className="font-paytone text-purple block text-[2.2rem] max-md:text-[1.6rem]">
              các kì thi học sinh giỏi môn Vật Lí
            </span>
          </motion.h1>

          <motion.p
            className="mb-10 max-w-[440px] text-[1.05rem] leading-[1.6] text-[#503c39] italic max-[968px]:mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.45 }}
          >
            Chắp cánh ước mơ chinh phục các kì thi Vật lí cho học sinh trên mọi miền cả nước cùng
            thầy giáo trẻ Nguyễn Năng Linh
          </motion.p>

          {/* Feature card */}
          <motion.div
            className="flex w-full max-w-[440px] overflow-hidden rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] max-[968px]:mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.6 }}
          >
            {FEATURES.flatMap((feature, i) => {
              const items = [];
              if (i > 0) {
                items.push(
                  <div
                    key={`sep-${i}`}
                    className="h-12 w-px flex-shrink-0 self-center bg-[#e8e8e8]"
                  />,
                );
              }
              items.push(
                <motion.div
                  key={feature.value}
                  className="flex flex-1 flex-col items-center gap-2 py-5"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut', delay: 0.7 + i * 0.1 }}
                >
                  <Image
                    src={feature.icon}
                    alt={feature.iconAlt}
                    width={52}
                    height={52}
                    className="h-13 w-13"
                  />
                  <span className="font-cabin text-[0.85rem] text-[#503c39]">{feature.label}</span>
                  <span className={`font-paytone text-[1.1rem] ${feature.valueColor}`}>
                    {feature.value}
                  </span>
                </motion.div>,
              );
              return items;
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
