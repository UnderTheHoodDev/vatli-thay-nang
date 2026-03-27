import Image from "next/image";
import { MAIN_COURSES, UPCOMING_COURSES } from "@/data/courses";

export default function Courses() {
  return (
    <section id="courses" className="relative overflow-hidden bg-light-bg py-20">
      <div className="relative z-[1] mx-auto flex max-w-[1200px] gap-8 px-6 max-[968px]:flex-col">
        {/* Main courses */}
        <div className="flex flex-2 gap-6 max-[968px]:flex-col">
          {MAIN_COURSES.map((course) => (
            <div
              key={course.titleMain}
              className="flex flex-1 flex-col rounded-[20px] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
            >
              <div className="mb-4 w-full overflow-hidden rounded-xl">
                <Image
                  src={course.image}
                  alt={course.imageAlt}
                  width={400}
                  height={220}
                  className="h-[220px] w-full object-cover"
                />
              </div>
              <h3 className="mb-1 font-paytone text-[1.2rem] text-purple">
                {course.titlePrefix}
                <br />
                <span className="block text-[1.4rem]">{course.titleMain}</span>
              </h3>
              <p className="mb-1 text-[0.95rem] text-[#999] line-through">
                {course.price}
              </p>
              <p className="mb-3 text-[0.85rem] leading-[1.5] text-[#555]">
                {course.promoText}{" "}
                <strong className="text-pink">{course.promoPrice}</strong>
                <br />
                {course.promoRange}
              </p>
              <div className="mt-auto flex items-center justify-between">
                <a
                  href="#contact"
                  className="inline-block cursor-pointer rounded-full border-none bg-pink px-6 py-2.5 font-paytone text-[0.9rem] text-white no-underline transition-all duration-200 hover:-translate-y-0.5 hover:bg-pink-dark"
                >
                  ĐĂNG KÍ
                </a>
                <span className="text-[0.85rem] text-[#888]">
                  {course.dateRange}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar: upcoming */}
        <div className="flex flex-1 flex-col gap-4">
          <span className="self-end rounded-[20px] bg-sidebar-bg px-5 py-2 font-paytone text-[0.85rem] text-sidebar-text">
            SẮP TỚI
          </span>
          {UPCOMING_COURSES.map((course) => (
            <div
              key={course.title}
              className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-[0_2px_12px_rgba(0,0,0,0.05)]"
            >
              <Image
                src={course.image}
                alt={course.imageAlt}
                width={100}
                height={100}
                className="h-[100px] w-[100px] rounded-xl object-cover"
              />
              <div>
                <h4 className="mb-0.5 font-paytone text-[0.95rem] text-pink">
                  {course.title}
                </h4>
                <p className="text-[0.8rem] text-[#888]">{course.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
