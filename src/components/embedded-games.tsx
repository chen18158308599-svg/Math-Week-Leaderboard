"use client";
import { useEffect, useRef, useState } from "react";
import { DIGITAL_GAME_URL } from "@/lib/digital-games";
export function EmbeddedGames() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [playing, setPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const onActivity = (event: MessageEvent) => {
      if (
        event.origin === new URL(DIGITAL_GAME_URL).origin &&
        event.source === frame.current?.contentWindow &&
        event.data?.type === "mathweek:activity"
      )
        window.dispatchEvent(new Event("mathweek:activity"));
    };
    window.addEventListener("message", onActivity);
    return () => window.removeEventListener("message", onActivity);
  }, []);
  return (
    <section className={playing ? "embedded-games playing" : "embedded-games"}>
      <div className="embed-toolbar">
        <div>
          <h2>Digital Games</h2>
          <p>
            Choose a game from the menu. Use the main navigation to return home.
          </p>
        </div>
        {playing && (
          <button
            className="week-button secondary"
            onClick={() => setPlaying(false)}
          >
            Close game
          </button>
        )}
      </div>
      {playing ? (
        <div className="game-frame-wrap">
          {!loaded && (
            <p className="game-loading" role="status">
              Loading the game website…
            </p>
          )}
          <iframe
            ref={frame}
            src={DIGITAL_GAME_URL}
            title="Math Week digital game website"
            allow="fullscreen"
            sandbox="allow-scripts allow-same-origin allow-forms"
            onLoad={() => setLoaded(true)}
          />
        </div>
      ) : (
        <div className="game-launch">
          <p>
            Start playing here on the Math Week screen. Automatic display rotation
            shows previews only.
          </p>
          <button
            className="week-button"
            onClick={() => {
              window.dispatchEvent(new Event("mathweek:activity"));
              setLoaded(false);
              setPlaying(true);
            }}
          >
            Start playing ↗
          </button>
        </div>
      )}

    </section>
  );
}
