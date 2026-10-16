import { useEffect, useRef, useState } from "react";
import "./App.css";

import Home from "./Home/Home";
import PostGameSubmission from "./components/PostGameSubmission";
import { useScoreRecording } from "./integration/useScoreRecording.js";

import Conway from "./games/Conway/Conway";
import DealOrNoDeal from "./games/DealOrNoDeal/DealOrNoDeal";
import KNN from "./games/KNN/KNN";
import NumberSequence from "./games/NumberSequence/NumberSequence";
import Planarity from "./games/Planarity/Planarity";
import SymmetryGame from "./games/Symmetry/Symmetry";

function HomeNavigation({ onHome, onSelectGame }) {
  const [expanded, setExpanded] = useState(false);
  const navigationRef = useRef(null);

  useEffect(() => {
    if (!expanded) return undefined;

    function handlePointerDown(event) {
      if (!navigationRef.current?.contains(event.target)) {
        setExpanded(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setExpanded(false);
        navigationRef.current
          ?.querySelector(".home-navigation__tab")
          ?.focus();
      }
    }

    window.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [expanded]);

  return (
    <div
      ref={navigationRef}
      className={`home-navigation${expanded ? " is-expanded" : ""}`}
    >
      <button
        type="button"
        className="home-navigation__tab"
        onClick={() => setExpanded((value) => !value)}
        aria-label={expanded ? "Close Home navigation" : "Open Home navigation"}
        aria-expanded={expanded}
        aria-controls="home-navigation-action"
        title={expanded ? "Close Home navigation" : "Open Home navigation"}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          {expanded ? (
            <path d="m15 5-7 7 7 7" />
          ) : (
            <path d="m9 5 7 7-7 7" />
          )}
        </svg>
      </button>
      <button
        id="home-navigation-action"
        type="button"
        className="home-navigation__action"
        onClick={onHome}
        aria-label="Return to Home"
        title="Home"
        aria-hidden={!expanded}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5.5 10v9h5v-5h3v5h5v-9" />
        </svg>
        <span>Home</span>
      </button>
      {expanded && <nav className="home-navigation__games" aria-label="Game shortcuts">
        {[["conway", "Conway"], ["deal", "Deal or No Deal"], ["knn", "KNN Heist"], ["sequence", "Number Sequence"], ["planarity", "Planarity Shootout"], ["symmetry", "Symmetry"]].map(([id, name]) => <button key={id} onClick={() => { onSelectGame(id); setExpanded(false); }}>{name}</button>)}
      </nav>}
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("home");
  const {
    pendingSubmission,
    resultRevision,
    requestClaim,
  } = useScoreRecording();
  const [postGameOpen, setPostGameOpen] = useState(false);
  const seenResultRevision = useRef(resultRevision);

  useEffect(() => {
    const reset = event => {
      if (event.source !== window.parent || event.origin !== window.location.origin || event.data?.type !== "mathweek:reset-session") return;
      setPage("home"); setPostGameOpen(false);
    };
    window.addEventListener("message", reset);
    return () => window.removeEventListener("message", reset);
  }, []);

  useEffect(() => {
    if (resultRevision === seenResultRevision.current) return;
    seenResultRevision.current = resultRevision;
    setPostGameOpen(true);
  }, [resultRevision]);

  function selectGame(gameId) { setPostGameOpen(false); setPage(gameId); }
  function returnHome() { setPage("home"); }

  function dismissPostGame() {
    setPostGameOpen(false);
    returnHome();
  }

  const postGameReady = pendingSubmission?.requiredSlots?.every(
    (slot) => pendingSubmission.results[slot]
  );
  const postGameSubmission = postGameOpen && postGameReady ? (
    <PostGameSubmission
      key={pendingSubmission.attemptId}
      submission={pendingSubmission}
      requestClaim={requestClaim}
      onReturnHome={dismissPostGame}
    />
  ) : null;

  /* =====================================================
     HOME
     ===================================================== */

  if (page === "home") {
    return (
      <>
        <Home onSelectGame={selectGame} />
        {postGameSubmission}
      </>
    );
  }

  /* =====================================================
     GAMES
     ===================================================== */

  return (
    <>
      <HomeNavigation onHome={returnHome} onSelectGame={selectGame} />

      {/* =========================
          CONWAY
      ========================= */}

      {page === "conway" && (
        <Conway onBack={returnHome} />
      )}

      {/* =========================
          DEAL OR NO DEAL
      ========================= */}

      {page === "deal" && (
        <DealOrNoDeal onBack={returnHome} />
      )}

      {/* =========================
          KNN
      ========================= */}

      {page === "knn" && (
        <KNN onHome={returnHome} />
      )}

      {/* =========================
          NUMBER SEQUENCE
      ========================= */}

      {page === "sequence" && (
        <NumberSequence
          onPostGameHome={returnHome}
        />
      )}

      {/* =========================
          PLANARITY
      ========================= */}

      {page === "planarity" && (
        <Planarity onHome={returnHome} />
      )}

      {/* =========================
          SYMMETRY
      ========================= */}

      {page === "symmetry" && (
        <SymmetryGame onBack={returnHome} />
      )}
      {postGameSubmission}
    </>
  );
}
