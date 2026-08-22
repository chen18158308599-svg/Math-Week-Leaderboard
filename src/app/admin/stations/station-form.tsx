import Link from "next/link";
import type { Station } from "@/lib/supabase/types";
import { card, input, label, primaryButton, secondaryButton } from "../ui";

export function StationForm({
  station,
  action,
}: {
  station?: Station;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className={`${card} flex max-w-md flex-col gap-4 p-6`}>
      <div className="flex flex-col gap-1.5">
        <span className={label}>LABEL</span>
        <input name="label" defaultValue={station?.label} required className={input} />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className={label}>LOCATION NOTE</span>
        <input
          name="location_note"
          defaultValue={station?.location_note ?? ""}
          placeholder="e.g. 2F, Zone II"
          className={input}
        />
      </div>
      <div className="mt-2 flex flex-row gap-3">
        <button type="submit" className={primaryButton}>
          {station ? "Save changes" : "Add station"}
        </button>
        <Link href="/admin/stations" className={secondaryButton}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
