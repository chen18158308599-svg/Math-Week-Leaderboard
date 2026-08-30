import { ACTIVITIES, THEMES, ZONES } from "@/lib/event-content";
import { IdleRedirect } from "@/components/idle-redirect";
import { KioskNavBar } from "@/components/kiosk-nav-bar";

// Subpage 1 — Event Directory. Content-driven, not much interactivity: themes by
// day-block, floor plan / zone locations, activity list. Closest pre-v3 analog was
// the kiosk sidebar (today's theme, nearby activities, promo chips) — this is the
// fuller version of that. Content lives in src/lib/event-content.ts, shared with the
// main hub's home slide.
export default function DirectoryPage() {
  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden bg-[#1b2436] text-[#f2f0ea]">
      <IdleRedirect seconds={60} />

      <div className="flex-grow overflow-y-auto px-10 py-10 md:px-20 md:py-14">
        <div className="mx-auto flex max-w-5xl flex-col gap-10">
          <div className="flex flex-col gap-1.5">
            <div className="font-display text-3xl font-bold tracking-wide md:text-4xl">
              MATH WEEK
            </div>
            <div className="text-sm tracking-[0.18em] text-[#a9b2c4]">EVENT DIRECTORY</div>
          </div>

          <Section title="Themes by day-block">
            <div className="flex flex-col gap-3">
              {THEMES.map((t) => (
                <div
                  key={t.days}
                  className="rounded-xl border border-[#3f4f74] bg-[#232f49] px-6 py-5"
                >
                  <div className="flex flex-row flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-xs tracking-[0.16em] text-[#7fa8f5]">{t.days}</span>
                    <span className="font-display text-lg font-semibold">{t.theme}</span>
                  </div>
                  <div className="mt-2 flex flex-row flex-wrap gap-2">
                    {t.programmes.map((p) => (
                      <span
                        key={p}
                        className="rounded-full border border-[#3f4f74] bg-[#1b2436] px-3 py-1 text-xs text-[#b9c1d1]"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Floor plan / zones">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {ZONES.map((z) => (
                <div
                  key={z.zone}
                  className="rounded-xl border border-[#3f4f74] bg-[#232f49] px-6 py-5"
                >
                  <div className="font-display text-base font-semibold text-[#7fa8f5]">
                    {z.zone}
                  </div>
                  <ul className="mt-2 flex flex-col gap-1 text-sm text-[#b9c1d1]">
                    {z.items.map((i) => (
                      <li key={i}>· {i}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-[#7b859c]">
              Placeholder zone labels — swap in the real floor-plan diagram once the design
              team hands it over.
            </p>
          </Section>

          <Section title="What's happening">
            <div className="flex flex-col gap-3">
              {ACTIVITIES.map((a) => (
                <div key={a.category} className="flex flex-row items-baseline gap-3">
                  <span className="w-44 flex-shrink-0 text-sm font-semibold text-[#f2f0ea]">
                    {a.category}
                  </span>
                  <span className="text-sm text-[#b9c1d1]">{a.detail}</span>
                </div>
              ))}
            </div>
          </Section>

          <div className="border-t border-[#3f4f74] pt-5 text-right text-[15px] text-[#7b859c]">
            Math Week · Oct 19–25, 2026 · XMUM Library
          </div>
        </div>
      </div>

      <KioskNavBar />
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xs tracking-[0.2em] text-[#7b859c]">{title.toUpperCase()}</h2>
      {children}
    </section>
  );
}
