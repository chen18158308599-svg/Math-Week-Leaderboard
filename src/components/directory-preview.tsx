import Image from "next/image";
import { EXPERIENCES, SPECIAL_EVENTS } from "@/lib/directory-content";
import styles from "./directory-preview.module.css";

export function DirectoryPreview({ date, large }: { date: string; large: boolean }) {
  const previewDate = date < "2026-10-19" ? "2026-10-19" : date > "2026-10-25" ? "2026-10-25" : date;
  const events = SPECIAL_EVENTS[Number(previewDate.slice(-2))] ?? [];
  return <div className={`${styles.preview} ${large ? styles.large : styles.small}`}>
    <div className={styles.collage}>
      <div className={styles.tile}>
        <Image src="/whats-on-today/rubik.webp" alt="Rubik cubes and mathematical displays at the library" fill sizes={large ? "(max-width: 600px) 55vw, 35vw" : "18vw"} />
        <span className={styles.caption}>Explore Math Week.</span>
      </div>
      <div className={styles.tile}>
        <Image src="/whats-on-today/random2.webp" alt="Puzzle cards displayed on the library wall" fill sizes={large ? "(max-width: 600px) 35vw, 20vw" : "12vw"} />
      </div>
      <div className={styles.tile}>
        <Image src="/whats-on-today/kanoodle.webp" alt="Students solving the giant Kanoodle puzzle" fill sizes={large ? "(max-width: 600px) 35vw, 20vw" : "12vw"} />
      </div>
    </div>
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
