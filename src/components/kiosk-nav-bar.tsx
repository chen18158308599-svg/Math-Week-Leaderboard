"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const ITEMS = [
  ["/", "Home"],
  ["/directory", "Explore the week"],
  ["/games", "Digital games"],
  ["/leaderboard", "Leaderboard"],
  ["/stock-market", "Stock market"],
];
export function KioskNavBar() {
  const pathname = usePathname();
  return (
    <nav className="week-nav" aria-label="Main navigation">
      {ITEMS.map(([href, label]) => (
        <Link
          key={href}
          href={href}
          aria-current={pathname === href ? "page" : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
