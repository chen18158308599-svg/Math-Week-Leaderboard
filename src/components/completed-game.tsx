import Link from "next/link";

export function CompletedGame() {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <h2 className="font-display text-2xl font-bold text-blue-300">Already completed</h2>
      <p className="text-sm text-neutral-400">
        You have already earned points for this game. Each game awards points only
        once per school account, even if you scan another QR code or use another device.
      </p>
      <Link href="/my-score" className="mt-4 inline-flex min-h-11 items-center text-blue-300">
        View my points &amp; rank
      </Link>
    </div>
  );
}
