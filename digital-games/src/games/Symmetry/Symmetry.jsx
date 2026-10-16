import { useEffect, useMemo, useRef, useState } from "react";

import symmetryIsland from "../../assets/home-layers/symmetry.png";

import "./Symmetry.css";

import {

  calculateSymmetryScore,

  createCompetitionAttempt,

} from "../../scoring/competitionScoring.js";



/* =========================================================

   SYMMETRY QUICK CHALLENGE

   ========================================================= */



const PLAYER_X = 22;

const WORLD_SCALE = 0.46;

const SEGMENT_LEN = 460;

const TARGET_DISTANCE = 6000;

const MAX_VITALITY = 3;

const START_SPEED = 62;

const MAX_SPEED = 108;



const SKILL_INFO = {

  shield: {

    label: ["相位护盾", "PHASE SHIELD"],

    short: "SHIELD",

    icon: "⬡",

    distance: 560,

  },

  magnet: {

    label: ["磁力场", "MAGNET FIELD"],

    short: "MAGNET",

    icon: "∩",

    distance: 520,

  },

  overdrive: {

    label: ["超载推进", "OVERDRIVE"],

    short: "BOOST",

    icon: "⚡",

    distance: 430,

  },

  repair: {

    label: ["生命修复", "VITALITY REPAIR"],

    short: "REPAIR",

    icon: "+",

    distance: 0,

  },

};



const WINDOW_THEMES = ["meadow", "inferno", "storm", "aurora"];



const COPY = {

  zh: {

    brand: "镜界快速挑战",

    introTitle: "镜界疾驰",

    introSub: "SYMMETRY · 6000 M FIRE ORB RUSH",

    intro:

      "穿越镜像实验隧道，抵达 6000 米终点。按住屏幕让球体底部喷火上升，松开后自然下降；闪避障碍与导弹，并完成简单的对称题。",

    launch: "开始快速挑战",

    hold: "按住 / Space 让球体喷火上升",

    release: "松开自然下降",

    vitality: "生命",

    distance: "距离",

    speed: "速度",

    level: "难度",

    coins: "能源",

    solved: "已解题",

    missile: "导弹锁定",

    warning: "改变高度躲避锁定轨迹",

    repairFull: "生命已满 · 修复核心转化为 15 能源",

    repair: "生命修复 +1",

    shield: "相位护盾已启动",

    magnet: "磁力场已启动",

    boost: "超载推进已启动",

    shieldAbsorb: "相位护盾吸收冲击",

    obstacleHit: "撞击障碍 · 生命 -1",

    missileHit: "导弹命中 · 生命 -1",

    wrong: "答案错误 · 生命 -1",

    correct: "校准正确 · 继续推进",

    failTitle: "推进单元失效",

    failText: "在抵达 6000 米终点前，三点生命已全部耗尽。",

    victoryTitle: "挑战完成",

    victoryText: "成功抵达 6000 米终点！",

    restart: "重新挑战",

    back: "返回大厅",

    guide: "操作说明",

    guide1: "按住屏幕、鼠标或 Space，让球体下方喷火并向上飞行；松开后受重力自然下降。",

    guide2: "闪避激光、尖刺、无人机与追踪导弹。导弹会先锁定当前高度，再高速冲入画面。",

    guide3: "每次答错对称题都会直接失去 1 点生命；途中收集绿色 REPAIR 核心可以恢复 1 点生命。",

    guide4: "跑得越远，速度越快、障碍越密、导弹越频繁。抵达 6000 米即可完成挑战。",

    close: "继续",

    tap: "按住让球体喷火",

  },

  en: {

    brand: "MIRROR QUICK CHALLENGE",

    introTitle: "Mirror Rush",

    introSub: "SYMMETRY · 6000 M FIRE ORB RUSH",

    intro:

      "Race through the mirror tunnel to the 6000 m finish. Hold to fire the jet beneath the glowing orb and rise; release to descend. Dodge hazards and answer simple symmetry questions.",

    launch: "START QUICK CHALLENGE",

    hold: "Hold / Space to fire the orb jet",

    release: "Release to descend",

    vitality: "Vitality",

    distance: "Distance",

    speed: "Speed",

    level: "Difficulty",

    coins: "Energy",

    solved: "Solved",

    missile: "MISSILE LOCK",

    warning: "Change altitude before the missile arrives",

    repairFull: "Vitality full · Repair core converted to 15 energy",

    repair: "Vitality restored +1",

    shield: "Phase Shield online",

    magnet: "Magnet Field online",

    boost: "Overdrive online",

    shieldAbsorb: "Phase Shield absorbed the impact",

    obstacleHit: "Obstacle impact · Vitality -1",

    missileHit: "Missile hit · Vitality -1",

    wrong: "Wrong answer · Vitality -1",

    correct: "Calibration correct · Run resumed",

    failTitle: "PROPULSION UNIT OFFLINE",

    failText: "All three vitality points were lost before reaching the 6000 m finish.",

    victoryTitle: "CHALLENGE COMPLETE",

    victoryText: "You reached the 6000 m finish!",

    restart: "RUN AGAIN",

    back: "RETURN TO HUB",

    guide: "OPERATION MANUAL",

    guide1: "Hold the screen, mouse, or Space to fire the jet beneath the orb and ascend. Release to descend under gravity.",

    guide2: "Avoid lasers, spikes, drones and homing missiles. Missiles first lock your current altitude, then rush into the tunnel.",

    guide3: "Every wrong symmetry answer directly costs 1 vitality. Collect green REPAIR cores along the route to restore 1 vitality.",

    guide4: "The farther you run, the faster the tunnel scrolls, the denser the hazards become, and the more often missiles appear. Reach 6000 m to complete the challenge.",

    close: "CONTINUE",

    tap: "HOLD TO BOOST",

  },

};



/* =========================================================

   HELPERS

   ========================================================= */



const clamp = (value, min, max) => Math.max(min, Math.min(max, value));



function screenX(at, progress) {

  return PLAYER_X + (at - progress) * WORLD_SCALE;

}



function mulberry32(seed) {

  let value = seed >>> 0;

  return function random() {

    value += 0x6d2b79f5;

    let t = value;

    t = Math.imul(t ^ (t >>> 15), t | 1);

    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;

  };

}



function randInt(rng, min, max) {

  return Math.floor(rng() * (max - min + 1)) + min;

}



function nonZeroInt(rng, min = -6, max = 6) {

  let value = 0;

  while (value === 0) value = randInt(rng, min, max);

  return value;

}



function formatCoord(x, y) {

  return `(${x}, ${y})`;

}



function shuffled(values, rng) {

  const result = [...values];

  for (let i = result.length - 1; i > 0; i -= 1) {

    const j = Math.floor(rng() * (i + 1));

    [result[i], result[j]] = [result[j], result[i]];

  }

  return result;

}



function uniqueOptions(correct, distractors, rng) {

  const result = [correct];

  for (const value of distractors) {

    if (!result.includes(value)) result.push(value);

    if (result.length === 3) break;

  }

  return shuffled(result, rng);

}



/* =========================================================

   SIMPLE, ACCURATE SYMMETRY QUESTIONS

   Each SVG point is generated from the same coordinates as its answer.

   ========================================================= */



