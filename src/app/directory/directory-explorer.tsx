"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { DAY_PICKS, EXPERIENCES, SPECIAL_EVENTS, type DiscoverCard } from "@/lib/directory-content";
import { themesActiveOn } from "@/lib/event-content";
import DirectoryShowcase from "./directory-showcase";
import styles from "./directory.module.css";

function PreviewImage({ card, sizes }: { card: DiscoverCard; sizes: string }) {
  const placeholder = card.image.endsWith(".svg");
  return <><Image src={card.image} alt={placeholder ? `${card.title} illustration; on-site photo coming soon` : card.id === "digital" ? "Mathverse digital games promotional preview showing six game realms" : `${card.title} at Math Week`} fill sizes={sizes} />{placeholder && <span className={styles.photoLabel}>PHOTO COMING SOON</span>}</>;
}

export default function DirectoryExplorer({ initialDay }: { initialDay: number }) {
  const [day, setDay] = useState(initialDay);
  const [selected, setSelected] = useState<DiscoverCard | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const events = SPECIAL_EVENTS[day] ?? [];
  const picks = DAY_PICKS[day].map(id => EXPERIENCES.find(card => card.id === id)!);
  const open = (card: DiscoverCard) => {
    opener.current = document.activeElement as HTMLElement;
    setSelected(card);
    dialog.current?.showModal();
    if (dialog.current) dialog.current.scrollTop = 0;
  };
  const close = () => { dialog.current?.close(); };
  return <div className={styles.directory}>
    <header className={styles.intro}>
      <div className={styles.introCopy}>
        <p className="week-eyebrow">19-25 OCTOBER 2026 / XMUM LIBRARY</p>
        <h1>Maths you can see,<br /><span>touch and play.</span></h1>
        <p>Discover curious exhibits, hands-on puzzles and games across the library. Pick something that catches your eye.</p>
      </div>
      <DirectoryShowcase />
    </header>
    <nav className={styles.days} aria-label="Choose an event date">
      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((name, i) => <button key={name} aria-pressed={day === i + 19} onClick={() => setDay(i + 19)}>
        <span>{name}</span><strong>{i + 19}</strong><small>{SPECIAL_EVENTS[i + 19]?.length ? "Special events" : "Explore & play"}</small>
      </button>)}
    </nav>
    <section className={styles.dayHeading} aria-live="polite">
      <div><p className="week-eyebrow">YOUR DAY AT MATH WEEK</p><h2>{["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][day - 19]}, {day} October</h2></div>
      <div className={styles.tags}>{themesActiveOn(`2026-10-${day}`).map(t => <span key={t.theme}>{t.theme.replace("Mathematics in ", "")}</span>)}</div>
      {day === 25 && <p className={styles.sundayNote}>Visiting on Sunday? Ask staff which activities remain open after Saturday&apos;s closing celebration.</p>}
    </section>
    {events.length > 0 && <section className={styles.agenda} aria-label="Today's scheduled events">
      <p className={styles.agendaLabel}>ON TODAY</p>
      <div>{events.map(card => <button className={styles.agendaEvent} key={card.id} onClick={() => open(card)}>
        <strong className={styles.agendaTime}>{card.time}</strong>
        <div className={styles.agendaPhoto}><PreviewImage card={card} sizes="90px" /></div>
        <div className={styles.agendaCopy}><h3>{card.title}</h3><p>{card.teaser}</p></div>
        <span className={styles.agendaLocation}>{card.location}<span aria-hidden="true"> &#8599;</span></span>
      </button>)}</div>
    </section>}
    <section className={styles.section}>
      <div className={styles.sectionTitle}><div><p className="week-eyebrow">SIX WAYS TO GET CURIOUS</p><h2>What will you try?</h2></div><span>All experiences / visit the team on site</span></div>
      <div className={styles.experienceGrid}>{picks.map(card => <button className={styles.card} key={card.id} onClick={() => open(card)}>
        <div className={styles.photo}><PreviewImage card={card} sizes="(min-width: 1500px) 450px, 33vw" /></div>
        <div className={styles.cardCopy}><span className={styles.category}>{card.category}</span><h3>{card.title}</h3><p>{card.teaser}</p>
          <div className={styles.cardMeta}><span>{card.location}</span></div>
          <span className={styles.discover}>Take a closer look <span aria-hidden="true">&#8599;</span></span>
        </div>
      </button>)}</div>
    </section>
    <section className={styles.wayfinding}>
      <div><p className="week-eyebrow">MAKE YOUR WAY AROUND</p><h2>Less searching.<br />More discovering.</h2></div>
      <div><article><span>01 / EXPLORE</span><h3>Follow the displays</h3><p>Find exhibition pieces and printed puzzles around the library.</p></article><article><span>02 / PLAY</span><h3>Head to Library 2F</h3><p>Find the digital and committee booths. Ask the team which challenges are available.</p></article><article><span>03 / JOIN IN</span><h3>Check your session venue</h3><p>Talks and the Rubik session: Library 1F. Movie and closing celebration: Mini Cinema.</p></article></div>
    </section>
    <dialog ref={dialog} className={styles.dialog} aria-labelledby="directory-detail-title" onClick={e => { if (e.target === e.currentTarget) close(); }} onClose={() => opener.current?.focus()}>
      {selected && <><div className={styles.dialogPhoto}><PreviewImage card={selected} sizes="640px" /></div><div className={styles.dialogCopy}>
        <p className={styles.category}>{selected.category}</p><h2 id="directory-detail-title">{selected.title}</h2><p>{selected.detail}</p>
        <div className={styles.cardMeta}>{selected.time && <strong>{day} October / {selected.time}</strong>}<span>{selected.location}</span></div>
        <p className={styles.visitNote}>Visit the activity in person. The team on site can help you get started.</p>
        <button className={styles.close} onClick={close}>Back to exploring</button>
      </div></>}
    </dialog>
  </div>;
}
