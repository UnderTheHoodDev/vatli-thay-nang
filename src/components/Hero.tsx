import Image from "next/image";
import { ASSETS } from "@/data/assets";

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
    iconAlt: "Toàn diện",
    label: "Nội dung học",
    value: "TOÀN DIỆN",
    valueColor: "text-purple",
  },
  {
    icon: ASSETS.featureApproach,
    iconAlt: "Bản chất",
    label: "Cách tiếp cận",
    value: "BẢN CHẤT",
    valueColor: "text-pink",
  },
  {
    icon: ASSETS.featureOnline,
    iconAlt: "Online",
    label: "Lớp học",
    value: "ONLINE",
    valueColor: "text-purple",
  },
];

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center overflow-hidden bg-light-bg pt-[100px]"
    >
      {/* Decorative lines */}
      <Image
        src={ASSETS.line3}
        alt=""
        width={800}
        height={800}
        className="pointer-events-none absolute top-[5%] left-[-10%] z-0 w-[60%] opacity-[0.12]"
      />
      <Image
        src={ASSETS.line1}
        alt=""
        width={400}
        height={400}
        className="pointer-events-none absolute top-[10%] left-[5%] z-0 w-[30%] opacity-[0.08]"
      />

      <div className="relative z-[1] mx-auto flex max-w-[1200px] items-center gap-10 px-6 py-10 max-[968px]:flex-col max-[968px]:text-center">
        {/* Text content */}
        <div className="flex-1">
          <h1 className="mb-4 font-paytone text-[2.8rem] leading-[1.2] text-purple max-md:text-[2rem]">
            CHINH PHỤC
            <span className="block font-paytone text-[2.2rem] italic text-pink max-md:text-[1.6rem]">
              các kì thi học sinh giỏi môn Vật Lí
            </span>
          </h1>
          <p className="mb-8 max-w-[480px] text-[1.05rem] leading-[1.6] text-[#666] max-[968px]:mx-auto">
            Chắp cánh ước mơ chinh phục các kì thi Vật lí cho học sinh trên mọi
            miền cả nước cùng thầy giáo trẻ Nguyễn Năng Linh
          </p>

          <div className="flex gap-8 max-[968px]:justify-center">
            {FEATURES.map((feature) => (
              <div
                key={feature.value}
                className="flex flex-col items-center gap-2"
              >
                <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
                  <Image
                    src={feature.icon}
                    alt={feature.iconAlt}
                    width={40}
                    height={40}
                    className="h-10 w-10"
                  />
                </div>
                <span className="font-paytone text-[0.85rem] text-[#555]">
                  {feature.label}
                </span>
                <span className={`font-paytone text-[1.1rem] ${feature.valueColor}`}>
                  {feature.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Hero image */}
        <div className="relative flex flex-1 items-end justify-center">
          <Image
            src={ASSETS.atomIcon}
            alt=""
            width={100}
            height={100}
            className="absolute top-0 right-[10%] z-[2] w-[100px] opacity-80"
          />
          <Image
            src={ASSETS.heroPhoto}
            alt="Thầy Nguyễn Năng Linh"
            width={520}
            height={520}
            className="relative z-[1] max-h-[520px] w-auto object-contain max-[968px]:max-h-[380px]"
          />
        </div>
      </div>
    </section>
  );
}
