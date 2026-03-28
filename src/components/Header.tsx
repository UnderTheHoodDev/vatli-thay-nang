"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { ASSETS } from "@/data/assets";
import { MENU_ITEMS } from "@/data/menu";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-[1000] flex justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
    >
      <motion.header
        initial={false}
        animate={
          scrolled
            ? { backgroundColor: "#ffffff", boxShadow: "0 4px 24px rgba(0,0,0,0.10)", borderRadius: "9999px", marginTop: "12px", paddingLeft: "24px", paddingRight: "24px", width: "calc(100% - 48px)", maxWidth: "1100px" }
            : { backgroundColor: "#fffdf9", boxShadow: "0 0px 0px rgba(0,0,0,0)", borderRadius: "0px", marginTop: "0px", paddingLeft: "0px", paddingRight: "0px", width: "100%", maxWidth: "1200px" }
        }
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="overflow-hidden"
      >
          <nav className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-3">
            <a href="#" className="flex items-center gap-3 no-underline">
              <Image
                src={ASSETS.logo}
                alt="Vật Lí Thầy Năng"
                width={64}
                height={64}
                className="h-16 w-auto"
              />
              <span className="font-paytone text-[1.1rem] text-[#e0187b]">
                Lớp học Vật lí thầy Năng
              </span>
            </a>

            <ul
              className={`flex items-center gap-8 list-none max-md:absolute max-md:top-full max-md:left-0 max-md:right-0 max-md:flex-col max-md:gap-4 max-md:bg-white max-md:p-6 max-md:shadow-[0_8px_20px_rgba(0,0,0,0.1)] ${
                menuOpen ? "max-md:flex" : "max-md:hidden"
              }`}
            >
              {MENU_ITEMS.map((item, i) => (
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + i * 0.07, ease: "easeOut" }}
                >
                  {item.isButton ? (
                    <a
                      href={item.href}
                      className="inline-block rounded-full bg-purple px-7 py-3 font-paytone text-base text-white no-underline transition-all duration-200 hover:-translate-y-0.5 hover:bg-purple-dark"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <a
                      href={item.href}
                      className="font-paytone text-base font-medium text-[#503c39] no-underline transition-colors duration-200 hover:text-pink"
                    >
                      {item.label}
                    </a>
                  )}
                </motion.li>
              ))}
            </ul>

            <button
              className="hidden flex-col gap-[5px] border-none bg-transparent p-1 max-md:flex cursor-pointer"
              aria-label="Menu"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <span className="block h-[3px] w-7 rounded-sm bg-purple transition-all duration-300" />
              <span className="block h-[3px] w-7 rounded-sm bg-purple transition-all duration-300" />
              <span className="block h-[3px] w-7 rounded-sm bg-purple transition-all duration-300" />
            </button>
          </nav>
      </motion.header>
    </motion.div>
  );
}
