import day1 from "../../assets/day1.png";
import day2 from "../../assets/day2.png";
import day3 from "../../assets/day3.png";
import day4 from "../../assets/day4.png";
import day5 from "../../assets/day5.png";
import day6 from "../../assets/day6.png";
import day7 from "../../assets/day7.png";
export const DIGITAL_GAME_URL = "https://mathweekdigitalbased.onrender.com";
// The supplied day1–day7 filenames are the updated event order.
export const DIGITAL_DAYS = [
  {
    date: "2026-10-19",
    name: "2/3 Average",
    image: day1,
    description: "Choose a number close to two-thirds of the group's average.",
  },
  {
    date: "2026-10-20",
    name: "Deal or No Deal",
    image: day2,
    description: "Explore risk and reward in the game's pirate adventure.",
  },
  {
    date: "2026-10-21",
    name: "Number Sequence Rush",
    image: day3,
    description:
      "Find the next number in a sequence to progress through the expedition.",
  },
  {
    date: "2026-10-22",
    name: "Planarity",
    image: day4,
    description: "Move graph nodes to untangle crossing edges.",
  },
  {
    date: "2026-10-23",
    name: "Symmetry",
    image: day5,
    description: "Explore reflections and symmetry in a moving challenge.",
  },
  {
    date: "2026-10-24",
    name: "KNN Heist",
    image: day6,
    description:
      "Use nearest-neighbour classification to solve the vault challenge.",
  },
  {
    date: "2026-10-25",
    name: "Conway",
    image: day7,
    description: "Explore the Conway-themed two-player challenge.",
  },
];
export function digitalDayIndex(date: string) {
  const index = DIGITAL_DAYS.findIndex((day) => day.date === date);
  return index >= 0 ? index : date < DIGITAL_DAYS[0].date ? 0 : 6;
}
