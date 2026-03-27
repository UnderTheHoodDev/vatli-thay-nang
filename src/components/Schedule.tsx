import Image from "next/image";
import { ASSETS } from "@/data/assets";

export default function Schedule() {
  return (
    <section id="schedule" className="relative overflow-hidden bg-white py-20">
      {/* Decorative line */}
      <Image
        src={ASSETS.line4}
        alt=""
        width={500}
        height={500}
        className="pointer-events-none absolute bottom-0 left-[-5%] z-0 w-[40%] opacity-[0.1]"
      />

      <div className="relative z-[1] mx-auto flex max-w-[1200px] items-center gap-12 px-6 max-[968px]:flex-col max-[968px]:text-center">
        {/* Text */}
        <div className="flex-1">
          <h2 className="mb-2 font-paytone text-[2.4rem] leading-[1.2] text-purple max-md:text-[1.8rem]">
            Lịch học
            <span className="block font-paytone text-[2.8rem] text-[#333] max-md:text-[2.2rem]">
              Các lớp năm học
            </span>
          </h2>
          <div className="mt-4 inline-block rounded-[10px] bg-pink px-6 py-2.5 font-paytone text-[1.2rem] text-white">
            2025-2026
          </div>
        </div>

        {/* Schedule image */}
        <div className="flex flex-1 justify-center">
          <Image
            src={ASSETS.scheduleImage}
            alt="Lịch học các lớp"
            width={440}
            height={440}
            className="max-h-[440px] max-w-full rounded-[20px] object-contain"
          />
        </div>
      </div>
    </section>
  );
}
