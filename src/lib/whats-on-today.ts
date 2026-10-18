// Optimized derivatives of the supplied photographs; originals stay in assets/whats_on_today.
export const WEEK_POSTER = {
  src: "/whats-on-today/poster.webp",
  width: 2400,
  height: 1067,
  alt: "Official Math Week poster with activities, venues and event details",
};

export const WEEK_REWARDS = [
  { id: "camping-chair", name: "Camping chair", tier: "Grand prize", src: "/whats-on-today/camping_chair.webp", alt: "White folding camping chair with a cartoon face and mathematics book design" },
  { id: "thermos", name: "Thermos", tier: "Mid prize", src: "/whats-on-today/thermos.webp", alt: "Cream thermos with a silver lid and blue lettering" },
  { id: "nap-blanket", name: "Nap blanket", tier: "Small prize", src: "/whats-on-today/nap_blanket.webp", alt: "Blue and cream character blankets displayed on an armchair" },
  { id: "magnetic-badge", name: "Magnetic badge", tier: "Badge", src: "/whats-on-today/magnetic_badge.webp", alt: "Blue beach-themed badge showing a penguin surfing", note: "25 badges available" },
];

export const WEEK_PREVIEW_IMAGES = [
  { ...WEEK_REWARDS[0], caption: "Explore the rewards." },
  { id: "planarity", src: "/whats-on-today/planarity-game.webp", alt: "Planarity game showing two players' networks of connected nodes", caption: "Make your next move." },
  { ...WEEK_REWARDS[2], caption: "Something cosy awaits." },
];
