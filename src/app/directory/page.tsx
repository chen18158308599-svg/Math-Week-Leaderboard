import Link from "next/link";

// Subpage 1 — Event Directory. Content-driven, not much interactivity: themes by
// day-block, floor plan / zone locations, activity list. Closest pre-v3 analog was
// the kiosk sidebar (today's theme, nearby activities, promo chips) — this is the
// fuller version of that. Content below is transcribed from the organiser's event
// flow plan (new_instructions/eventflow.md); update here once the real floor-plan
// images and finalized activity list are handed over.
const THEMES = [
  {
    days: "Mon – Wed",
    theme: "Mathematics in Finance, Games & Logic Puzzles",
    programmes: [
      "Economics in Finance",
      "Management in Accounting",
      "Management in International Business",
      "Management in E-Commerce",
      "Management in Hospitality Management",
    ],
  },
  {
    days: "Tue – Thu",
    theme: "Mathematics in AI and Data Science",
    programmes: [
      "Artificial Intelligence",
      "Data Science",
      "Computer Science and Technology",
      "Software Engineering",
      "Digital Media Technology",
      "Cyber Security",
    ],
  },
  {
    days: "Wed – Fri",
    theme: "Mathematics in Arts / Literature / TCM Medical Science",
    programmes: [
      "Traditional Chinese Medicine",
      "English Language and Literature",
      "Chinese Studies",
      "Communication",
      "Journalism",
      "Advertising",
    ],
  },
  {
    days: "Fri – Sun",
    theme: "Mathematics in Engineering / Sciences / Math",
    programmes: [
      "Mathematics and Applied Mathematics",
      "Physics",
      "Electrical and Electronics Engineering",
      "Robotics and Automation Engineering",
      "Chemical Engineering",
      "New Energy Science and Engineering",
      "Marine Biotechnology",
      "Marine Environmental Chemistry",
    ],
  },
];

const ZONES = [
  { zone: "Library 2F — Zone II", items: ["Mathematics {Canvas} Display", "Code (Interactive) Based ×2", "Digital Wall"] },
  { zone: "Library 2F — Zone III", items: ["Complete Library of the Four Treasuries display", "Math Opinion booth", "Code (Interactive) Based", "Wall of Knowledge"] },
  { zone: "Library 2F — Zone IV", items: ["Mathematics across Culture display"] },
  { zone: "Library 1F", items: ["Mathematics across Culture display", "Zones I, II, V"] },
];

const ACTIVITIES = [
  { category: "Code (Card) Based", detail: "20+ printed-card puzzles scattered around the library — scan a card's QR to answer (/puzzle/…)." },
  { category: "Digital Based", detail: "One playable game per day, live on the library's touchscreen — see the Digital Based subpage." },
  { category: "Committee Based", detail: "Staffed mini-events — Poker/Card Magic, Tower of Hanoi, Probability Board, and more, by theme block." },
  { category: "Exhibitions", detail: "Canvas displays across Library 1F & 2F — Mathematics in XMU/XMUM, Mathematics in Daily Life, Mathematics in Curriculum." },
  { category: "MAT Mini Events", detail: "Math Movie Night (Good Will Hunting), club collaborations (Rubik Society, Board Game Society, Handcraft Society, ACG Society)." },
];

export default function DirectoryPage() {
  return (
    <main className="min-h-screen w-full bg-[#0b0f1a] px-10 py-10 text-[#f2f0ea] md:px-20 md:py-14">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <div className="flex flex-row items-start justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="font-display text-3xl font-bold tracking-wide md:text-4xl">
              MATH WEEK
            </div>
            <div className="text-sm tracking-[0.18em] text-[#8891a3]">EVENT DIRECTORY</div>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-[#2a3554] bg-[#141a29] px-3.5 py-1.5 text-sm text-[#a6adbc] transition hover:border-[#3e4d78]"
          >
            ← Main hub
          </Link>
        </div>

        <Section title="Themes by day-block">
          <div className="flex flex-col gap-3">
            {THEMES.map((t) => (
              <div
                key={t.days}
                className="rounded-xl border border-[#2a3554] bg-[#141a29] px-6 py-5"
              >
                <div className="flex flex-row flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-xs tracking-[0.16em] text-[#5f8fdd]">{t.days}</span>
                  <span className="font-display text-lg font-semibold">{t.theme}</span>
                </div>
                <div className="mt-2 flex flex-row flex-wrap gap-2">
                  {t.programmes.map((p) => (
                    <span
                      key={p}
                      className="rounded-full border border-[#2a3554] bg-[#0b0f1a] px-3 py-1 text-xs text-[#a6adbc]"
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
                className="rounded-xl border border-[#2a3554] bg-[#141a29] px-6 py-5"
              >
                <div className="font-display text-base font-semibold text-[#5f8fdd]">
                  {z.zone}
                </div>
                <ul className="mt-2 flex flex-col gap-1 text-sm text-[#a6adbc]">
                  {z.items.map((i) => (
                    <li key={i}>· {i}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-[#5b6478]">
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
                <span className="text-sm text-[#a6adbc]">{a.detail}</span>
              </div>
            ))}
          </div>
        </Section>

        <div className="border-t border-[#2a3554] pt-5 text-right text-[15px] text-[#5b6478]">
          Math Week · Oct 19–25, 2026 · XMUM Library
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xs tracking-[0.2em] text-[#5b6478]">{title.toUpperCase()}</h2>
      {children}
    </section>
  );
}
