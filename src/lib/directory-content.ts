// Timed events: Event Flow Plan pp. 55–61. Daily picks are recommendations,
// not promises that a booth is staffed or an exclusive daily game schedule.
export type DiscoverCard = {
  id: string; title: string; teaser: string; detail: string;
  category: string; location: string; image: string; time?: string;
};
const photo = (name: string) => `/directory/${name}.svg`;
export const EXPERIENCES: DiscoverCard[] = [
  { id: "exhibition", title: "Mathematics Exhibition", teaser: "See straight strings form a curved surface, discover surprising optical illusions, and explore the mathematics behind familiar patterns.", detail: "Discover string-built curved surfaces, optical illusions, 3D models, origami and patterns across cultures. Browse the mathematics book wall and see familiar ideas from a new perspective.", category: "Exhibition", location: "Library exhibition areas · ask staff for directions", image: "/whats-on-today/random1.webp" },
  { id: "cards", title: "Puzzle Cards & Mystery Chest", teaser: "Solve puzzles in logic, probability and geometry. Collect the answers and use them to crack the Mystery Chest code.", detail: "Choose a printed card at the library and solve its puzzle. Record your answers and use the clues to tackle the Mystery Chest code. Scan the card to submit your answer on your phone.", category: "Puzzle cards", location: "Printed cards around the library", image: "/whats-on-today/random2.webp" },
  { id: "digital", title: "Touchscreen Games", teaser: "Spot hidden patterns, untangle a network, or decide whether to take the deal. Put your strategy to the test.", detail: "Predict the next term in Pattern Sequence, rearrange a graph in Planarity, or weigh risk and reward in Deal or No Deal. Play at the event touchscreen and scan the claim QR after an eligible result.", category: "Touchscreen games", location: "Library 2F · digital booths", image: "/whats-on-today/digital-game.webp" },
  { id: "hands-on", title: "Hands-on Puzzles", teaser: "Fit the giant Kanoodle pieces, move the Tower of Hanoi, or put the Bagua symbols in order.", detail: "Fill the Kanoodle board without gaps, transfer the Tower of Hanoi one disk at a time without placing a larger disk on a smaller one, or arrange the Bagua symbols using the clues. Read the instructions at each station before you begin.", category: "Hands-on puzzles", location: "Library activity areas · ask staff for directions", image: "/whats-on-today/random4.webp" },
  { id: "committee", title: "Committee Challenges", teaser: "Guide a knight across the board, advance Conway's soldiers, or solve a puzzle with your teammates under unusual restrictions.", detail: "Visit every square once in the Knight's Tour, jump soldiers towards the target row in Conway's Soldiers, cooperate with restricted sight, hearing or speech, or tackle a Luban lock. Ask the committee which challenges are running. Completion earns 10 points, or 20 total with an explanation, after staff verification.", category: "Committee challenges", location: "Library 2F · committee booths; when staffed", image: "/whats-on-today/random4.webp" },
  { id: "market", title: "MAT Stock Market", teaser: "Read the clues, predict the next price move, and build a portfolio in a market powered by real library data.", detail: "Compare the clues, choose what to buy or sell, and watch how price changes affect your portfolio. Visit MAT Stock Market on the event touchscreen to take part.", category: "MAT Stock Market", location: "Event touchscreen · library", image: "/whats-on-today/stock_market.webp" },
];
export const SPECIAL_EVENTS: Record<number, DiscoverCard[]> = {
  19: [{ id: "data-talk", title: "Library Data Talk", teaser: "When does the library get busy? What do borrowing records reveal? Discover a different side of our library through data.", detail: "Join Kow Chun Xiang for a closer look at the library's collections, borrowing habits and daily activity - and how everyday records become meaningful insights.", category: "Library Data Talk", location: "Library 1F", time: "2:30–3:00 pm", image: photo("data-talk") }],
  20: [{ id: "rubik", title: "Rubik Society Mini Booth", teaser: "Watch a speed-solving demonstration, learn your first layer, or take on a timed cube challenge with the Rubik Society.", detail: "A collaboration with the Rubik Society, with demonstrations, beginner guidance and solving challenges. Ask the team about the activities available during the session.", category: "Rubik Society mini booth", location: "Library 1F", time: "7:00–9:00 pm", image: "/whats-on-today/random3.webp" }],
  21: [{ id: "tiling", title: "Tiling & Aperiodic Tiling", teaser: "Can a pattern cover a surface without ever repeating? Join Dr. Darren Ong for a talk, then build patterns yourself in the workshop.", detail: "A talk on tiling and aperiodic tiling followed by a hands-on workshop in the same room. Discover how simple shapes can create surprising patterns.", category: "Talk + workshop", location: "Library 1F", time: "7:00–9:00 pm", image: photo("tiling") }],
  24: [
    { id: "movie", title: "Good Will Hunting", teaser: "Meet a young mathematical genius finding his way beyond the equations. Join us for Good Will Hunting.", detail: "Join the planned screening of Good Will Hunting, followed by the Closing Ceremony. Please check the final screening announcement with staff.", category: "Movie screening", location: "Mini Cinema", time: "1:00–3:00 pm", image: photo("movie") },
    { id: "closing", title: "Closing Ceremony", teaser: "Celebrate the week's discoveries, revisit the highlights, and join the prize presentation.", detail: "The planned Closing Ceremony includes prize-awarding, closing remarks and a look back at Math Week.", category: "Closing Ceremony", location: "Mini Cinema", time: "3:00–3:30 pm", image: photo("closing") },
  ],
};
export const DAY_PICKS: Record<number, string[]> = {
  19: ["market", "cards", "committee", "exhibition", "digital", "hands-on"],
  20: ["digital", "hands-on", "cards", "exhibition", "committee", "market"],
  21: ["exhibition", "hands-on", "digital", "cards", "committee", "market"],
  22: ["digital", "cards", "market", "exhibition", "hands-on", "committee"],
  23: ["hands-on", "exhibition", "committee", "digital", "cards", "market"],
  24: ["exhibition", "cards", "hands-on", "digital", "committee", "market"],
  25: ["exhibition", "hands-on", "cards", "digital", "committee", "market"],
};
