// Shared, deliberately plain styling for the admin CRUD screens — this isn't the
// priority feature (per the build doc), so no component library, just consistent
// Tailwind classes reused across games/stations/puzzles/submissions/staff.

export const input =
  "rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-amber-500";
export const label = "text-xs font-medium text-neutral-500";
export const primaryButton =
  "rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-amber-400 disabled:opacity-60";
export const secondaryButton =
  "rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100";
export const dangerButton =
  "rounded-lg border border-red-300 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-50";
export const card = "rounded-xl border border-neutral-200 bg-white";
export const th =
  "px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500";
export const td = "px-4 py-3 text-sm";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-row items-start justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
