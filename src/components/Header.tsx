"use client";

import { useState } from "react";
import Image from "next/image";
import { ASSETS } from "@/data/assets";
import { MENU_ITEMS } from "@/data/menu";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-[1000] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <nav className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-3">
        <a href="#" className="flex items-center gap-3 no-underline">
          <Image
            src={ASSETS.logo}
            alt="Vật Lí Thầy Năng"
            width={48}
            height={48}
            className="h-12 w-auto"
          />
          <span className="font-paytone text-[1.1rem] text-purple">
            Lớp học Vật lí thầy Năng
          </span>
        </a>

        <ul
          className={`flex items-center gap-8 list-none max-md:absolute max-md:top-full max-md:left-0 max-md:right-0 max-md:flex-col max-md:gap-4 max-md:bg-white max-md:p-6 max-md:shadow-[0_8px_20px_rgba(0,0,0,0.1)] ${
            menuOpen ? "max-md:flex" : "max-md:hidden"
          }`}
        >
          {MENU_ITEMS.map((item) => (
            <li key={item.href}>
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
                  className="text-base font-semibold text-purple no-underline transition-colors duration-200 hover:text-pink"
                >
                  {item.label}
                </a>
              )}
            </li>
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
    </header>
  );
}
