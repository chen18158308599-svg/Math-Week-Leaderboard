"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Home" },
  { href: "/directory", label: "Event Directory" },
  { href: "/games", label: "Digital Based" },
  { href: "/stock-market", label: "MAT Stock Market" },
  { href: "/leaderboard", label: "Leaderboard" },
];

// One touch-friendly nav strip, pinned to the bottom of every kiosk screen (the main
// hub and all four subpages) — the only navigation control on the whole site now.
// Bottom placement per the organiser: easiest to reach on a library touchscreen.
export function KioskNavBar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-shrink-0 flex-row items-center justify-center gap-3 border-t border-[#3f4f74] bg-[#202b42] px-6 py-4">
      {ITEMS.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              "rounded-full border px-5 py-2.5 text-sm font-medium transition " +
              (active
                ? "border-[#7fa8f5] bg-[#2a3a5c] text-[#f2f0ea]"
                : "border-[#3f4f74] bg-[#1b2436] text-[#b9c1d1] hover:border-[#5872a8]")
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
