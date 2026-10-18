import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./GameGuide.css";

// Render in screen coordinates: game canvases may themselves be scaled.
// Hints advance on their highlighted action; movement hints dismiss on press.
export function GameGuide({ steps, active = true, defer = false, lang = "en", onFinish, autoStart = true }) {
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState(null);
  const [skipped] = useState(!autoStart);
  const step = !skipped && active && (!defer || index === 0) ? steps[index] : null;
  const complete = useRef(false);
  const ignoreGestureClick = useRef(false);
  const notified = useRef(false);
  const labelRef = useRef(null);
  const [labelHeight, setLabelHeight] = useState(220);
  useLayoutEffect(() => {
    if (labelRef.current) setLabelHeight(labelRef.current.getBoundingClientRect().height);
  }, [box, step?.text, step?.zh, lang]);
  useEffect(() => {
    if ((skipped || index >= steps.length) && !notified.current) {
      notified.current = true;
      onFinish?.();
    }
  }, [skipped, index, steps.length, onFinish]);
  useLayoutEffect(() => {
    complete.current = false;
    if (!step) return;
    let target;
    let visible = false;
    let pendingAction = false;
    let finishTimer;
    let lastPaused;
    const advance = () => {
      if (complete.current) return;
      complete.current = true;
      setIndex(value => value + 1);
    };
    const refresh = () => {
      target = document.querySelector(step.target);
      const nodes = step.highlightAll ? [...document.querySelectorAll(step.target)] : target ? [target] : [];
      const areas = nodes.map(node => node.getBoundingClientRect()).filter(r => r.width > 0 && r.height > 0).map(r => ({ x:Math.round(r.left), y:Math.round(r.top), w:Math.round(r.width), h:Math.round(r.height) }));
      visible = areas.length > 0;
      const x = visible ? Math.min(...areas.map(r=>r.x)) : 0;
      const y = visible ? Math.min(...areas.map(r=>r.y)) : 0;
      const next = visible ? { x, y, w:Math.max(...areas.map(r=>r.x+r.w))-x, h:Math.max(...areas.map(r=>r.y+r.h))-y, areas } : null;
      setBox(old => JSON.stringify(old) === JSON.stringify(next) ? old : next);
      const paused = !!(visible && step.pause);
      if (paused !== lastPaused) {
        lastPaused = paused;
        window.dispatchEvent(new CustomEvent("mathweek:guide-pause", { detail: paused }));
      }
    };
    const down = event => {
      ignoreGestureClick.current = false;
      const actionTarget = event.target.closest(step.advanceTarget || step.target);
      const valid = visible && !!actionTarget && !actionTarget.disabled;
      pendingAction = valid && !step.manual && !step.drag;
      if (valid && step.drag) {
        // The release/click from this same drag must not consume the next hint.
        ignoreGestureClick.current = true;
        advance();
      }
    };
    const click = event => {
      if (ignoreGestureClick.current) { ignoreGestureClick.current = false; return; }
      if (!visible) return; // Waiting for a future control is not a visible hint.
      if (step.manual) return;
      if (step.anywhere) { advance(); return; }
      const actionTarget = event.target.closest(step.advanceTarget || step.target);
      if (actionTarget && !actionTarget.disabled) advance();
    };
    const up = () => {
      if (pendingAction) {
        // Complete after the gesture's click, so it cannot also consume the next hint.
        finishTimer = setTimeout(advance, 80);
      }
    };
    refresh();
    const timer = setInterval(refresh, 150);
    document.addEventListener("pointerdown", down, true);
    document.addEventListener("pointerup", up, true);
    document.addEventListener("click", click, true);
    return () => {
      clearInterval(timer);
      clearTimeout(finishTimer);
      document.removeEventListener("pointerdown", down, true);
      document.removeEventListener("pointerup", up, true);
      document.removeEventListener("click", click, true);
      window.dispatchEvent(new CustomEvent("mathweek:guide-pause", { detail: false }));
    };
  }, [step?.target, step?.advanceTarget, step?.requireAction, step?.drag, step?.manual, step?.anywhere, step?.pause, step?.highlightAll, index, skipped, active]);
  if (!active) return null;
  const zh = lang === "zh";
  const labelWidth = Math.min(380, window.innerWidth - 32);
  const top = box ? Math.max(16, Math.min(window.innerHeight - labelHeight - 16, box.y > labelHeight + 30 ? box.y - labelHeight - 20 : box.y + box.h + 20)) : 0;
  return createPortal(<>
    {step && box && <div className="game-guide-layer">
      {box.areas.map((r,i)=><div key={i} className="game-guide-focus" style={{ left:r.x-6, top:r.y-6, width:r.w+12, height:r.h+12 }} />)}
      <div ref={labelRef} className="game-guide-label" role="status" style={{ width: labelWidth, left: Math.max(16, Math.min(window.innerWidth - labelWidth - 16, box.x + box.w / 2 - labelWidth / 2)), top }}>
        <strong>{zh ? step.zh : step.text}</strong>
        <span>{step.drag ? "↔" : top < box.y ? "↓" : "↑"}</span>
        {step.manual ? <button type="button" onClick={() => { complete.current = true; setIndex(value => value + 1); }}>{zh ? "下一条提示" : "Next hint"}</button> : <small>{step.anywhere ? (zh ? "点击任意处继续" : "Click anywhere to continue") : step.drag ? (zh ? "按下高亮操作区继续" : "Touch the highlighted control to continue") : step.requireAction ? (zh ? "点击高亮的攻击技能继续" : "Click a highlighted attack to continue") : (zh ? "操作高亮区域继续" : "Use the highlighted control to continue")}</small>}
      </div>
    </div>}
  </>, document.body);
}

// Contextual hints can appear in any order: a nearby chest should not have to
// wait for a combat hint whose target is not yet in range.
export function ContextHints({ hints, active = true, lang = "en" }) {
  const hintsRef = useRef(hints);
  hintsRef.current = hints;
  const [seen, setSeen] = useState([]);
  const [chosen, setChosen] = useState(null);
  useEffect(() => {
    if (!active) { setChosen(null); return; }
    const refresh = () => {
      const found = hintsRef.current.findIndex((hint, i) => !seen.includes(i) && [...document.querySelectorAll(hint.target)].some(node => {
        const b = node.getBoundingClientRect(); return b.width > 0 && b.height > 0 && !node.disabled;
      }));
      setChosen(found < 0 ? null : found);
    };
    refresh();
    const timer = setInterval(refresh, 200);
    return () => clearInterval(timer);
  }, [active, seen]);
  return <>
    {chosen !== null && active && <GameGuide key={chosen} steps={[hints[chosen]]} active={active} lang={lang} onFinish={() => setSeen(old => old.includes(chosen) ? old : [...old, chosen])} />}
  </>;
}

export function useGuidePause() {
  const paused = useRef(false);
  useEffect(() => {
    const update = event => { paused.current = !!event.detail; };
    window.addEventListener("mathweek:guide-pause", update);
    return () => { paused.current = false; window.removeEventListener("mathweek:guide-pause", update); };
  }, []);
  return paused;
}

export function QuickBrief({ lang = "en", goal, controls, finish }) {
  const labels = lang === "zh" ? ["目标", "操作", "结束"] : ["Goal", "Controls", "Finish"];
  return <dl className="game-quick-brief">{[goal, controls, finish].map((text, i) => <div key={i}><dt>{labels[i]}</dt><dd>{text}</dd></div>)}</dl>;
}
