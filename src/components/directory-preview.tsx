import Image from "next/image";
import { EXPERIENCES, SPECIAL_EVENTS } from "@/lib/directory-content";
import styles from "./directory-preview.module.css";

export function DirectoryPreview({ date, large }: { date: string; large: boolean }) {
  const previewDate = date < "2026-10-19" ? "2026-10-19" : date > "2026-10-25" ? "2026-10-25" : date;
  const events = SPECIAL_EVENTS[Number(previewDate.slice(-2))] ?? [];
  const captions = ["See the unexpected.", "Make your next move.", "Solve it together."];
  const images = ["exhibition", "digital", "committee"].map(id => EXPERIENCES.find(card => card.id === id)!);
  return <div className={`${styles.preview} ${large ? styles.large : styles.small}`}>
    <div className={styles.collage}>{images.map((card, i) => <div key={card.id} className={styles.tile}>
      <Image src={card.image} alt={`${card.title}${card.image.endsWith(".svg") ? " illustration" : " at Math Week"}`} fill sizes={large ? "35vw" : "18vw"} />
      {card.image.endsWith(".svg") && <span className={styles.placeholder}>PHOTO COMING SOON</span>}
      <span className={styles.caption}>{captions[i]}</span>
    </div>)}</div>
    <div className={styles.copy}>
      <span className={styles.eyebrow}>19–25 OCTOBER / XMUM LIBRARY</span>
      <h3>Maths you can see,<br />touch and play.</h3>
      {large && <p>Discover curious exhibits, hands-on puzzles and games across the library. Pick something that catches your eye.</p>}
      {events.length > 0 && <div className={styles.agenda}><span>{date < "2026-10-19" ? "MON 19 OCT" : date > "2026-10-25" ? "SUN 25 OCT" : "ON TODAY"}</span>{events.map(event => <div key={event.id}><strong>{event.time}</strong><span>{event.title}</span>{large && <small>{event.location}</small>}</div>)}</div>}
      {large && <div className={styles.experiences}>{EXPERIENCES.map(card => <span key={card.id}>{card.title}</span>)}</div>}
      <span className={styles.action}>Explore activities &amp; locations <span aria-hidden="true">↗</span></span>
    </div>
  </div>;
}
