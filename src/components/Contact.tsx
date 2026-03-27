import Image from "next/image";
import { ASSETS } from "@/data/assets";

interface ContactDetail {
  icon: string;
  iconAlt: string;
  text: string;
}

const CONTACT_DETAILS: ContactDetail[] = [
  {
    icon: ASSETS.iconPhone,
    iconAlt: "Phone",
    text: "085.767.3859 (Quản lí Xuân Hương)",
  },
  {
    icon: ASSETS.iconMail,
    iconAlt: "Email",
    text: "vatlithaynang@gmail.com",
  },
  {
    icon: ASSETS.iconLocation,
    iconAlt: "Location",
    text: "21A, ngõ 255, Cầu Giấy, Hà Nội",
  },
];

const BUSINESS_INFO = [
  "Mã số thuế: 038203003063",
  "Cấp ngày: 31/10/2025",
  "Nơi cấp: Sở kế hoạch đầu tư Thành phố Hà Nội",
];

export default function Contact() {
  return (
    <section id="contact" className="relative overflow-hidden bg-light-bg py-20">
      {/* Decorative elements */}
      <Image
        src={ASSETS.line2}
        alt=""
        width={400}
        height={400}
        className="pointer-events-none absolute top-0 left-[-5%] z-0 w-[35%] opacity-30"
      />
      <Image
        src={ASSETS.pattern}
        alt=""
        width={250}
        height={250}
        className="pointer-events-none absolute right-0 bottom-0 z-0 w-[250px] opacity-15"
      />

      <div className="relative z-[1] mx-auto flex max-w-[1200px] gap-16 px-6 max-[968px]:flex-col">
        {/* Form */}
        <div className="flex-1">
          <form>
            <div className="mb-4">
              <label
                htmlFor="fullname"
                className="mb-1.5 block text-[0.95rem] font-semibold text-[#555]"
              >
                Họ và tên
              </label>
              <input
                type="text"
                id="fullname"
                name="fullname"
                placeholder="Nhập họ và tên"
                className="w-full rounded-[10px] border-2 border-input-border px-4 py-3 font-cabin text-base outline-none transition-colors duration-200 focus:border-purple"
              />
            </div>
            <div className="flex gap-4 max-[968px]:flex-col">
              <div className="mb-4 flex-1">
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-[0.95rem] font-semibold text-[#555]"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Nhập email"
                  className="w-full rounded-[10px] border-2 border-input-border px-4 py-3 font-cabin text-base outline-none transition-colors duration-200 focus:border-purple"
                />
              </div>
              <div className="mb-4 flex-1">
                <label
                  htmlFor="phone"
                  className="mb-1.5 block text-[0.95rem] font-semibold text-[#555]"
                >
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  placeholder="Nhập số điện thoại"
                  className="w-full rounded-[10px] border-2 border-input-border px-4 py-3 font-cabin text-base outline-none transition-colors duration-200 focus:border-purple"
                />
              </div>
            </div>
            <button
              type="submit"
              className="mt-2 cursor-pointer rounded-full border-none bg-pink px-7 py-3 font-paytone text-[0.95rem] text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-pink-dark"
            >
              Gửi thông tin
            </button>
          </form>
          <div className="mt-5 flex gap-2">
            <Image
              src={ASSETS.iconSocial}
              alt="Facebook, TikTok, YouTube"
              width={80}
              height={80}
              className="h-20 w-auto"
            />
          </div>
        </div>

        {/* Contact info */}
        <div className="flex-1">
          <h2 className="mb-2 font-paytone text-[2.4rem] text-purple">
            Liên hệ
          </h2>
          <p className="mb-6 font-paytone text-base text-[#555]">
            Hộ kinh doanh VẬT LÍ THẦY NĂNG
          </p>
          {CONTACT_DETAILS.map((detail) => (
            <div key={detail.iconAlt} className="mb-4 flex items-center gap-3">
              <Image
                src={detail.icon}
                alt={detail.iconAlt}
                width={36}
                height={36}
                className="h-9 w-9 rounded-lg"
              />
              <span className="text-[0.95rem] text-[#555]">{detail.text}</span>
            </div>
          ))}
          <ul className="mt-6 border-l-[3px] border-pink pl-4">
            {BUSINESS_INFO.map((info) => (
              <li
                key={info}
                className="ml-3 list-disc text-[0.85rem] leading-[1.8] text-[#777]"
              >
                {info}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