function makeQuestion(index) {

  const rng = mulberry32(index * 7919 + 2026);

  const x = nonZeroInt(rng, -4, 4);

  let y = nonZeroInt(rng, -4, 4);

  // Distinct absolute values make every choice easy to distinguish.

  while (Math.abs(x) === Math.abs(y)) y = nonZeroInt(rng, -4, 4);



  const mode = index % 4;

  const base = {

    id: `q-${index}`,

    number: String(index + 1).padStart(2, "0"),

    point: { x, y },

  };

  let image;

  let distractors;

  let title;

  let type;

  let visual;

  let question;

  let hint;



  if (mode === 0) {

    // Y axis = left/right flip. Only X changes sign.

    image = { x: -x, y };

    distractors = [formatCoord(x, -y), formatCoord(-x, -y), formatCoord(x, y)];

    title = ["左右镜像", "LEFT–RIGHT MIRROR"];

    type = ["关于 y 轴", "REFLECT OVER Y-AXIS"];

    visual = "vertical";

    question = [

      `把点 P${formatCoord(x, y)} 关于 y 轴对称，P′ 的坐标是什么？`,

      `Reflect P${formatCoord(x, y)} over the y-axis. Where is P′?`,

    ];

    hint = ["左右翻转：x 变号，y 不变。", "Left/right flip: change the sign of x; keep y."];

  } else if (mode === 1) {

    // X axis = up/down flip. Only Y changes sign.

    image = { x, y: -y };

    distractors = [formatCoord(-x, y), formatCoord(-x, -y), formatCoord(x, y)];

    title = ["上下镜像", "UP–DOWN MIRROR"];

    type = ["关于 x 轴", "REFLECT OVER X-AXIS"];

    visual = "horizontal";

    question = [

      `把点 P${formatCoord(x, y)} 关于 x 轴对称，P′ 的坐标是什么？`,

      `Reflect P${formatCoord(x, y)} over the x-axis. Where is P′?`,

    ];

    hint = ["上下翻转：x 不变，y 变号。", "Up/down flip: keep x; change the sign of y."];

  } else if (mode === 2) {

    // Half-turn around the origin.

    image = { x: -x, y: -y };

    distractors = [formatCoord(-x, y), formatCoord(x, -y), formatCoord(x, y)];

    title = ["绕原点半周旋转", "HALF-TURN"];

    type = ["旋转 180°", "ROTATE 180°"];

    visual = "halfTurn";

    question = [

      `点 P${formatCoord(x, y)} 绕原点旋转 180°，P′ 在哪里？`,

      `Turn P${formatCoord(x, y)} 180° around (0, 0). Where is P′?`,

    ];

    hint = ["绕原点旋转 180°：x、y 都变号。", "A 180° turn changes the signs of both coordinates."];

  } else {

    // Diagonal y=x reflection. Swap X and Y.

    image = { x: y, y: x };

    distractors = [formatCoord(x, y), formatCoord(-y, x), formatCoord(y, -x)];

    title = ["对角线镜像", "DIAGONAL MIRROR"];

    type = ["关于 y = x", "REFLECT OVER Y = X"];

    visual = "diagonal";

    question = [

      `把点 P${formatCoord(x, y)} 关于直线 y = x 对称，P′ 在哪里？`,

      `Reflect P${formatCoord(x, y)} over the line y = x. Where is P′?`,

    ];

    hint = ["关于 y = x 对称：交换 x、y 的位置。", "Over y = x: swap x and y." ];

  }



  const answer = formatCoord(image.x, image.y);

  return {

    ...base,

    reflected: image,

    visual,

    title,

    type,

    question,

    hint,

    answer,

    options: uniqueOptions(answer, distractors, rng),

  };

}



/* =========================================================

   ENDLESS SEGMENT GENERATOR

   ========================================================= */



function buildSegment(index) {

  const rng = mulberry32((index + 91) * 104729);

  const start = index * SEGMENT_LEN;

  const difficulty = Math.max(1, 1 + Math.floor(index / 4));

  const obstacleCount = clamp(2 + Math.floor(difficulty / 3), 2, 4);

  const obstacleTypes = ["floorLaser", "ceilingLaser", "drone", "spikes"];



  const obstacles = Array.from({ length: obstacleCount }, (_, i) => {

    const baseGap = (SEGMENT_LEN - 150) / obstacleCount;

    const at = start + 95 + i * baseGap + rng() * Math.min(48, baseGap * 0.42);

    const type = obstacleTypes[(index + i + randInt(rng, 0, 2)) % obstacleTypes.length];

    return {

      id: `seg-${index}-ob-${i}`,

      at,

      type,

      y: type === "drone" ? randInt(rng, 31, 67) : undefined,

    };

  });



  const coinCount = 11 + randInt(rng, 0, 5);

  const coinCentre = randInt(rng, 35, 62);

  const amplitude = randInt(rng, 8, 18);

  const coins = Array.from({ length: coinCount }, (_, i) => ({

    id: `seg-${index}-coin-${i}`,

    at: start + 35 + i * ((SEGMENT_LEN - 80) / Math.max(1, coinCount - 1)),

    y: clamp(coinCentre + Math.sin(i * 0.8 + index) * amplitude, 23, 73),

  }));



  const skills = [];

  if (index >= 1) {

    if (index % 4 === 2) {

      skills.push({

        id: `seg-${index}-repair`,

        at: start + SEGMENT_LEN * (0.42 + rng() * 0.2),

        y: randInt(rng, 30, 66),

        type: "repair",

      });

    } else if (rng() < 0.48) {

      const typeRoll = rng();

      const type = typeRoll < 0.36 ? "shield" : typeRoll < 0.7 ? "magnet" : "overdrive";

      skills.push({

        id: `seg-${index}-${type}`,

        at: start + SEGMENT_LEN * (0.38 + rng() * 0.28),

        y: randInt(rng, 28, 68),

        type,

      });

    }

  }



  return {

    index,

    obstacles,

    coins,

    skills,

    window: {

      id: `window-${index}`,

      at: start + 18,

      width: 285 + randInt(rng, 0, 55),

      theme: WINDOW_THEMES[((index % WINDOW_THEMES.length) + WINDOW_THEMES.length) % WINDOW_THEMES.length],

    },

  };

}



function obstacleBounds(obstacle) {

  if (obstacle.type === "floorLaser") return [57, 84];

  if (obstacle.type === "ceilingLaser") return [15, 42];

  if (obstacle.type === "spikes") return [61, 84];

  return [obstacle.y - 8.5, obstacle.y + 8.5];

}



/* =========================================================

   VISUAL COMPONENTS

   ========================================================= */



