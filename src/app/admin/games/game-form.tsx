import Link from "next/link";
import type { Game, Station } from "@/lib/supabase/types";
import { card, input, label, primaryButton, secondaryButton } from "../ui";

export function GameForm({
  game,
  stations,
  action,
}: {
  game?: Game;
  stations: Station[];
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className={`${card} flex max-w-lg flex-col gap-4 p-6`}>
      <Field label="NAME">
        <input name="name" defaultValue={game?.name} required className={input} />
      </Field>

      <Field label="TYPE">
        <select name="type" defaultValue={game?.type ?? "digital"} className={input}>
          <option value="digital">Digital (station)</option>
          <option value="physical">Physical (staffed booth)</option>
          <option value="card">Card puzzle</option>
        </select>
      </Field>

      <Field label="POINTS">
        <input
          name="points_value"
          type="number"
          min={1}
          defaultValue={game?.points_value ?? 10}
          required
          className={input}
        />
      </Field>

      <Field label="EMBED URL — digital games only">
        <input name="embed_url" defaultValue={game?.embed_url ?? ""} className={input} />
      </Field>

      <Field label="STATION — legacy, safe to leave as none">
        <select name="station_id" defaultValue={game?.station_id ?? ""} className={input}>
          <option value="">— none —</option>
          {stations.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-neutral-400">
          There&apos;s exactly one physical touchscreen for the whole event (/games), so
          this no longer does anything — kept only in case a future event brings back
          multiple screens.
        </p>
      </Field>

      <div className="flex flex-row gap-4">
        <Field label="ACTIVE FROM">
          <input
            name="active_from"
            type="date"
            defaultValue={game?.active_from ?? ""}
            className={input}
          />
        </Field>
        <Field label="ACTIVE UNTIL">
          <input
            name="active_until"
            type="date"
            defaultValue={game?.active_until ?? ""}
            className={input}
          />
        </Field>
      </div>
      <p className="-mt-2 text-xs text-neutral-400">
        Leave either date blank for no bound on that side.
      </p>

      <label className="flex flex-row items-center gap-2 text-sm">
        <input
          name="is_active"
          type="checkbox"
          defaultChecked={game?.is_active ?? true}
          className="h-4 w-4"
        />
        Active
      </label>

      <div className="mt-2 flex flex-row gap-3">
        <button type="submit" className={primaryButton}>
          {game ? "Save changes" : "Add game"}
        </button>
        <Link href="/admin/games" className={secondaryButton}>
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Field({ label: text, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className={label}>{text}</span>
      {children}
    </div>
  );
}
