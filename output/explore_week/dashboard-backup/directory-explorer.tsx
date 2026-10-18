"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { DAY_PICKS, EXPERIENCES, SPECIAL_EVENTS } from "@/lib/directory-content";
import { WEEK_POSTER, WEEK_REWARDS } from "@/lib/whats-on-today";
import styles from "./directory.module.css";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function DirectoryExplorer({ initialDay }: { initialDay: number }) {
  const [day, setDay] = useState(initialDay);
  const events = SPECIAL_EVENTS[day] ?? [];
  const picks = DAY_PICKS[day].map(id => EXPERIENCES.find(card => card.id === id)!);
  return <div className={styles.directory}>
    <header className={styles.header}>
      <div><p className="week-eyebrow">DISCOVER / PLAY / JOIN IN</p><h1>Explore Math Week</h1><p className={styles.headerDate}>19–25 October 2026 <span aria-hidden="true">·</span> XMUM Library</p></div>
      <a className={styles.poster} href={WEEK_POSTER.src} target="_blank" rel="noopener noreferrer" aria-label="View full Math Week poster (opens in a new tab)"><Image {...WEEK_POSTER} alt={WEEK_POSTER.alt} sizes="(max-width: 650px) 90vw, 400px" preload /></a>
    </header>
    <nav className={styles.days} aria-label="Choose an event date">
      {DAYS.map((name, i) => <button key={name} aria-pressed={day === i + 19} onClick={() => setDay(i + 19)}>
        <span>{name.slice(0, 3)}</span><strong>{i + 19}</strong>
      </button>)}
    </nav>
    <div className={styles.dashboard}>
      <div className={styles.activities}>
        <section id="daily-events" className={styles.today} aria-labelledby="selected-day-title" aria-live="polite">
          <div className={styles.sectionHeading}><h2 id="selected-day-title">{DAYS[day - 19]}, {day} October</h2><span>ON THIS DAY</span></div>
          {events.length ? events.map(card => <article className={styles.event} key={card.id}>
            <div className={styles.eventWhen}><strong>{card.time}</strong><span>{card.location}</span></div>
            <div><h3>{card.title}</h3><p>{card.teaser}</p></div>
          </article>) : <div className={styles.openDay}><h3>Explore at your own pace</h3><p>No timed session is listed for this day. Discover the exhibitions, puzzles and games below; ask the on-site team which booths are open.</p></div>}
          {day === 25 && <p className={styles.note}>Visiting on Sunday? Ask staff which activities remain open after Saturday&apos;s closing celebration.</p>}
        </section>

      </div>
      <aside className={styles.prizes} aria-label="Math Week rewards">
        <div className={styles.sectionHeading}><h2><span aria-hidden="true">★ </span>Prizes</h2><span>THIS WEEK&apos;S REWARDS</span></div>
        <Image className={styles.prizeComposite} src="/whats-on-today/prizes-composite.webp" alt="Math Week prizes: a camping chair, thermos, character blankets and a beach-themed magnetic badge" width={1200} height={675} sizes="(max-width: 650px) 90vw, 33vw" />
        <div className={styles.prizeShowcase}>{WEEK_REWARDS.map(reward => <div key={reward.id}>
          <span>{reward.tier}</span><h3>{reward.name}</h3>{reward.note && <p>{reward.note}</p>}
        </div>)}</div>
      </aside>
    </div>
    <section className={styles.discovery} aria-labelledby="discover-title">
      <div className={styles.sectionHeading}><h2 id="discover-title">Find your kind of challenge</h2><span>MORE TO EXPLORE</span></div>
      <div className={styles.discoveryGrid}>
        <a href="#all-experiences" className={styles.discoveryCard}><div className={styles.discoveryImage}><Image src="/directory/exhibition.svg" alt="Illustration of a mathematical exhibition; on-site photograph not yet available" fill sizes="180px" /><span>EXHIBITION PREVIEW</span></div><div><h3>Exhibitions &amp; hands-on puzzles</h3><p>Optical illusions, curious models and puzzles to try in person.</p><span>Library exhibition &amp; activity areas ↗</span></div></a>
        <Link href="/games" className={styles.discoveryCard}><div className={styles.discoveryImage}><Image src="/whats-on-today/planarity-game.webp" alt="Actual Planarity game with two players' networks" fill sizes="180px" /></div><div><h3>Mini games / Digital games</h3><p>Patterns, strategy and a network to untangle.</p><span>Library 2F · digital booths ↗</span></div></Link>
        <a href="#daily-events" className={styles.discoveryCard}><div className={styles.discoveryImage}><Image src="/directory/tiling.svg" alt="Illustration for the tiling talk and workshop" fill sizes="180px" /><span>SESSION PREVIEW</span></div><div><h3>Special events</h3><p>Talks, a cube challenge, a workshop and movie afternoon.</p><span>Choose a date to see times &amp; venues ↗</span></div></a>
      </div>
    </section>
    <section id="all-experiences" className={styles.experiences} aria-labelledby="experiences-title">
      <div className={styles.sectionHeading}><h2 id="experiences-title">What will you try?</h2><span>VISIT THE TEAM ON SITE</span></div>
      <div className={styles.experienceGrid}>{picks.map(card => <article key={card.id}>
        <span className={styles.category}>{card.category}</span><h3>{card.title}</h3><p>{card.detail}</p><span className={styles.location}>{card.location}</span>
        {card.id === "digital" && <Link href="/games">Open digital games ↗</Link>}
        {card.id === "market" && <Link href="/stock-market">Open MAT Stock Market ↗</Link>}
      </article>)}</div>
    </section>
    <p className={styles.wayfinding}>Exhibitions &amp; puzzles: around the library. Digital and committee booths: Library 2F. Talks and Rubik session: Library 1F. Movie and closing celebration: Mini Cinema.</p>
  </div>;
}