function RocketOrb({ thrust, overdrive, hit }) {

  // The visual orb stays within the existing player wrapper and viewBox.

  return (

    <svg

      className={`runner-pilot-svg rocket-orb-svg ${thrust ? "thrusting" : ""} ${overdrive ? "overdrive" : ""} ${hit ? "damaged" : ""}`}

      viewBox="0 0 220 220"

      aria-hidden="true"

    >

      <defs>

        <radialGradient id="plasmaOrbBody" cx="42%" cy="36%" r="68%">

          <stop offset="0%" stopColor="#1b83c6" />

          <stop offset="45%" stopColor="#10528d" />

          <stop offset="82%" stopColor="#092a54" />

          <stop offset="100%" stopColor="#06152d" />

        </radialGradient>

        <radialGradient id="plasmaOrbLight" cx="50%" cy="52%" r="55%">

          <stop offset="0%" stopColor="#f2ffff" stopOpacity=".98" />

          <stop offset="14%" stopColor="#a9f8ff" stopOpacity=".94" />

          <stop offset="38%" stopColor="#35d8ff" stopOpacity=".7" />

          <stop offset="72%" stopColor="#168fe0" stopOpacity=".22" />

          <stop offset="100%" stopColor="#168fe0" stopOpacity="0" />

        </radialGradient>

        <radialGradient id="plasmaOrbBloom">

          <stop offset="45%" stopColor="#42dfff" stopOpacity=".22" />

          <stop offset="78%" stopColor="#168ff0" stopOpacity=".1" />

          <stop offset="100%" stopColor="#168ff0" stopOpacity="0" />

        </radialGradient>

      </defs>



      <circle className="orb-bloom" cx="110" cy="87" r="61" fill="url(#plasmaOrbBloom)" />

      <circle

        className="orb-sphere"

        cx="110"

        cy="87"

        r="53"

        fill="url(#plasmaOrbBody)"

        stroke="#55dfff"

        strokeOpacity=".82"

        strokeWidth="1.5"

      />

      <circle className="orb-plasma" cx="110" cy="87" r="51" fill="url(#plasmaOrbLight)" />

      <ellipse cx="96" cy="67" rx="11" ry="4.5" fill="#f0ffff" opacity=".64" />

      <circle cx="91" cy="73" r="2.3" fill="#ffffff" opacity=".85" />

    </svg>

  );

}



/**
 * Visible symmetry checkpoint. This portal is placed at the same world
 * coordinate as the question trigger: passing through its centre starts
 * the existing puzzle. It is intentionally a full-height, non-colliding gate.
 */
function SymmetryQuestionGate({ at, progress, lang }) {
  const x = screenX(at, progress);
  if (x < -12 || x > 110) return null;

  return (
    <div
      className="symmetry-question-gate"
      style={{ left: `${x}%` }}
      aria-hidden="true"
    >
      <div className="symmetry-gate-aura" />
      <div className="symmetry-gate-frame" />
      <div className="symmetry-gate-inner" />
      <div className="symmetry-gate-scan" />
      <div className="symmetry-gate-symbol"><span>?</span></div>
      <div className="symmetry-gate-label">
        <strong>{lang === "en" ? "SYMMETRY GATE" : "对称挑战门"}</strong>
        <small>{Math.max(0, Math.ceil(at - progress))} m</small>
      </div>
    </div>
  );
}

function TunnelWindow({ windowData, progress }) {

  const left = screenX(windowData.at, progress);

  const width = windowData.width * WORLD_SCALE;

  if (left + width < -8 || left > 108) return null;



  return (

    <div

      className={`tunnel-window ${windowData.theme}`}

      style={{ left: `${left}%`, width: `${width}%` }}

    >

      <div className="window-world">

        <div className="outside-sky" />

        <div className="outside-land" />

        <div className="outside-detail d1" />

        <div className="outside-detail d2" />

        <div className="outside-detail d3" />

      </div>

      <div className="window-glass" />

      <div className="window-frame left" />

      <div className="window-frame right" />

      <span className="window-label">

        {windowData.theme === "meadow"

          ? "GREENLAND SECTOR"

          : windowData.theme === "inferno"

            ? "INFERNO EXTERIOR"

            : windowData.theme === "storm"

              ? "STORM FRONT"

              : "AURORA RIDGE"}

      </span>

    </div>

  );

}



function EnergyCoin({ coin, progress, magnet }) {

  let x = screenX(coin.at, progress);

  const dx = x - PLAYER_X;

  if (magnet && dx > -4 && dx < 17) x -= dx * clamp(1 - dx / 17, 0, 1) * 0.62;

  if (x < -7 || x > 107) return null;

  return (

    <div className={`runner-coin ${magnet ? "magnet-active" : ""}`} style={{ left: `${x}%`, top: `${coin.y}%` }}>

      <i />

      <span>◇</span>

    </div>

  );

}



function SkillPickup({ skill, progress }) {

  const x = screenX(skill.at, progress);

  if (x < -8 || x > 108) return null;

  const info = SKILL_INFO[skill.type];

  return (

    <div className={`runner-skill ${skill.type}`} style={{ left: `${x}%`, top: `${skill.y}%` }}>

      <div className="skill-pulse" />

      <div className="skill-core">{info.icon}</div>

      <small>{info.short}</small>

    </div>

  );

}



function Obstacle({ obstacle, progress }) {

  const x = screenX(obstacle.at, progress);

  if (x < -13 || x > 113) return null;



  if (obstacle.type === "floorLaser") {

    return (

      <div className="runner-obstacle floor-laser" style={{ left: `${x}%` }}>

        <div className="laser-emitter">!</div>

        <div className="laser-column" />

      </div>

    );

  }



  if (obstacle.type === "ceilingLaser") {

    return (

      <div className="runner-obstacle ceiling-laser" style={{ left: `${x}%` }}>

        <div className="laser-emitter">!</div>

        <div className="laser-column" />

      </div>

    );

  }



  if (obstacle.type === "spikes") {

    return (

      <div className="runner-obstacle runner-spikes" style={{ left: `${x}%` }}>

        {Array.from({ length: 5 }).map((_, i) => <i key={i} />)}

      </div>

    );

  }



  return (

    <div className="runner-obstacle sentry-drone" style={{ left: `${x}%`, top: `${obstacle.y}%` }}>

      <div className="drone-orbit one" />

      <div className="drone-orbit two" />

      <div className="drone-body">◆</div>

      <i className="drone-eye" />

    </div>

  );

}



function Missile({ missile }) {

  if (missile.phase === "warning") {

    return (

      <div className="missile-lock-line" style={{ top: `${missile.y}%` }}>

        <div className="missile-lock-arrow">◀</div>

        <span>MISSILE LOCK</span>

      </div>

    );

  }



  return (

    <div className="hunter-missile" style={{ left: `${missile.x}%`, top: `${missile.y}%` }}>

      <div className="missile-flame" />

      <div className="missile-body">

        <i className="fin top" />

        <i className="fin bottom" />

        <span />

      </div>

    </div>

  );

}



