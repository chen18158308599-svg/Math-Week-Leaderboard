"use client";
import { useState } from "react";
export function MathPlayground() {
  const [pulse, setPulse] = useState(0);
  return (
    <button
      className="math-playground"
      onClick={() => setPulse((p) => p + 1)}
      aria-label="Touch to animate the mathematical universe"
    >
      <span className="math-grid" />
      <span className="math-orbit orbit-one" />
      <span className="math-orbit orbit-two" />
      <span className="math-orbit orbit-three" />
      <span className="math-core">∞</span>
      <span className="math-node node-one">π</span>
      <span className="math-node node-two">Σ</span>
      <span className="math-node node-three">x²</span>
      <span className="math-coordinate">( curiosity, possibility )</span>
      {pulse > 0 && <span key={pulse} className="math-ripple" />}
      <span className="math-touch">TOUCH TO EXPLORE ↗</span>
    </button>
  );
}
