import { requireUser } from "@/lib/auth";
import { NicknameForm } from "@/app/onboarding/nickname/nickname-form";
import { signOutAction } from "./actions";
import Link from "next/link";

export default async function ProfilePage() {
  const profile = await requireUser("/profile");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 participant-page px-6">
      <div className="participant-card w-full max-w-sm text-center">
        <p className="text-sm font-semibold tracking-widest text-neutral-500">MATH WEEK</p>
        <h1 className="mt-1 text-2xl font-semibold">Your profile</h1>
        <p className="mt-2 text-sm text-neutral-500">{profile.email}</p>

        <NicknameForm defaultValue={profile.nickname ?? ""} next="/profile" />
        <Link href="/my-score" className="mt-4 inline-flex min-h-11 items-center text-blue-300">View my points & rank →</Link>

        <form action={signOutAction} className="mt-6">
          <button className="participant-quiet text-sm text-neutral-500 underline underline-offset-4 hover:text-neutral-300">
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
