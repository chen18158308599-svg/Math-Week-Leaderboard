import { requireUser } from "@/lib/auth";
import { NicknameForm } from "./nickname-form";

export default async function NicknameOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const profile = await requireUser();
  const { next } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-950 px-6 text-neutral-100">
      <div className="w-full max-w-sm text-center">
        <p className="text-sm font-semibold tracking-widest text-neutral-500">MATH WEEK</p>
        <h1 className="mt-1 text-2xl font-semibold">Welcome! Pick a nickname</h1>
        <p className="mt-3 text-sm text-neutral-400">
          This is what shows on the public leaderboard instead of your real name. You
          can change it later from your profile.
        </p>

        <NicknameForm defaultValue={profile.nickname ?? ""} next={next ?? "/"} />
      </div>
    </main>
  );
}
