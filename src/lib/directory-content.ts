// Timed events updated from the organiser's MAT Mini Event schedule (19 Oct 2026).
// Daily picks are recommendations,
// not promises that a booth is staffed or an exclusive daily game schedule.
export type DiscoverCard = {
  id: string; title: string; teaser: string; detail: string;
  category: string; location: string; image: string; time?: string;
};
const photo = (name: string) => `/directory/${name}.svg`;
export const EXPERIENCES: DiscoverCard[] = [
  { id: "mobius", title: "Möbius Display", teaser: "Look up and discover a mathematical twist in the library.", detail: "Find the Möbius display and explore the idea of a surface with just one side. View the installation from different angles and discover its twist.", category: "Mathematics display", location: "Library display area · ask staff for directions", image: "/whats-on-today/mobius.webp" },
  { id: "opinion", title: "Mathematics Opinion Wall", teaser: "Which proof methods deserve the top spot? Cast your vote and share your maths opinions.", detail: "Visit the opinion wall, read the prompts and add your vote or a short comment. Compare your choices with other visitors.", category: "Vote + share", location: "Library opinion wall · ask staff for directions", image: "/whats-on-today/opinion-wall.webp" },
  { id: "exhibition", title: "Mathematics Exhibition", teaser: "See straight strings form a curved surface, discover surprising optical illusions, and explore the mathematics behind familiar patterns.", detail: "Discover string-built curved surfaces, optical illusions, 3D models, origami and patterns across cultures. Browse the mathematics book wall and see familiar ideas from a new perspective.", category: "Exhibition", location: "Library exhibition areas · ask staff for directions", image: "/whats-on-today/exhibition.webp" },
  { id: "cards", title: "Puzzle Cards & Mystery Chest", teaser: "Solve puzzles in logic, probability and geometry. Collect the answers and use them to crack the Mystery Chest code.", detail: "Choose a printed card at the library and solve its puzzle. Record your answers and use the clues to tackle the Mystery Chest code. Scan the card to submit your answer on your phone.", category: "Puzzle cards", location: "Printed cards around the library", image: "/whats-on-today/random2.webp" },
  { id: "digital", title: "Touchscreen Games", teaser: "Spot hidden patterns, untangle a network, or decide whether to take the deal. Put your strategy to the test.", detail: "Predict the next term in Pattern Sequence, rearrange a graph in Planarity, or weigh risk and reward in Deal or No Deal. Play at the event touchscreen and scan the claim QR after an eligible result.", category: "Touchscreen games", location: "Library 2F · digital booths", image: "/whats-on-today/digital-game.webp" },
  { id: "hands-on", title: "Hands-on Puzzles", teaser: "Fit the giant Kanoodle pieces, move the Tower of Hanoi, or put the Bagua symbols in order.", detail: "Fill the Kanoodle board without gaps, transfer the Tower of Hanoi one disk at a time without placing a larger disk on a smaller one, or arrange the Bagua symbols using the clues. Read the instructions at each station before you begin.", category: "Hands-on puzzles", location: "Library activity areas · ask staff for directions", image: "/whats-on-today/kanoodle.webp" },
  { id: "committee", title: "Committee Challenges", teaser: "Try a Luban lock, guide a knight across the board, or take on a challenge with your teammates.", detail: "Visit every square once in the Knight's Tour, jump soldiers towards the target row in Conway's Soldiers, cooperate with restricted sight, hearing or speech, or tackle a Luban lock. Ask the committee which challenges are running. Completion earns 10 points, or 20 total with an explanation, after staff verification.", category: "Committee challenges", location: "Library 2F · committee booths; when staffed", image: "/whats-on-today/luban-lock.webp" },
  { id: "instagram", title: "Follow MAT on Instagram", teaser: "Follow the MAT Student Council account, then claim your points from the committee.", detail: "Follow the MAT Student Council on Instagram, then show a committee member your account so they can verify the follow. They will show you a claim QR worth 20 points. One claim per student, and the code is only shown after verification.", category: "Committee challenges", location: "Library 2F · committee booths; when staffed", image: "/whats-on-today/poster.webp" },
  { id: "market", title: "MAT Stock Market", teaser: "Read the clues, predict the next price move, and build a portfolio in a market powered by real library data.", detail: "Compare the clues, choose what to buy or sell, and watch how price changes affect your portfolio. Visit MAT Stock Market on the event touchscreen to take part.", category: "MAT Stock Market", location: "Event touchscreen · library", image: "/whats-on-today/stock_market.webp" },
];
const RUBIK_EVENT: DiscoverCard = { id: "rubik", title: "Rubik Club Mini Booth", teaser: "Watch a speed-solving demonstration, learn your first layer, or take on a timed cube challenge with the Rubik Society.", detail: "Join the Rubik Society for demonstrations, tutorials and a timed-solving challenge on Wednesday and Thursday. Contact: Cher Ming Sian.", category: "Rubik Club mini booth", location: "Library 2F Entrance", time: "2:00–6:00 pm", image: "/whats-on-today/rubik.webp" };
export const SPECIAL_EVENTS: Record<number, DiscoverCard[]> = {
  21: [
    RUBIK_EVENT,
    { id: "data-talk", title: "Library Data Talk", teaser: "Discover the library data behind the Stock Market indices with Kow Chun Xiang.", detail: "Take a closer look at the library data behind the Stock Market indices and discover how everyday records become meaningful insights.", category: "Library Data Talk", location: "Library 1F Mini Cinema", time: "3:00–4:00 pm", image: photo("data-talk") },
  ],
  22: [RUBIK_EVENT],
  23: [{ id: "tiling", title: "Mathematics in Patterns & Symmetry", teaser: "Discover the mathematics in everyday patterns and symmetry with Dr Darren Ong.", detail: "Join Dr Darren Ong for the MAT Expository Talk on mathematics in patterns and symmetry in daily life. PIC: Jason William Teja.", category: "MAT Expository Talk", location: "Library 1F Mini Cinema", time: "7:00–9:00 pm", image: "/whats-on-today/tiling.webp" }],
  24: [
    { id: "movie", title: "Good Will Hunting", teaser: "Meet a young mathematical genius finding his way beyond the equations. Join us for Good Will Hunting.", detail: "Join Movie Night with a screening of Good Will Hunting on Saturday, 24 October. PIC: Lee Shuan Fung.", category: "Movie Night", location: "Mini Cinema", time: "1:40–3:50 pm", image: "/whats-on-today/goodwill.webp" },
    { id: "closing", title: "Closing Ceremony", teaser: "Celebrate the week's discoveries, revisit the highlights, and join the prize presentation.", detail: "The planned Closing Ceremony includes prize-awarding, closing remarks and a look back at Math Week. Please ask staff for the updated time.", category: "Closing Ceremony", location: "Mini Cinema", time: "To be confirmed", image: photo("closing") },
  ],
};
export const DAY_PICKS: Record<number, string[]> = {
  19: ["market", "cards", "committee", "exhibition", "digital", "hands-on", "mobius", "opinion"],
  20: ["digital", "hands-on", "cards", "exhibition", "committee", "market", "mobius", "opinion"],
  21: ["exhibition", "hands-on", "digital", "cards", "committee", "market", "mobius", "opinion"],
  22: ["digital", "cards", "market", "exhibition", "hands-on", "committee", "mobius", "opinion"],
  23: ["hands-on", "exhibition", "committee", "digital", "cards", "market", "mobius", "opinion"],
  24: ["exhibition", "cards", "hands-on", "digital", "committee", "market", "mobius", "opinion"],
  25: ["exhibition", "hands-on", "cards", "digital", "committee", "market", "mobius", "opinion"],
};
