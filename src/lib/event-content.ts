// Shared, date-driven Event Directory content — themes by day-block, floor plan
// zones, and the activity list. Transcribed from the organiser's event flow plan
// (new_instructions/eventflow.md); update here once the real floor-plan images and
// finalized activity list are handed over. Shared by /directory (the full listing)
// and the main hub's home slide (today's slice of it), so the two can't drift apart.

export interface ThemeBlock {
  from: string; // YYYY-MM-DD, inclusive
  to: string; // YYYY-MM-DD, inclusive
  days: string; // human label, e.g. "Mon – Wed"
  theme: string;
  programmes: string[];
}

// Math Week 2026 runs Oct 19 (Mon) – Oct 25 (Sun) — the same 7 calendar days as the
// theme day-blocks below, so each block maps onto real dates one-to-one. Blocks
// overlap by design (e.g. Wed falls in three of them); todayThemes() below returns
// every block covering a given date.
export const THEMES: ThemeBlock[] = [
  {
    from: "2026-10-19",
    to: "2026-10-21",
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
    from: "2026-10-20",
    to: "2026-10-22",
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
    from: "2026-10-21",
    to: "2026-10-23",
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
    from: "2026-10-23",
    to: "2026-10-25",
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

export const ZONES = [
  {
    zone: "Library 2F — Zone II",
    items: ["Mathematics {Canvas} Display", "Code (Interactive) Based ×2", "Digital Wall"],
  },
  {
    zone: "Library 2F — Zone III",
    items: [
      "Complete Library of the Four Treasuries display",
      "Math Opinion booth",
      "Code (Interactive) Based",
      "Wall of Knowledge",
    ],
  },
  { zone: "Library 2F — Zone IV", items: ["Mathematics across Culture display"] },
  { zone: "Library 1F", items: ["Mathematics across Culture display", "Zones I, II, V"] },
];

export const ACTIVITIES = [
  {
    category: "Code (Card) Based",
    detail: "20+ printed-card puzzles scattered around the library — scan a card's QR to answer (/puzzle/…).",
  },
  {
    category: "Digital Based",
    detail: "One playable game per day, live on the library's touchscreen — see the Digital Based subpage.",
  },
  {
    category: "Committee Based",
    detail: "Staffed mini-events — Poker/Card Magic, Tower of Hanoi, Probability Board, and more, by theme block.",
  },
  {
    category: "Exhibitions",
    detail: "Canvas displays across Library 1F & 2F — Mathematics in XMU/XMUM, Mathematics in Daily Life, Mathematics in Curriculum.",
  },
  {
    category: "MAT Mini Events",
    detail: "Math Movie Night (Good Will Hunting), club collaborations (Rubik Society, Board Game Society, Handcraft Society, ACG Society).",
  },
];

// Every theme block whose date range covers `date` (YYYY-MM-DD) — usually one, but
// blocks overlap at their shared edge days.
export function themesActiveOn(date: string): ThemeBlock[] {
  return THEMES.filter((t) => date >= t.from && date <= t.to);
}
