import { requireUser } from "@/lib/auth";
import { NicknameForm } from "@/app/onboarding/nickname/nickname-form";
import { signOutAction } from "./actions";

export default async function ProfilePage() {
  const profile = await requireUser();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-950 px-6 text-neutral-100">
      <div className="w-full max-w-sm text-center">
        <p className="text-sm font-semibold tracking-widest text-neutral-500">MATH WEEK</p>
        <h1 className="mt-1 text-2xl font-semibold">Your profile</h1>
        <p className="mt-2 text-sm text-neutral-500">{profile.email}</p>

        <NicknameForm defaultValue={profile.nickname ?? ""} next="/profile" />

        <form action={signOutAction} className="mt-6">
          <button className="text-sm text-neutral-500 underline underline-offset-4 hover:text-neutral-300">
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
