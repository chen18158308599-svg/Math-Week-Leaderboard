"use client";
import { useEffect, useState } from "react";
export function MovingBackground() {
  const [touch, setTouch] = useState<{
    x: number;
    y: number;
    id: number;
  } | null>(null);
  useEffect(() => {
    const animate = (e: PointerEvent) =>
      setTouch({ x: e.clientX, y: e.clientY, id: Date.now() });
    window.addEventListener("pointerdown", animate);
    return () => window.removeEventListener("pointerdown", animate);
  }, []);
  return (
    <div className="background-scene" aria-hidden="true">
      <div className="background-shapes">
        <span className="bg-shape bg-circle" />
        <span className="bg-shape bg-square" />
        <span className="bg-shape bg-triangle" />
        <span className="bg-shape bg-orbit" />
        <span className="bg-shape bg-dot" />
      </div>
      {touch && (
        <span
          key={touch.id}
          className="background-ripple"
          style={{ left: touch.x, top: touch.y }}
        />
      )}
    </div>
  );
}
