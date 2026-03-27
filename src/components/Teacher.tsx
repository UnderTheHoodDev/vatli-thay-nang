import Image from "next/image";
import { ASSETS } from "@/data/assets";
import { ACHIEVEMENTS } from "@/data/teacher";

export default function Teacher() {
  return (
    <section id="teacher" className="relative overflow-hidden bg-white py-20">
      {/* Decorative line */}
      <Image
        src={ASSETS.line3}
        alt=""
        width={400}
        height={400}
        className="pointer-events-none absolute top-0 right-[-10%] z-0 w-[35%] opacity-[0.08]"
      />

      <div className="relative z-[1] mx-auto flex max-w-[1200px] items-center gap-12 px-6 max-[968px]:flex-col max-[968px]:text-center">
        {/* Teacher image */}
        <div className="flex flex-none justify-center max-[968px]:flex-initial basis-[380px]">
          <Image
            src={ASSETS.teacherPhoto}
            alt="Thầy Nguyễn Năng Linh"
            width={380}
            height={480}
            className="max-h-[480px] w-auto object-contain"
          />
        </div>

        {/* Teacher info */}
        <div className="flex-1">
          <div className="mb-1 font-paytone text-base text-purple">
            GIÁO VIÊN
          </div>
          <h2 className="mb-2 font-paytone text-[2.6rem] text-purple max-md:text-[2rem]">
            NGUYỄN NĂNG LINH
          </h2>
          <div className="mb-8 h-1 w-[180px] rounded-sm bg-gold max-[968px]:mx-auto" />

          <div className="grid grid-cols-2 gap-5 max-[968px]:grid-cols-1">
            {ACHIEVEMENTS.map((achievement) => (
              <div
                key={achievement.title}
                className="rounded-2xl border-2 border-border bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
              >
                <h3
                  className={`mb-2 flex items-center gap-2 font-paytone text-[1.1rem] ${
                    achievement.titleColor === "pink"
                      ? "text-pink"
                      : "text-purple"
                  }`}
                >
                  <span className="text-[1.4rem]">{achievement.medal}</span>{" "}
                  {achievement.title}
                </h3>
                <ul className="list-disc pl-[18px] text-[0.9rem] leading-[1.6] text-[#555]">
                  {achievement.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
