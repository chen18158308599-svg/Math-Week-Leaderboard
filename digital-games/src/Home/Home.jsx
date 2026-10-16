import "./Home.css";
import { LEADERBOARD_ORIGIN } from "../integration/useScoreRecording.js";

import background from "../assets/home-layers/background.png";
import conway from "../assets/home-layers/conway.webp";
import deal from "../assets/home-layers/deal.webp";
import knn from "../assets/home-layers/knn.webp";
import sequence from "../assets/home-layers/sequence.webp";
import planarity from "../assets/home-layers/planarity.webp";
import symmetry from "../assets/home-layers/symmetry.webp";

export default function Home({ onSelectGame }) {
  return (
    <>
      {/* =========================
          HOME
      ========================= */}
      <main className="home-page">
        <a className="home-leaderboard-link" href={`${LEADERBOARD_ORIGIN}/leaderboard`} target="_blank" rel="noopener noreferrer">LEADERBOARD</a>
      {/* =========================
          MATH WEEK TITLE
      ========================= */}
      <div className="mathweek-title">
        <div className="mathweek-title-kicker">MATH WEEK 2026</div>
        <div className="mathweek-title-main">MATHVERSE</div>
        <div className="mathweek-title-subtitle">CHOOSE YOUR REALM</div>
      </div>

        {/* Background */}
        <img
          src={background}
          className="home-background"
          alt=""
          draggable="false"
        />

        {/* Conway */}
        <button
          type="button"
          className="island conway-island"
          onClick={() => onSelectGame("conway")}
          aria-label="Open Conway"
        >
          <img
            src={conway}
            alt="Conway"
            draggable="false"
          />
        </button>

        {/* Deal or No Deal */}
        <button
          type="button"
          className="island deal-island"
          onClick={() => onSelectGame("deal")}
          aria-label="Open Deal or No Deal"
        >
          <img
            src={deal}
            alt="Deal or No Deal"
            draggable="false"
          />
        </button>

        {/* KNN */}
        <button
          type="button"
          className="island knn-island"
          onClick={() => onSelectGame("knn")}
          aria-label="Open KNN"
        >
          <img
            src={knn}
            alt="KNN"
            draggable="false"
          />
        </button>

        {/* Number Sequence */}
        <button
          type="button"
          className="island sequence-island"
          onClick={() => onSelectGame("sequence")}
          aria-label="Open Number Sequence"
        >
          <img
            src={sequence}
            alt="Number Sequence"
            draggable="false"
          />
        </button>

        {/* Planarity */}
        <button
          type="button"
          className="island planarity-island"
          onClick={() => onSelectGame("planarity")}
          aria-label="Open Planarity"
        >
          <img
            src={planarity}
            alt="Planarity"
            draggable="false"
          />
        </button>

        {/* Symmetry */}
        <button
          type="button"
          className="island symmetry-island"
          onClick={() => onSelectGame("symmetry")}
          aria-label="Open Symmetry"
        >
          <img
            src={symmetry}
            alt="Symmetry"
            draggable="false"
          />
        </button>
      </main>
    </>
  );
}