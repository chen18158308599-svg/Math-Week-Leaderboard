"use client";

import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import { EXPERIENCES } from "@/lib/directory-content";
import { WEEK_POSTER } from "@/lib/whats-on-today";
import styles from "./directory.module.css";

const slides = [
  { src: WEEK_POSTER.src, alt: WEEK_POSTER.alt, title: "Math Week", placeholder: false },
  { src: "/whats-on-today/prizes-composite.webp", alt: "Camping chair, thermos, character blankets and magnetic badge", title: "★ Awards", placeholder: false },
  ...EXPERIENCES.filter(card => ["cards", "digital", "hands-on", "committee", "market"].includes(card.id)).map(card => ({ src: card.image, alt: card.image.endsWith(".svg") ? `${card.title} illustration; on-site photograph coming soon` : "Mathverse digital games promotional preview showing six game realms", title: card.title, placeholder: card.image.endsWith(".svg") })),
];

function subscribeMotion(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

export default function DirectoryShowcase() {
  const [index, setIndex] = useState(0);
  const reducedMotion = useSyncExternalStore(subscribeMotion, () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => false);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (reducedMotion || focused) return;
    const timer = window.setInterval(() => setIndex(value => (value + 1) % slides.length), 5000);
    return () => window.clearInterval(timer);
  }, [reducedMotion, focused, index]);
  const slide = slides[index];
  return <section className={styles.showcase} aria-label="Math Week highlights" aria-roledescription="carousel" onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
    <div className={styles.slideMedia} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${slides.length}: ${slide.title}`}>
      <Image src={slide.src} alt={slide.alt} fill sizes="(max-width: 900px) 91vw, 55vw" preload={index === 0} />
      <span className={styles.slideLabel}>{slide.title}</span>
      {slide.placeholder && <span className={styles.slidePlaceholder}>PHOTO COMING SOON</span>}
    </div>
    <div className={styles.slideControls}>
      <button type="button" className={styles.slideArrow} aria-label="Previous slide" onClick={() => setIndex(value => (value - 1 + slides.length) % slides.length)}>←</button>
      <div className={styles.slideDots}>{slides.map((item, i) => <button key={item.src} type="button" aria-label={`Show ${item.title}`} aria-pressed={index === i} onClick={() => setIndex(i)} />)}</div>
      <button type="button" className={styles.slideArrow} aria-label="Next slide" onClick={() => setIndex(value => (value + 1) % slides.length)}>→</button>
    </div>
  </section>;
}
