'use client';

import Image from 'next/image';
import { motion } from 'motion/react';
import { ASSETS } from '@/constants/assets';
import { FaFacebook, FaYoutube } from 'react-icons/fa';
import { SiTiktok } from 'react-icons/si';
import { Phone, Mail, MapPin, LucideIcon } from 'lucide-react';

interface ContactDetail {
  Icon: LucideIcon;
  label: string;
  text: string;
}

const CONTACT_DETAILS: ContactDetail[] = [
  { Icon: Phone, label: 'Phone', text: '085.767.3859 (Quản lí Xuân Hương)' },
  { Icon: Mail, label: 'Email', text: 'vatlithaynang@gmail.com' },
  {
    Icon: MapPin,
    label: 'Location',
    text: '21A, ngõ 255, đường Cầu Giấy, phường Cầu Giấy, Hà Nội',
  },
];

const BUSINESS_INFO = [
  'Mã số thuế: 038203003063',
  'Cấp ngày: 30/11/2025',
  'Nơi cấp: Phòng Kinh tế, Hạ tầng và Đô thị UBND Phường Cầu Giấy',
];

const SOCIAL_LINKS = [
  {
    href: 'https://facebook.com/vatlithaynang',
    label: 'Facebook',
    icon: <FaFacebook size={32} />,
    color: '#1877F2',
  },
  {
    href: 'https://tiktok.com/@vatlithaynang',
    label: 'TikTok',
    icon: <SiTiktok size={28} />,
    color: '#000000',
  },
  {
    href: 'https://youtube.com/@vatlithaynang',
    label: 'YouTube',
    icon: <FaYoutube size={32} />,
    color: '#FF0000',
  },
];

export default function Contact() {
  return (
    <section id="contact" className="bg-light-bg relative overflow-hidden py-20">
      {/* Decorative elements */}
      <Image
        src={ASSETS.line2}
        alt=""
        width={400}
        height={400}
        className="pointer-events-none absolute top-0 left-[-5%] z-0 w-[35%]"
      />
      <Image
        src={ASSETS.pattern}
        alt=""
        width={250}
        height={250}
        className="pointer-events-none absolute right-0 bottom-0 z-0 w-[250px]"
      />

      <div className="relative z-[1] mx-auto flex max-w-[1200px] gap-16 px-6 max-[968px]:flex-col">
        {/* Form */}
        <motion.div
          className="flex-1"
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <form>
            <motion.div
              className="mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
            >
              <label
                htmlFor="fullname"
                className="mb-1.5 block text-[0.95rem] font-semibold text-[#503c39]"
              >
                Họ và tên
              </label>
              <input
                type="text"
                id="fullname"
                name="fullname"
                placeholder="Nhập họ và tên"
                className="border-input-border font-cabin focus:border-purple w-full rounded-[10px] border-2 px-4 py-3 text-base transition-colors duration-200 outline-none"
              />
            </motion.div>
            <div className="flex gap-4 max-[968px]:flex-col">
              <motion.div
                className="mb-4 flex-1"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.4, ease: 'easeOut', delay: 0.2 }}
              >
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-[0.95rem] font-semibold text-[#503c39]"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Nhập email"
                  className="border-input-border font-cabin focus:border-purple w-full rounded-[10px] border-2 px-4 py-3 text-base transition-colors duration-200 outline-none"
                />
              </motion.div>
              <motion.div
                className="mb-4 flex-1"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.4, ease: 'easeOut', delay: 0.3 }}
              >
                <label
                  htmlFor="phone"
                  className="mb-1.5 block text-[0.95rem] font-semibold text-[#503c39]"
                >
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  placeholder="Nhập số điện thoại"
                  className="border-input-border font-cabin focus:border-purple w-full rounded-[10px] border-2 px-4 py-3 text-base transition-colors duration-200 outline-none"
                />
              </motion.div>
            </div>
            <motion.button
              type="submit"
              className="bg-pink font-paytone hover:bg-pink-dark mt-2 cursor-pointer rounded-full border-none px-7 py-3 text-[0.95rem] text-white transition-all duration-200 hover:-translate-y-0.5"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: 0.4 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              Gửi thông tin
            </motion.button>
          </form>

          {/* Social icons */}
          <div className="mt-6 flex items-center gap-4">
            {SOCIAL_LINKS.map(({ href, label, icon, color }, i) => (
              <motion.a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                style={{ color }}
                className="transition-transform duration-200 hover:-translate-y-0.5"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{
                  duration: 0.35,
                  ease: 'easeOut',
                  delay: 0.5 + i * 0.08,
                }}
                whileHover={{ scale: 1.2, y: -3 }}
              >
                {icon}
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Contact info */}
        <motion.div
          className="flex-1"
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
        >
          <h2 className="font-paytone text-purple mb-2 text-[2.4rem]">Liên hệ</h2>
          <p className="font-paytone mb-6 text-base text-[#503c39]">
            Hộ kinh doanh VẬT LÍ THẦY NĂNG
          </p>
          {CONTACT_DETAILS.map(({ Icon, label, text }, i) => (
            <motion.div
              key={label}
              className="mb-4 flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{
                duration: 0.4,
                ease: 'easeOut',
                delay: 0.2 + i * 0.1,
              }}
            >
              <div className="bg-pink flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl">
                <Icon size={20} color="white" strokeWidth={1.8} />
              </div>
              <span className="text-[0.95rem] text-[#503c39]">{text}</span>
            </motion.div>
          ))}
          <motion.ul
            className="border-pink mt-6 border-l-[3px] pl-4"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.4, ease: 'easeOut', delay: 0.55 }}
          >
            {BUSINESS_INFO.map((info) => (
              <li key={info} className="ml-3 list-disc text-[0.85rem] leading-[1.8] text-[#503c39]">
                {info}
              </li>
            ))}
          </motion.ul>
        </motion.div>
      </div>
    </section>
  );
}
