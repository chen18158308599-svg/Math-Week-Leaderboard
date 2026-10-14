import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SITE_ACCESS_COOKIE, siteAccessDestination, validSiteAccessToken } from "@/lib/site-access";
import { AccessForm } from "./access-form";
export default async function SiteAccessPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = siteAccessDestination((await searchParams).next);
  if (validSiteAccessToken((await cookies()).get(SITE_ACCESS_COOKIE)?.value)) redirect(next);
  return <main className="participant-page flex min-h-screen items-center justify-center px-6 py-10">
    <div className="participant-card w-full max-w-sm">
      <p className="text-xs font-semibold tracking-widest text-neutral-500">MATH WEEK · EVENT DISPLAY</p>
      <h1 className="mt-3 text-2xl font-semibold">Event display access</h1>
      <p className="mt-3 text-sm text-neutral-400">Enter the organizers&apos; four-digit password on the library display. Student sign-in does not unlock this website.</p>
      <AccessForm next={next} />
      <p className="mt-6 text-sm text-neutral-400">Answering a printed puzzle card? Scan its QR on your phone. No display password is needed.</p>
      <Link href="/my-score" className="mt-4 inline-flex min-h-11 items-center text-sm text-blue-600">My scores & profile →</Link>
    </div>
  </main>;
}