function QuestionDiagram({ puzzle, lang }) {

  // Display real question coordinates instead of the previous hard-coded

  // P / ? markers, which could contradict the written question.

  const { point, reflected, visual } = puzzle;

  const px = (x) => 160 + x * 30;

  const py = (y) => 160 - y * 30;

  const labels = [-4, -2, 2, 4];

  const pX = px(point.x);

  const pY = py(point.y);

  const imageX = px(reflected.x);

  const imageY = py(reflected.y);

  const axisLabel = visual === "vertical"

    ? "y-axis"

    : visual === "horizontal"

      ? "x-axis"

      : visual === "diagonal"

        ? "y = x"

        : "180°";



  return (

    <div className="question-grid question-grid-accurate">

      <svg className="question-coordinate-svg" viewBox="0 0 320 320" role="img"

        aria-label={`${axisLabel}: P ${formatCoord(point.x, point.y)} reflected to an unknown position`}>

        <defs>

          <marker id="reflection-guide-arrow" markerWidth="5" markerHeight="5" refX="3" refY="2.5" orient="auto">

            <path d="M0 0 L5 2.5 L0 5 Z" fill="#f7ce6b" />

          </marker>

        </defs>

        {Array.from({ length: 9 }, (_, i) => {

          const pos = 40 + i * 30;

          return (

            <g key={i} className="coordinate-grid-lines">

              <line x1={pos} y1="40" x2={pos} y2="280" />

              <line x1="40" y1={pos} x2="280" y2={pos} />

            </g>

          );

        })}

        <line className="coordinate-axis" x1="28" y1="160" x2="296" y2="160" />

        <line className="coordinate-axis" x1="160" y1="292" x2="160" y2="24" />

        <text className="coordinate-axis-label" x="300" y="151">x</text>

        <text className="coordinate-axis-label" x="171" y="24">y</text>

        <text className="coordinate-zero" x="166" y="174">0</text>

        {labels.map((v) => (

          <g key={v} className="coordinate-numbers">

            <text x={px(v)} y="178" textAnchor="middle">{v}</text>

            <text x="151" y={py(v) + 4} textAnchor="end">{v}</text>

          </g>

        ))}

        {visual === "vertical" && <line className="mirror-axis-highlight" x1="160" y1="30" x2="160" y2="290" />}

        {visual === "horizontal" && <line className="mirror-axis-highlight" x1="30" y1="160" x2="290" y2="160" />}

        {visual === "diagonal" && <line className="mirror-axis-highlight" x1="40" y1="280" x2="280" y2="40" />}

        {visual === "halfTurn" && <circle cx="160" cy="160" r="9" className="origin-highlight" />}

        <line className="reflection-guide" x1={pX} y1={pY} x2={imageX} y2={imageY}

          markerEnd="url(#reflection-guide-arrow)" />

        <circle className="question-point-halo" cx={pX} cy={pY} r="19" />

        <circle className="question-point-source" cx={pX} cy={pY} r="13" />

        <text className="question-point-letter" x={pX} y={pY + 4} textAnchor="middle">P</text>

        <circle className="question-point-target-halo" cx={imageX} cy={imageY} r="19" />

        <circle className="question-point-target" cx={imageX} cy={imageY} r="13" />

        <text className="question-point-target-label" x={imageX} y={imageY + 4} textAnchor="middle">?</text>

      </svg>

      <div className="question-diagram-caption">

        <span><i className="legend-source" />P {formatCoord(point.x, point.y)}</span>

        <span><i className="legend-target" />{lang === "en" ? "Find P′" : "求 P′"}</span>

      </div>

    </div>

  );

}



/* =========================================================

   MAIN

   ========================================================= */



