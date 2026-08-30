import Link from "next/link";
import type { DailyFeature } from "@/lib/supabase/types";
import { card, input, label, primaryButton, secondaryButton } from "../ui";

export function FeatureForm({
  feature,
  action,
}: {
  feature?: DailyFeature;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className={`${card} flex max-w-lg flex-col gap-4 p-6`}>
      <div className="flex flex-col gap-1.5">
        <span className={label}>DATE — one entry per calendar day</span>
        <input
          name="date"
          type="date"
          defaultValue={feature?.date ?? ""}
          required
          className={input}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={label}>KIND</span>
        <select name="kind" defaultValue={feature?.kind ?? "poster"} className={input}>
          <option value="poster">Poster (image)</option>
          <option value="video">Video (looping intro/PGVG)</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={label}>TITLE</span>
        <input name="title" defaultValue={feature?.title} required className={input} />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={label}>
          MEDIA URL — image link for a poster; a direct .mp4/.webm file or an
          embeddable player link (e.g. a YouTube embed URL) for a video
        </span>
        <input
          name="media_url"
          defaultValue={feature?.media_url}
          required
          className={input}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={label}>LINK HREF — optional, defaults to /directory</span>
        <input
          name="link_href"
          defaultValue={feature?.link_href ?? ""}
          placeholder="/directory"
          className={input}
        />
      </div>

      <div className="mt-2 flex flex-row gap-3">
        <button type="submit" className={primaryButton}>
          {feature ? "Save changes" : "Add feature"}
        </button>
        <Link href="/admin/features" className={secondaryButton}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
