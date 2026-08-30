import { redirect } from "next/navigation";

// v3: the leaderboard is now one of four subpages of the main site, not its own
// top-level destination — /kiosk stays as a redirect so old bookmarks/QR stickers
// still land somewhere sensible instead of 404ing.
export default function KioskPage() {
  redirect("/leaderboard");
}
