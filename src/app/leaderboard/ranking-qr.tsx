"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "./leaderboard-guide.module.css";

export function RankingQr() {
  const [qr, setQr] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    void import("qrcode").then(module => module.default.toDataURL(new URL("/my-score", window.location.origin).href, { width: 280, margin: 4, errorCorrectionLevel: "M" }))
      .then(value => { if (active) setQr(value); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []);
  return <section className={styles.rankingQr} aria-labelledby="ranking-qr-title">
    <h2 id="ranking-qr-title">See your ranking</h2>
    <div className={styles.rankingQrImage}>{qr ? <Image src={qr} alt="Scan to sign in and view your personal ranking" width={240} height={240} unoptimized /> : <p role={failed ? "alert" : "status"}>{failed ? "QR unavailable. Refresh to try again." : "Preparing QR…"}</p>}</div>
    <p>Scan with your phone and sign in with your school email to see your points and rank.</p>
  </section>;
}
