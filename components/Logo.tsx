"use client";

import Link from "next/link";
import Image from "next/image";

export const Logo = () => {
  return (
    <Link
      href="/"
      className="relative z-20 flex items-center justify-center outline-none transition-transform active:scale-95 hover:opacity-90"
    >
      <Image
        src="/logos/menora-logo.svg"
        alt="Menora Center"
        width={180} // Увеличили базовую ширину
        height={60} // Увеличили базовую высоту
        priority
        // Увеличили высоту с h-8/10 до h-10/14. object-contain не даст ему сплющиться.
        className="h-13 md:h-14 w-auto object-contain dark:drop-shadow-md"
      />
    </Link>
  );
};