export default function SymmetryGame({ onBack }) {

  const [lang, setLang] = useState("en");

  const [screen, setScreen] = useState("intro");

  const [showRules, setShowRules] = useState(false);



  const [progress, setProgress] = useState(0);

  const [playerY, setPlayerY] = useState(50);

  const [thrust, setThrust] = useState(false);

  const [vitality, setVitality] = useState(MAX_VITALITY);

  const [coins, setCoins] = useState(0);

  const [questionsSolved, setQuestionsSolved] = useState(0);

  const [difficulty, setDifficulty] = useState(1);

  const [currentSpeed, setCurrentSpeed] = useState(START_SPEED);



  const [activeSkill, setActiveSkill] = useState(null);

  const [missiles, setMissiles] = useState([]);

  const [bursts, setBursts] = useState([]);

  const [notice, setNotice] = useState("");

  const [hit, setHit] = useState(false);



  const [activePuzzle, setActivePuzzle] = useState(null);

  const [selected, setSelected] = useState(null);

  const [wrongChoices, setWrongChoices] = useState([]);

  const [answerState, setAnswerState] = useState("idle");



  const [bestDistance, setBestDistance] = useState(() => {

    try {

      return Number(localStorage.getItem("symmetry-endless-best-v2")) || 0;

    } catch {

      return 0;

    }

  });

  const [pickupRevision, setPickupRevision] = useState(0);

  const [terminalSnapshot, setTerminalSnapshot] = useState(null);

  const [initialCompetitionAttempt] = useState(() =>

    createCompetitionAttempt("symmetry")

  );



  const t = COPY[lang];



  const progressRef = useRef(0);

  const playerYRef = useRef(50);

  const velocityRef = useRef(0);

  const thrustRef = useRef(false);

  const vitalityRef = useRef(MAX_VITALITY);

  const difficultyRef = useRef(1);

  const activeSkillRef = useRef(null);

  const lastFrameRef = useRef(null);

  const nextQuestionAtRef = useRef(620);

  const questionIndexRef = useRef(0);

  const nextMissileAtRef = useRef(980);

  const missileIdRef = useRef(1);

  const missilesRef = useRef([]);

  const burstsRef = useRef([]);

  const collectedCoinsRef = useRef(new Set());

  const collectedSkillsRef = useRef(new Set());

  const processedObstaclesRef = useRef(new Set());

  const processedMissilesRef = useRef(new Set());

  const damageCooldownRef = useRef(0);

  const noticeTimerRef = useRef(null);

  const hitTimerRef = useRef(null);

  const puzzleTimerRef = useRef(null);

  const failTimerRef = useRef(null);

  const coinsRef = useRef(0);

  const questionsSolvedRef = useRef(0);

  const terminalSnapshotRef = useRef(null);

  const competitionAttemptRef = useRef(initialCompetitionAttempt);



  const paused = screen !== "play" || showRules || activePuzzle !== null;

  const skillType = activeSkill?.type;

  const shield = skillType === "shield";

  const magnet = skillType === "magnet";

  const overdrive = skillType === "overdrive";



  const segmentIndex = Math.floor(progress / SEGMENT_LEN);

  const scene = useMemo(() => {

    const segments = [];

    for (let i = Math.max(0, segmentIndex - 1); i <= segmentIndex + 4; i += 1) {

      segments.push(buildSegment(i));

    }

    return {

      obstacles: segments.flatMap((segment) => segment.obstacles),

      coins: segments.flatMap((segment) => segment.coins),

      skills: segments.flatMap((segment) => segment.skills),

      windows: segments.map((segment) => segment.window),

    };

  }, [segmentIndex]);



  const visibleCoins = useMemo(

    () => scene.coins.filter((coin) => !collectedCoinsRef.current.has(coin.id)),

    [scene.coins, pickupRevision]

  );

  const visibleSkills = useMemo(

    () => scene.skills.filter((skill) => !collectedSkillsRef.current.has(skill.id)),

    [scene.skills, pickupRevision]

  );



  function tr(zh, en) {

    return lang === "en" ? en : zh;

  }



  function showNotice(text) {

    setNotice(text);

    clearTimeout(noticeTimerRef.current);

    noticeTimerRef.current = setTimeout(() => setNotice(""), 1500);

  }



  function addBurst(x = PLAYER_X, y = playerYRef.current, kind = "impact") {

    const burst = {

      id: `${Date.now()}-${Math.random()}`,

      x,

      y,

      age: 0,

      kind,

    };

    burstsRef.current = [...burstsRef.current, burst];

    setBursts(burstsRef.current);

  }



  function finalizeRun(outcome, finalProgress = progressRef.current) {

    if (terminalSnapshotRef.current) return terminalSnapshotRef.current;



    progressRef.current = finalProgress;

    setProgress(finalProgress);

    thrustRef.current = false;

    setThrust(false);



    const metrics = {

      distance: Math.floor(finalProgress),

      progress: finalProgress,

      coins: coinsRef.current,

      questionsSolved: questionsSolvedRef.current,

    };

    const finalScore = calculateSymmetryScore(metrics);

    const result = competitionAttemptRef.current.finalize({

      playerSlot: "single",

      finalScore,

      outcome,

    });

    const snapshot = Object.freeze({

      ...metrics,

      finalScore: result.finalScore,

      result,

    });



    terminalSnapshotRef.current = snapshot;

    setTerminalSnapshot(snapshot);

    return snapshot;

  }



  function endRunSoon() {

    if (terminalSnapshotRef.current) return;

    finalizeRun("loss");

    clearTimeout(failTimerRef.current);

    failTimerRef.current = setTimeout(() => setScreen("fail"), 420);

  }



  function damagePlayer(source, y = playerYRef.current) {

    if (terminalSnapshotRef.current) return false;

    const now = performance.now();

    if (damageCooldownRef.current > now || vitalityRef.current <= 0) return false;



    const skill = activeSkillRef.current;

    if (skill?.type === "shield" || skill?.type === "overdrive") {

      damageCooldownRef.current = now + 420;

      addBurst(PLAYER_X + 1, y, "shield");

      showNotice(t.shieldAbsorb);

      return false;

    }



    damageCooldownRef.current = now + 760;

    const next = vitalityRef.current - 1;

    vitalityRef.current = next;

    setVitality(next);

    setHit(true);

    addBurst(PLAYER_X + 1, y, source === "missile" ? "missile" : "impact");

    velocityRef.current = -9;

    showNotice(source === "missile" ? t.missileHit : t.obstacleHit);



    clearTimeout(hitTimerRef.current);

    hitTimerRef.current = setTimeout(() => setHit(false), 520);



    if (next <= 0) endRunSoon();

    return true;

  }



  function damageFromWrongAnswer() {

    if (terminalSnapshotRef.current || vitalityRef.current <= 0) return;

    const next = vitalityRef.current - 1;

    vitalityRef.current = next;

    setVitality(next);

    addBurst(50, 49, "error");

    showNotice(t.wrong);

    if (next <= 0) endRunSoon();

  }



  function startGame() {

    clearTimeout(puzzleTimerRef.current);

    clearTimeout(failTimerRef.current);

    clearTimeout(hitTimerRef.current);

    clearTimeout(noticeTimerRef.current);



    progressRef.current = 0;

    playerYRef.current = 50;

    velocityRef.current = 0;

    thrustRef.current = false;

    vitalityRef.current = MAX_VITALITY;

    difficultyRef.current = 1;

    activeSkillRef.current = null;

    coinsRef.current = 0;

    questionsSolvedRef.current = 0;

    terminalSnapshotRef.current = null;

    competitionAttemptRef.current = createCompetitionAttempt("symmetry");

    lastFrameRef.current = null;

    nextQuestionAtRef.current = 620;

    questionIndexRef.current = 0;

    nextMissileAtRef.current = 980;

    missileIdRef.current = 1;

    missilesRef.current = [];

    burstsRef.current = [];

    collectedCoinsRef.current = new Set();

    collectedSkillsRef.current = new Set();

    processedObstaclesRef.current = new Set();

    processedMissilesRef.current = new Set();

    damageCooldownRef.current = 0;



    setProgress(0);

    setPlayerY(50);

    setThrust(false);

    setVitality(MAX_VITALITY);

    setCoins(0);

    setQuestionsSolved(0);

    setDifficulty(1);

    setCurrentSpeed(START_SPEED);

    setActiveSkill(null);

    setMissiles([]);

    setBursts([]);

    setNotice("");

    setHit(false);

    setActivePuzzle(null);

    setSelected(null);

    setWrongChoices([]);

    setAnswerState("idle");

    setTerminalSnapshot(null);

    setPickupRevision((value) => value + 1);

    setScreen("play");

  }



  function backHome() {

    if (typeof onBack === "function") {

      onBack();

      return;

    }

    window.history.back();

  }



  function backToIntro() {

    thrustRef.current = false;

    velocityRef.current = 0;

    lastFrameRef.current = null;



    clearTimeout(noticeTimerRef.current);

    clearTimeout(hitTimerRef.current);

    clearTimeout(puzzleTimerRef.current);

    clearTimeout(failTimerRef.current);



    setThrust(false);

    setShowRules(false);

    setActivePuzzle(null);

    setSelected(null);

    setWrongChoices([]);

    setAnswerState("idle");

    setMissiles([]);

    setBursts([]);

    setNotice("");

    setHit(false);

    setScreen("intro");

  }



  function pointerDown(event) {

    if (paused || terminalSnapshotRef.current) return;

    event.preventDefault();

    try {

      event.currentTarget.setPointerCapture(event.pointerId);

    } catch {

      // Optional pointer capture.

    }

    thrustRef.current = true;

    setThrust(true);

    if (velocityRef.current > -11) velocityRef.current = -11;

  }



  function pointerUp(event) {

    thrustRef.current = false;

    setThrust(false);

    try {

      if (event?.currentTarget?.hasPointerCapture?.(event.pointerId)) {

        event.currentTarget.releasePointerCapture(event.pointerId);

      }

    } catch {

      // Optional pointer capture.

    }

  }



  useEffect(() => {

    function down(event) {

      if (event.code !== "Space" && event.code !== "ArrowUp") return;

      event.preventDefault();

      if (paused || terminalSnapshotRef.current) return;

      thrustRef.current = true;

      setThrust(true);

      if (velocityRef.current > -11) velocityRef.current = -11;

    }

    function up(event) {

      if (event.code !== "Space" && event.code !== "ArrowUp") return;

      thrustRef.current = false;

      setThrust(false);

    }

    window.addEventListener("keydown", down);

    window.addEventListener("keyup", up);

    return () => {

      window.removeEventListener("keydown", down);

      window.removeEventListener("keyup", up);

    };

  }, [paused]);



  useEffect(() => {

    if (paused || terminalSnapshotRef.current) {

      lastFrameRef.current = null;

      return undefined;

    }



    let raf = 0;

    function frame(time) {

      if (terminalSnapshotRef.current) return;

      if (lastFrameRef.current === null) lastFrameRef.current = time;

      const dt = Math.min((time - lastFrameRef.current) / 1000, 0.034);

      lastFrameRef.current = time;



      const currentProgress = progressRef.current;

      const nextDifficulty = 1 + Math.floor(currentProgress / 1450);

      if (nextDifficulty !== difficultyRef.current) {

        difficultyRef.current = nextDifficulty;

        setDifficulty(nextDifficulty);

      }



      const skill = activeSkillRef.current;

      const baseSpeed = Math.min(MAX_SPEED, START_SPEED + (nextDifficulty - 1) * 5.2);

      const speed = Math.min(MAX_SPEED + 16, baseSpeed + (skill?.type === "overdrive" ? 16 : 0));

      setCurrentSpeed(Math.round(speed));



      const nextProgress = Math.min(

        TARGET_DISTANCE,

        currentProgress + speed * dt

      );

      progressRef.current = nextProgress;

      setProgress(nextProgress);



      if (nextProgress >= TARGET_DISTANCE) {

        finalizeRun("win", TARGET_DISTANCE);

        setScreen("win");

        return;

      }



      if (skill && nextProgress >= skill.endsAt) {

        activeSkillRef.current = null;

        setActiveSkill(null);

      }



      let velocity = velocityRef.current;

      const gravity = 82;

      const jetPower = skill?.type === "overdrive" ? 222 : 196;

      if (thrustRef.current) velocity -= jetPower * dt;

      else velocity += gravity * dt;

      velocity = clamp(velocity, -42, 34);



      let y = playerYRef.current + velocity * dt;

      if (y < 19) {

        y = 19;

        velocity = Math.max(0, velocity);

      }

      if (y > 76) {

        y = 76;

        velocity = Math.min(0, velocity);

      }

      velocityRef.current = velocity;

      playerYRef.current = y;

      setPlayerY(y);



      if (nextProgress >= nextMissileAtRef.current) {

        const idBase = missileIdRef.current++;

        const lockY = clamp(y + Math.sin(idBase * 1.93) * 7, 24, 71);

        const spawned = [

          {

            id: `missile-${idBase}-a`,

            phase: "warning",

            age: 0,

            x: 110,

            y: lockY,

          },

        ];

        if (nextDifficulty >= 6 && idBase % 3 === 0) {

          spawned.push({

            id: `missile-${idBase}-b`,

            phase: "warning",

            age: -0.18,

            x: 110,

            y: clamp(lockY + (idBase % 2 === 0 ? 17 : -17), 23, 72),

          });

        }

        missilesRef.current = [...missilesRef.current, ...spawned];

        setMissiles(missilesRef.current);

        nextMissileAtRef.current = nextProgress + Math.max(420, 1030 - nextDifficulty * 58);

      }



      const updatedMissiles = [];

      for (const missile of missilesRef.current) {

        const age = missile.age + dt;

        if (age < 0.95) {

          updatedMissiles.push({ ...missile, age, phase: "warning", x: 110 });

          continue;

        }

        const travel = age - 0.95;

        const missileSpeed = 68 + nextDifficulty * 2.6;

        const x = 112 - travel * missileSpeed;

        if (x > -12) {

          updatedMissiles.push({ ...missile, age, phase: "active", x });

          if (

            !processedMissilesRef.current.has(missile.id) &&

            x < PLAYER_X + 4 &&

            x > PLAYER_X - 5 &&

            Math.abs(missile.y - y) < 8.2

          ) {

            processedMissilesRef.current.add(missile.id);

            damagePlayer("missile", missile.y);

          }

        }

      }

      missilesRef.current = updatedMissiles;

      setMissiles(updatedMissiles);



      const updatedBursts = burstsRef.current

        .map((burst) => ({ ...burst, age: burst.age + dt }))

        .filter((burst) => burst.age < 0.62);

      if (updatedBursts.length !== burstsRef.current.length || updatedBursts.some((b, i) => b.age !== burstsRef.current[i]?.age)) {

        burstsRef.current = updatedBursts;

        setBursts(updatedBursts);

      }



      if (!terminalSnapshotRef.current) {

        raf = requestAnimationFrame(frame);

      }

    }



    raf = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(raf);

  }, [paused, t.missileHit, t.obstacleHit, t.shieldAbsorb]);



  useEffect(() => {

    if (screen !== "play" || paused || terminalSnapshotRef.current) return;

    let amount = 0;

    for (const coin of scene.coins) {

      if (collectedCoinsRef.current.has(coin.id)) continue;

      const x = screenX(coin.at, progress);

      const xRange = magnet ? 14 : 3;

      const yRange = magnet ? 27 : 8;

      if (Math.abs(x - PLAYER_X) <= xRange && Math.abs(coin.y - playerY) <= yRange) {

        collectedCoinsRef.current.add(coin.id);

        amount += 1;

      }

    }

    if (amount > 0) {

      const nextCoins = coinsRef.current + amount;

      coinsRef.current = nextCoins;

      setCoins(nextCoins);

      setPickupRevision((value) => value + 1);

    }

  }, [progress, playerY, magnet, paused, screen, scene.coins]);



  useEffect(() => {

    if (screen !== "play" || paused || terminalSnapshotRef.current) return;

    for (const skill of scene.skills) {

      if (collectedSkillsRef.current.has(skill.id)) continue;

      const x = screenX(skill.at, progress);

      if (Math.abs(x - PLAYER_X) > 3.2 || Math.abs(skill.y - playerY) > 10) continue;



      collectedSkillsRef.current.add(skill.id);

      setPickupRevision((value) => value + 1);



      if (skill.type === "repair") {

        if (vitalityRef.current < MAX_VITALITY) {

          vitalityRef.current += 1;

          setVitality(vitalityRef.current);

          addBurst(PLAYER_X, playerY, "repair");

          showNotice(t.repair);

        } else {

          const nextCoins = coinsRef.current + 15;

          coinsRef.current = nextCoins;

          setCoins(nextCoins);

          showNotice(t.repairFull);

        }

      } else {

        const info = SKILL_INFO[skill.type];

        const active = {

          type: skill.type,

          endsAt: progressRef.current + info.distance,

          totalDistance: info.distance,

        };

        activeSkillRef.current = active;

        setActiveSkill(active);

        showNotice(skill.type === "shield" ? t.shield : skill.type === "magnet" ? t.magnet : t.boost);

      }

      break;

    }

  }, [progress, playerY, paused, screen, scene.skills, t.boost, t.magnet, t.repair, t.repairFull, t.shield]);



  useEffect(() => {

    if (screen !== "play" || paused || terminalSnapshotRef.current) return;

    for (const obstacle of scene.obstacles) {

      if (processedObstaclesRef.current.has(obstacle.id)) continue;

      const x = screenX(obstacle.at, progress);

      if (x > PLAYER_X + 3.2) continue;

      if (x < PLAYER_X - 4.5) {

        processedObstaclesRef.current.add(obstacle.id);

        continue;

      }



      const [top, bottom] = obstacleBounds(obstacle);

      const playerTop = playerY - 7;

      const playerBottom = playerY + 7;

      const collided = playerBottom > top && playerTop < bottom;

      processedObstaclesRef.current.add(obstacle.id);

      if (collided) {

        damagePlayer("obstacle", playerY);

        break;

      }

    }

  }, [progress, playerY, paused, screen, scene.obstacles]);



  useEffect(() => {

    if (

      screen !== "play" ||

      terminalSnapshotRef.current ||

      activePuzzle !== null ||

      showRules

    ) return;

    // The question starts exactly when the player crosses the visible gate.
    // screenX(...) is the gate centre; PLAYER_X is the player's world anchor.
    if (screenX(nextQuestionAtRef.current, progress) > PLAYER_X) return;



    thrustRef.current = false;

    setThrust(false);

    velocityRef.current = 0;

    setSelected(null);

    setWrongChoices([]);

    setAnswerState("idle");

    setActivePuzzle(makeQuestion(questionIndexRef.current));

  }, [progress, activePuzzle, screen, showRules]);



  function chooseAnswer(option) {

    if (

      terminalSnapshotRef.current ||

      !activePuzzle ||

      answerState === "correct" ||

      wrongChoices.includes(option)

    ) return;

    setSelected(option);



    if (option !== activePuzzle.answer) {

      setWrongChoices((values) => [...values, option]);

      setAnswerState("wrong");

      damageFromWrongAnswer();

      return;

    }



    setAnswerState("correct");

    showNotice(t.correct);

    clearTimeout(puzzleTimerRef.current);

    puzzleTimerRef.current = setTimeout(() => {

      if (terminalSnapshotRef.current) return;

      questionIndexRef.current += 1;

      questionsSolvedRef.current = questionIndexRef.current;

      setQuestionsSolved(questionIndexRef.current);

      const interval = Math.max(540, 900 - difficultyRef.current * 26);

      nextQuestionAtRef.current = progressRef.current + interval;

      setActivePuzzle(null);

      setSelected(null);

      setWrongChoices([]);

      setAnswerState("idle");

      velocityRef.current = -5;

    }, 720);

  }



  useEffect(() => {

    if (screen !== "win" && screen !== "fail") return;

    const distance = terminalSnapshot?.distance ?? Math.floor(progressRef.current);

    if (distance > bestDistance) {

      setBestDistance(distance);

      try {

        localStorage.setItem("symmetry-endless-best-v2", String(distance));

      } catch {

        // Storage is optional.

      }

    }

  }, [screen, bestDistance, terminalSnapshot]);



  useEffect(() => () => {

    clearTimeout(noticeTimerRef.current);

    clearTimeout(hitTimerRef.current);

    clearTimeout(puzzleTimerRef.current);

    clearTimeout(failTimerRef.current);

  }, []);



  const skillPercent = activeSkill

    ? clamp(((activeSkill.endsAt - progress) / activeSkill.totalDistance) * 100, 0, 100)

    : 0;

  const distanceDisplay = Math.floor(progress);

  const liveScore = calculateSymmetryScore({

    progress,

    coins,

    questionsSolved,

  });

  const score = terminalSnapshot?.finalScore ?? liveScore;

  const farScroll = -(progress * 1.1);

  const midScroll = -(progress * 2.3);

  const floorScroll = -(progress * 5.8);



  return (

    <div className="mirror-game-root">

      <main className="mirror-game-stage">

        <header className="mirror-header">

          {screen === "play" && (

            <button

              type="button"

              className="mirror-back-intro"

              onClick={backToIntro}

              aria-label="Back to Symmetry Menu"

              title="Back to Symmetry Menu"

            >

              ←

            </button>

          )}



          <div className="mirror-brand">

            <small>MATH WEEK 2026 · SYMMETRY FACILITY</small>

            <strong>{t.brand}</strong>

          </div>

          <div className="mirror-actions">

            {screen === "play" && (

              <>

                <div className="header-stat"><small>{t.distance}</small><b>{distanceDisplay} m</b></div>

                <div className="header-stat speed"><small>{t.speed}</small><b>{currentSpeed}</b></div>

              </>

            )}

            <button type="button" className="header-help" onClick={() => setShowRules(true)}>?</button>

            <button type="button" className="header-lang" onClick={() => setLang((value) => (value === "zh" ? "en" : "zh"))}>

              {lang === "zh" ? "中 / EN" : "EN / 中"}

            </button>

          </div>

        </header>



        {screen === "intro" && (

          <section className="mirror-intro">

            <div className="intro-background">

              <div className="intro-stars" />

              <div className="intro-nebula n1" />

              <div className="intro-nebula n2" />

              <div className="intro-cloud-layer" />

            </div>



            <div className="mirror-intro-copy">

              <span className="facility-label">◆ MIRROR QUICK CHALLENGE</span>

              <h1><span>SYMMETRY</span><strong>{t.introTitle}</strong></h1>

              <h2>{t.introSub}</h2>

              <p>{t.intro}</p>

              <div className="intro-data">

                <div><b>3</b><span>{t.vitality.toUpperCase()}</span></div>

                <div><b>6000</b><span>METRE TARGET</span></div>

                <div><b>▲</b><span>RISING DIFFICULTY</span></div>

              </div>

              <button type="button" className="launch-button" onClick={startGame}><span>{t.launch}</span><i>▶</i></button>

              <small className="intro-tip">{t.hold} · {t.release}</small>

            </div>



            <div className="intro-island-zone">

              <div className="intro-island-aura" />

              <img src={symmetryIsland} className="intro-symmetry-island" alt="Symmetry island" />

              <div className="intro-island-plate"><strong>FIRE ORB CHALLENGE</strong><span>6000 M · ADAPTIVE DIFFICULTY</span></div>

            </div>

          </section>

        )}



        {screen === "play" && (

          <section

            className={`mechanical-run ${paused ? "paused" : ""} ${thrust ? "thrusting" : ""} ${hit ? "hit" : ""} ${overdrive ? "overdrive" : ""}`}

            onPointerDown={pointerDown}

            onPointerUp={pointerUp}

            onPointerCancel={pointerUp}

            onContextMenu={(event) => event.preventDefault()}

          >

            <div className="tunnel-depth" style={{ backgroundPositionX: `${farScroll}px` }} />

            <div className="outside-ambient" />

            {scene.windows.map((windowData) => <TunnelWindow key={windowData.id} windowData={windowData} progress={progress} />)}

            <div className="tunnel-wall-grid" style={{ backgroundPositionX: `${midScroll}px` }} />

            <div className="tunnel-columns" style={{ backgroundPositionX: `${midScroll}px` }} />

            <div className="ceiling-rail" style={{ backgroundPositionX: `${floorScroll}px` }} />

            <div className="floor-rail" style={{ backgroundPositionX: `${floorScroll}px` }} />

            <div className="tunnel-light-strip top" style={{ backgroundPositionX: `${floorScroll}px` }} />

            <div className="tunnel-light-strip bottom" style={{ backgroundPositionX: `${floorScroll}px` }} />



            <div className="velocity-streaks">

              {Array.from({ length: 14 }).map((_, i) => <i key={i} />)}

            </div>



            <SymmetryQuestionGate at={nextQuestionAtRef.current} progress={progress} lang={lang} />

            {visibleCoins.map((coin) => <EnergyCoin key={coin.id} coin={coin} progress={progress} magnet={magnet} />)}

            {visibleSkills.map((skill) => <SkillPickup key={skill.id} skill={skill} progress={progress} />)}

            {scene.obstacles.map((obstacle) => <Obstacle key={obstacle.id} obstacle={obstacle} progress={progress} />)}

            {missiles.map((missile) => <Missile key={missile.id} missile={missile} />)}



            {bursts.map((burst) => (

              <div key={burst.id} className={`impact-burst ${burst.kind}`} style={{ left: `${burst.x}%`, top: `${burst.y}%`, "--age": burst.age }}>

                {Array.from({ length: 8 }).map((_, i) => <i key={i} style={{ "--i": i }} />)}

              </div>

            ))}



            <div className="mechanical-pilot" style={{ top: `${playerY}%` }}>

              <div className="pilot-motion-trails" aria-hidden="true"><i /><i /><i /></div>

              {shield && <div className="pilot-shield" />}

              <div className="pilot-speed-aura" />

              <RocketOrb thrust={thrust} overdrive={overdrive} hit={hit} />

            </div>



            <div className="game-hud-panel">

              <div className="vitality-panel">

                <small>{t.vitality}</small>

                <div className="vitality-hearts">

                  {Array.from({ length: MAX_VITALITY }).map((_, i) => <i key={i} className={i < vitality ? "active" : ""}>♥</i>)}

                </div>

              </div>

              <div className="hud-chip"><small>{t.coins}</small><b>◇ {coins}</b></div>

              <div className="hud-chip"><small>{t.solved}</small><b>{questionsSolved}</b></div>

              <div className="hud-chip danger"><small>{t.level}</small><b>LV {difficulty}</b></div>

              <div className="hud-chip score"><small>SCORE</small><b>{score}</b></div>

            </div>



            {activeSkill && (

              <div className={`active-module ${activeSkill.type}`}>

                <div className="module-icon">{SKILL_INFO[activeSkill.type].icon}</div>

                <div className="module-info">

                  <strong>{SKILL_INFO[activeSkill.type].label[lang === "en" ? 1 : 0]}</strong>

                  <div className="module-track"><i style={{ width: `${skillPercent}%` }} /></div>

                </div>

              </div>

            )}



            {missiles.some((missile) => missile.phase === "warning") && (

              <div className="missile-warning-card"><span>⚠</span><div><b>{t.missile}</b><small>{t.warning}</small></div></div>

            )}



            <div className="jet-control-hint"><span>↑</span><div><b>{t.tap}</b><small>{t.release}</small></div></div>

            {notice && <div className="system-notice"><span>◆</span>{notice}</div>}



            {activePuzzle && (

              <div className="security-overlay" onPointerDown={(event) => event.stopPropagation()} onPointerUp={(event) => event.stopPropagation()}>

                <div className={`security-console ${answerState === "correct" ? "solved" : ""} ${answerState === "wrong" ? "error" : ""}`}>

                  <header className="console-header">

                    <div className="console-number">{activePuzzle.number}</div>

                    <div className="console-title">

                      <small>SYMMETRY CALIBRATION · #{activePuzzle.number}</small>

                      <h2>{activePuzzle.title[lang === "en" ? 1 : 0]}</h2>

                    </div>

                    <div className="console-vitality">

                      {Array.from({ length: MAX_VITALITY }).map((_, i) => <i key={i} className={i < vitality ? "active" : ""}>♥</i>)}

                    </div>

                  </header>



                  <div className="console-body">

                    <div className="console-diagram">

                      <QuestionDiagram puzzle={activePuzzle} lang={lang} />

                      <span className="diagram-type">{activePuzzle.type[lang === "en" ? 1 : 0]}</span>

                    </div>

                    <div className="console-question">

                      <span className="override-label">LIVE MIRROR CORE</span>

                      <h3>{activePuzzle.question[lang === "en" ? 1 : 0]}</h3>

                      <div className="security-options">

                        {activePuzzle.options.map((option, index) => {

                          const wrong = wrongChoices.includes(option);

                          const correct = answerState === "correct" && option === activePuzzle.answer;

                          return (

                            <button

                              key={option}

                              type="button"

                              disabled={wrong || answerState === "correct"}

                              className={`${wrong ? "wrong" : ""} ${correct ? "correct" : ""} ${selected === option ? "selected" : ""}`}

                              onClick={() => chooseAnswer(option)}

                            >

                              <small>{String.fromCharCode(65 + index)}</small>

                              <strong>{option}</strong>

                            </button>

                          );

                        })}

                      </div>

                      <div className={`console-feedback ${answerState}`}>

                        {answerState === "idle" && <><span>◇</span><p>{tr("选择正确答案以继续挑战。", "Choose the correct answer to continue the challenge.")}</p></>}

                        {answerState === "wrong" && <><span>!</span><div><b>{t.wrong}</b><p>{activePuzzle.hint[lang === "en" ? 1 : 0]}</p></div></>}

                        {answerState === "correct" && <><span>◆</span><div><b>{t.correct}</b><p>{tr("镜像核心已重新校准。", "Mirror core recalibrated successfully.")}</p></div></>}

                      </div>

                    </div>

                  </div>

                  <footer className="console-footer"><span>RUN PAUSED · PROPULSION STANDBY</span><b>{tr("答错会直接损失生命", "WRONG ANSWERS COST VITALITY")}</b></footer>

                </div>

              </div>

            )}

          </section>

        )}



        {(screen === "win" || screen === "fail") && (

          <section className="mission-fail">

            <div className="fail-backdrop" />

            <div className="fail-panel">

              <span className="failure-kicker">

                {screen === "win" ? "◆ QUICK CHALLENGE COMPLETE" : "◆ QUICK CHALLENGE ENDED"}

              </span>

              <h1>{screen === "win" ? t.victoryTitle : t.failTitle}</h1>

              <p>{screen === "win" ? t.victoryText : t.failText}</p>

              <div className="fail-stats">

                <div><small>{t.distance}</small><strong>{terminalSnapshot?.distance ?? distanceDisplay} m</strong></div>

                <div><small>BEST</small><strong>{Math.max(bestDistance, terminalSnapshot?.distance ?? distanceDisplay)} m</strong></div>

                <div><small>{t.solved}</small><strong>{terminalSnapshot?.questionsSolved ?? questionsSolved}</strong></div>

                <div className="official-score"><small>FINAL SCORE</small><strong>{score}</strong></div>

              </div>

              <div className="mission-buttons">

                <button type="button" className="primary" onClick={backHome}>{t.restart}</button>

                <button type="button" className="secondary" onClick={backHome}>{t.back}</button>

              </div>

            </div>

          </section>

        )}



        {showRules && (

          <div className="rules-overlay">

            <div className="mechanical-rules">

              <button type="button" className="rules-close" onClick={() => setShowRules(false)}>×</button>

              <span>OPERATION MANUAL</span>

              <h2>{t.guide}</h2>

              {[t.guide1, t.guide2, t.guide3, t.guide4].map((item, index) => (

                <div className="manual-row" key={item}>

                  <b>{["↑", "⚠", "+", "6K"][index]}</b>

                  <div><strong>{["FIRE ORB", "MISSILES", "VITALITY", "6000 M TARGET"][index]}</strong><p>{item}</p></div>

                </div>

              ))}

              <button type="button" className="manual-confirm" onClick={() => setShowRules(false)}>{t.close}</button>

            </div>

          </div>

        )}

      </main>

    </div>

  );

}
