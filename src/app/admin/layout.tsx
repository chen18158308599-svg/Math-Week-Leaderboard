import Link from "next/link";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin/games", label: "Schedule" },
  { href: "/admin/stations", label: "Stations" },
  { href: "/admin/puzzles", label: "Puzzles" },
  { href: "/admin/submissions", label: "Submissions" },
  { href: "/admin/leaderboard", label: "Leaderboard" },
  { href: "/admin/staff", label: "Staff" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole("admin");

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="flex flex-row items-center justify-between border-b border-neutral-200 px-10 py-5">
        <div className="flex flex-row items-center gap-9">
          <span className="font-display text-lg font-bold">MATH WEEK ADMIN</span>
          <nav className="flex flex-row gap-7">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-neutral-600 hover:text-neutral-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <span className="text-sm text-neutral-500">{profile.email}</span>
      </header>
      <main className="px-10 py-8">{children}</main>
    </div>
  );
}
