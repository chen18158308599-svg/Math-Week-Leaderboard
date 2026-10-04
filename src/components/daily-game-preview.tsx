"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DIGITAL_DAYS, digitalDayIndex } from "@/lib/digital-games";
import { todayInEventTimezone } from "@/lib/event-date";
export function DailyGamePreview({ initialDate }: { initialDate: string }) {
  const [date, setDate] = useState(initialDate);
  const [selected, setSelected] = useState<number | null>(null);
  useEffect(() => {
    const timer = setInterval(() => {
      setDate(todayInEventTimezone());
      setSelected(null);
    }, 60000);
    return () => clearInterval(timer);
  }, []);
  const index = selected ?? digitalDayIndex(date);
  const game = DIGITAL_DAYS[index];
  const isToday = game.date === date;
  return (
    <section className="daily-game-preview">
      <div className="daily-game-image">
        <Image
          src={game.image}
          alt={`${game.name} gameplay preview`}
          sizes="(max-width:760px) 90vw, 60vw"
        />
      </div>
      <div className="daily-game-copy">
        <p className="week-eyebrow">
          {isToday ? "TODAY'S DIGITAL GAME" : "DIGITAL GAME PREVIEW"} ·{" "}
          {game.date.slice(8)} OCT
        </p>
        <h2>{game.name}</h2>
        <p>{game.description}</p>
        <Link href="/games" className="week-button">
          Open game website ↗
        </Link>
        <p className="game-menu-note">
          Select {game.name} in the game website&apos;s menu.
        </p>
        <div className="game-day-picker" aria-label="Game previews by date">
          {DIGITAL_DAYS.map((day, i) => (
            <button
              key={day.date}
              aria-pressed={index === i}
              aria-label={`${day.date.slice(8)} October: ${day.name}`}
              onClick={() => setSelected(i)}
            >
              {day.date.slice(8)}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
