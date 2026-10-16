import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./Planarity.css";
import hubBackground from "../../assets/home-layers/background.png";
import planarityIsland from "../../assets/home-layers/planarity.png";
import {
  calculatePlanarityScore,

  createCompetitionAttempt,

  getPlanarityKnockoutResult,

} from "../../scoring/competitionScoring.js";
const GAME_WIDTH = 1760;
const GAME_HEIGHT = 990;
const MAX_HP = 100;
const UI_TEXT = {
  en: {
    subBrand: "DUEL // ARENA",
    mode: "MODE",
    solo: "SOLO",
    twoPlayer: "2 PLAYER",
    p1Level: "P1 LEVEL",
    p2Level: "P2 LEVEL",
    menu: "MENU",
    player1: "PLAYER 1",
    player2: "PLAYER 2",
    cpu: "CPU",
    elimination: "ELIMINATION",
    targetDown: "TARGET DOWN",
    cpuNetwork: "CPU NETWORK",
    networkSuffix: "NETWORK",
    untangle: "UNTANGLE TO ARM YOURSELF",
    nextUnlock: "NEXT UNLOCK",
    loadout: "TACTICAL LOADOUT",
    loadoutHint: "Solve one board to unlock one ability",
    tacticalSkill: "TACTICAL SKILL",
    clear: "CLEAR",
    stable: "STABLE",
    crossings: "CROSSINGS",
    cpuSolving: "CPU SOLVING",
    networkClear: "NETWORK CLEAR",
    startEyebrow: "MATH WEEK · PLANARITY REALM",
    startTitle: "PLANARITY",
    startTitleAccent: "SHOOTOUT",
    startDesc:
      "Solve networks to earn shooting, grenades, molotovs, and healing. Defeat your opponent by reducing their HP to zero. No puzzle-count victory and no timer.",
    soloButton: "SOLO",
    soloSub: "PLAYER VS CPU",
    versusButton: "START 2 PLAYER",
    versusSub: "",
    startFooter:
      "NO TIMER · 4 ABILITIES · SOLVE TO ATTACK · KNOCKOUT TO WIN",
    matchComplete: "MATCH COMPLETE",
    targetEliminated: "A player has been knocked out.",
    draw: "DRAW",
    p1Wins: "PLAYER 1 WINS",
    p2Wins: "PLAYER 2 WINS",
    cpuWins: "CPU WINS",
    rematch: "REMATCH",
  },
  zh: {
    subBrand: "双人对决 // 竞技场",
    mode: "模式",
    solo: "单人",
    twoPlayer: "双人",
    p1Level: "玩家 1 等级",
    p2Level: "玩家 2 等级",
    menu: "菜单",
    player1: "玩家 1",
    player2: "玩家 2",
    cpu: "电脑",
    elimination: "淘汰",
    targetDown: "目标击破",
    cpuNetwork: "电脑网络",
    networkSuffix: "网络",
    untangle: "解开交叉网络以获得装备",
    nextUnlock: "下一项解锁",
    loadout: "战术装备",
    loadoutHint: "每解开一题获得一次技能使用",
    tacticalSkill: "战术技能",
    clear: "完成",
    stable: "稳定",
    crossings: "交叉点",
    cpuSolving: "电脑解题中",
    networkClear: "网络已解开",
    startEyebrow: "MATH WEEK · PLANARITY 领域",
    startTitle: "PLANARITY",
    startTitleAccent: "平面图对决",
    startDesc:
      "解开网络获得射击、手榴弹、燃烧瓶与补血技能，将对手生命值降至零即可获胜。解题不会直接结束比赛，也没有时间限制。",
    soloButton: "单人模式",
    soloSub: "玩家 VS 电脑",
    versusButton: "开始双人对战",
    versusSub: "",
    startFooter:
      "不限时间 · 4 种技能 · 解题获取攻击 · 击倒对手获胜",
    matchComplete: "对战结束",
    targetEliminated: "一方生命值归零，比赛结束。",
    draw: "平局",
    p1Wins: "玩家 1 获胜",
    p2Wins: "玩家 2 获胜",
    cpuWins: "电脑获胜",
    rematch: "再战一次",
  },
};
// A complete match ends ONLY when a fighter is knocked out. Each solved
// board grants the next ability in this simple four-skill rotation.
const SKILL_EN_DESC = {
  burst: "3 shots, 9 damage each (27 total)",
  grenade: "Explosion deals 34 damage",
  molotov: "Burning deals 8 impact + 28 over time",
  heal: "Restore 24 HP (up to 100)",
};
const SKILLS = [
  {
    id: "burst",
    icon: "AR",
    name: "SHOOT",
    short: "射击",
    description: "3 连发，每发 9 点伤害（共 27 点）",
  },
  {
    id: "grenade",
    icon: "HE",
    name: "GRENADE",
    short: "手榴弹",
    description: "爆炸造成 34 点伤害",
  },
  {
    id: "molotov",
    icon: "FIRE",
    name: "MOLOTOV",
    short: "燃烧瓶",
    description: "命中造成 8 点伤害，后续燃烧造成 28 点伤害",
  },
  {
    id: "heal",
    icon: "+",
    name: "MED KIT",
    short: "补血",
    description: "恢复 24 HP（上限 100）",
  },
];
const REWARD_ORDER = ["burst", "grenade", "molotov", "heal"];
const EMPTY_SKILLS = Object.fromEntries(SKILLS.map((skill) => [skill.id, 0]));
const INITIAL_FIGHTER = {
  hp: MAX_HP,
  shieldHP: 0,
  firing: false,
  recentWeapon: "",
  hitFlash: false,
  burning: false,
  downed: false,
};
const WEAPON_CONFIG = {
  burst: {
    shots: 3,
    gap: 68,
    damage: 9,
    projectileType: "burst",
  },
  grenade: {
    shots: 1,
    gap: 0,
    damage: 34,
    projectileType: "grenade",
  },
};
function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function properIntersection(a, b, c, d) {
  const cross = (p1, p2, p3) =>
    (p2.x - p1.x) * (p3.y - p1.y) -
    (p2.y - p1.y) * (p3.x - p1.x);
  const d1 = cross(a, b, c);
  const d2 = cross(a, b, d);
  const d3 = cross(c, d, a);
  const d4 = cross(c, d, b);
  const epsilon = 0.00001;
  return (
    ((d1 > epsilon && d2 < -epsilon) ||
      (d1 < -epsilon && d2 > epsilon)) &&
    ((d3 > epsilon && d4 < -epsilon) ||
      (d3 < -epsilon && d4 > epsilon))
  );
}
function analyzeCrossings(nodes, edges) {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const crossedEdges = new Set();
  let count = 0;
  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      const e1 = edges[i];
      const e2 = edges[j];
      if (
        e1.a === e2.a ||
        e1.a === e2.b ||
        e1.b === e2.a ||
        e1.b === e2.b
      ) {
        continue;
      }
      const a = nodeMap.get(e1.a);
      const b = nodeMap.get(e1.b);
      const c = nodeMap.get(e2.a);
      const d = nodeMap.get(e2.b);
      if (!a || !b || !c || !d) continue;
      if (properIntersection(a, b, c, d)) {
        count += 1;
        crossedEdges.add(e1.id);
        crossedEdges.add(e2.id);
      }
    }
  }
  return { count, crossedEdges };
}
function createPuzzle(round, nonce = 0) {
  // 难度增长故意放慢，让技能轮转更快。
  const outerCount = Math.min(5 + Math.floor((round - 1) / 4), 8);
  const targetNodes = [];
  for (let i = 0; i < outerCount; i++) {
    const angle = -Math.PI / 2 + (Math.PI * 2 * i) / outerCount;
    targetNodes.push({
      id: i,
      x: 50 + Math.cos(angle) * 38,
      y: 32 + Math.sin(angle) * 23,
    });
  }
  const centerId = outerCount;
  targetNodes.push({
    id: centerId,
    x: 50,
    y: 32,
  });
  const edges = [];
  for (let i = 0; i < outerCount; i++) {
    edges.push({
      id: `ring-${i}`,
      a: i,
      b: (i + 1) % outerCount,
    });
    edges.push({
      id: `spoke-${i}`,
      a: centerId,
      b: i,
    });
  }
  const random = seededRandom(91827 + round * 7919 + nonce * 131);
  let scrambledNodes = targetNodes.map((node) => ({ ...node }));
  for (let attempt = 0; attempt < 60; attempt++) {
    const positions = targetNodes.map(({ x, y }) => ({ x, y }));
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    scrambledNodes = targetNodes.map((node, index) => ({
      id: node.id,
      x: positions[index].x,
      y: positions[index].y,
    }));
    const crossings = analyzeCrossings(scrambledNodes, edges).count;
    const targetCrossings = Math.min(3 + Math.floor(round / 4), 7);
    if (crossings >= targetCrossings) break;
  }
  return {
    id: `${nonce}-${round}`,
    round,
    nodes: scrambledNodes,
    targetNodes,
    edges,
  };
}
function getSkill(id) {
  return SKILLS.find((skill) => skill.id === id);
}
function Shooter({ side, fighter, name }) {
  const armorId = `armor-${side}`;
  const armorEdgeId = `armor-edge-${side}`;
  const visorId = `visor-${side}`;
  const weaponId = `weapon-${side}`;
  return (
    <div
      className={`shooter-card side-${side} ${fighter.hitFlash ? "hit" : ""} ${
        fighter.burning ? "burning" : ""
      }`}
    >
      <div className="player-hud">
        <div className="hud-topline">
          <div className="hud-name">
            <span className={`team-dot side-${side}`} />
            <strong>{name}</strong>
          </div>
          <div className="hud-tags">
            {fighter.burning && (
              <span className="hud-state burn-state">BURNING</span>
            )}
          </div>
        </div>
        <div className="health-row">
          <div className="health-stack">
            <div className="health-track">
              <div
                className={`health-fill side-${side}`}
                style={{ width: `${Math.max(0, fighter.hp)}%` }}
              />
              <div className="health-shine" />
            </div>

          </div>
          <strong className="hp-number">{Math.max(0, Math.ceil(fighter.hp))}</strong>
        </div>
      </div>
      <div
        className={`gunner side-${side} ${fighter.firing ? "firing" : ""} ${
          fighter.recentWeapon ? `weapon-${fighter.recentWeapon}` : ""
        } ${fighter.downed ? "downed" : ""}`}
      >
        <div className="fighter-backglow" />
        <div className="gunner-shadow" />

        {fighter.burning && (
          <div className="burn-aura">
            <i />
            <i />
            <i />
            <i />
          </div>
        )}
        <svg className="operative-svg" viewBox="0 0 320 250" aria-hidden="true">
          <defs>
            <linearGradient id={armorId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={side === "p1" ? "#edf4ff" : "#fff0f2"} />
              <stop offset="48%" stopColor={side === "p1" ? "#8495af" : "#a9868e"} />
              <stop offset="100%" stopColor="#29313e" />
            </linearGradient>
            <linearGradient id={armorEdgeId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={side === "p1" ? "#3e82ff" : "#ff4565"} />
              <stop offset="100%" stopColor={side === "p1" ? "#71c9ff" : "#ff987c"} />
            </linearGradient>
            <linearGradient id={visorId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#07101c" />
              <stop offset="55%" stopColor={side === "p1" ? "#3f8fff" : "#ff536f"} />
              <stop offset="100%" stopColor="#d8f5ff" />
            </linearGradient>
            <linearGradient id={weaponId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1c2532" />
              <stop offset="52%" stopColor="#718099" />
              <stop offset="100%" stopColor="#d5dfec" />
            </linearGradient>
          </defs>
          <g className="operative-body">
            <path
              className="cape-panel"
              d="M105 94 C78 112 74 168 88 212 L120 196 L130 109 Z"
            />
            <path
              className="rear-leg"
              d="M135 164 L119 213 L96 232 L122 235 L155 193 L164 169 Z"
              fill={`url(#${armorId})`}
            />
            <path
              className="front-leg"
              d="M163 165 L183 207 L213 230 L187 236 L149 197 L145 170 Z"
              fill={`url(#${armorId})`}
            />
            <path
              className="boot rear-boot"
              d="M94 228 L123 229 L126 240 L91 241 Z"
            />
            <path
              className="boot front-boot"
              d="M184 228 L215 229 L221 240 L185 241 Z"
            />
            <path
              className="torso-armor"
              d="M119 88 L157 77 L189 92 L181 162 L151 177 L119 160 L108 113 Z"
              fill={`url(#${armorId})`}
            />
            <path
              className="chest-core"
              d="M137 102 L161 96 L178 106 L171 136 L149 145 L130 134 Z"
              fill={`url(#${armorEdgeId})`}
            />
            <path
              className="shoulder rear-shoulder"
              d="M108 95 L88 105 L92 127 L115 121 Z"
            />
            <path
              className="shoulder front-shoulder"
              d="M183 94 L205 102 L203 124 L181 120 Z"
            />
            <path
              className="rear-arm"
              d="M96 111 L76 141 L92 151 L120 125 Z"
              fill={`url(#${armorId})`}
            />
            <path
              className="front-arm"
              d="M187 108 L220 121 L211 137 L174 125 Z"
              fill={`url(#${armorId})`}
            />
            <path
              className="helmet"
              d="M122 54 Q148 25 181 48 L193 69 L183 92 L151 101 L122 86 L113 67 Z"
              fill={`url(#${armorId})`}
            />
            <path
              className="helmet-crest"
              d="M139 43 L151 25 L168 44 L160 49 Z"
              fill={`url(#${armorEdgeId})`}
            />
            <path
              className="visor"
              d="M126 60 L181 55 L184 71 L135 79 L121 72 Z"
              fill={`url(#${visorId})`}
            />
            <path
              className="mask"
              d="M134 80 L179 74 L173 91 L151 99 L132 90 Z"
            />
            <path
              className="belt"
              d="M118 151 L181 151 L178 164 L121 164 Z"
            />
            <rect className="pouch pouch-a" x="121" y="154" width="14" height="15" rx="3" />
            <rect className="pouch pouch-b" x="163" y="154" width="14" height="15" rx="3" />
          </g>
          <g className="weapon-rig">
            <path
              className="weapon-shell"
              d="M167 111 L213 104 L250 110 L256 124 L210 130 L174 126 Z"
              fill={`url(#${weaponId})`}
            />
            <path className="weapon-stock" d="M171 113 L147 118 L146 128 L178 125 Z" />
            <path className="weapon-barrel" d="M250 114 L292 116 L292 122 L251 124 Z" />
            <path className="weapon-rail" d="M195 102 L239 103 L247 110 L202 110 Z" />
            <path className="weapon-mag" d="M211 127 L229 129 L222 153 L205 150 Z" />
            <path className="weapon-grip" d="M190 126 L202 128 L194 149 L183 145 Z" />
            <circle className="weapon-light" cx="243" cy="117" r="4" />
          </g>
        </svg>
        <div className="muzzle-flash">
          <span className="flash-core" />
          <span className="flash-ray ray-a" />
          <span className="flash-ray ray-b" />
          <span className="flash-ray ray-c" />
        </div>
      </div>
    </div>
  );
}
function ProjectileLayer({ projectiles }) {
  return (
    <div className="projectile-layer">
      {projectiles.map((projectile) => (
        <div
          key={projectile.id}
          className={`projectile-wrap side-${projectile.side} projectile-wrap-${projectile.type}`}
          style={{ top: `${projectile.offsetY}%` }}
        >
          {projectile.type === "grenade" || projectile.type === "molotov" ? (
            <div className={`thrown-object ${projectile.type}`}>
              <span />
            </div>
          ) : (
            <div className={`projectile ${projectile.type}`} />
          )}
        </div>
      ))}
    </div>
  );
}
function ImpactLayer({ impacts }) {
  return (
    <div className="impact-layer">
      {impacts.map((impact) => (
        <div
          key={impact.id}
          className={`impact-effect side-${impact.target} impact-${impact.type}`}
        >
          <div className="impact-core" />
          <div className="impact-ring" />
          <span className="spark s1" />
          <span className="spark s2" />
          <span className="spark s3" />
          <span className="spark s4" />
          <span className="spark s5" />
          <span className="spark s6" />
        </div>
      ))}
    </div>
  );
}
function SkillBar({ side, charges, onUse, disabled, isAI, lang }) {
  const t = UI_TEXT[lang];
  const keys =
    side === "p1"
      ? ["1", "2", "3", "4"]
      : ["7", "8", "9", "0"];
  return (
    <div className="skill-grid">
      {SKILLS.map((skill, index) => {
        const charge = charges[skill.id];
        return (
          <button
            key={skill.id}
            type="button"
            disabled={disabled || isAI || charge <= 0}
            className={`skill-card skill-${skill.id} ${charge > 0 ? "available" : ""}`}
            onPointerDown={(event) => {
              event.stopPropagation();
              if (disabled || isAI || charge <= 0) {
                return;
              }
              onUse(side, skill.id);
            }}
            title={lang === "zh" ? skill.description : SKILL_EN_DESC[skill.id]}
          >
            <span className="skill-hotkey">{keys[index]}</span>
            <div className="skill-emblem">{skill.icon}</div>
            <div className="skill-info">
              <strong>{lang === "zh" ? skill.short : skill.name}</strong>
              <small>{lang === "zh" ? skill.name : t.tacticalSkill}</small>
            </div>
            <div className={`skill-ammo ${charge > 0 ? "loaded" : ""}`}>×{charge}</div>
          </button>
        );
      })}
    </div>
  );
}
function PlanarityBoard({ puzzle, side, onSolved, isAI = false, lang }) {
  const t = UI_TEXT[lang];
  const [nodes, setNodes] = useState(() => puzzle.nodes.map((node) => ({ ...node })));
  const [dragging, setDragging] = useState(null);
  const svgRef = useRef(null);
  const solvedSent = useRef(false);
  useEffect(() => {
    setNodes(puzzle.nodes.map((node) => ({ ...node })));
    setDragging(null);
    solvedSent.current = false;
  }, [puzzle.id]);
  const crossingData = useMemo(
    () => analyzeCrossings(nodes, puzzle.edges),
    [nodes, puzzle.edges]
  );
  // 只有在放开节点后，并且 CLEAR 稳定 420ms 才换题。
  useEffect(() => {
    if (crossingData.count !== 0 || dragging !== null || solvedSent.current) return;
    const timer = setTimeout(() => {
      if (solvedSent.current) return;
      solvedSent.current = true;
      onSolved(side);
    }, 420);
    return () => clearTimeout(timer);
  }, [crossingData.count, dragging, onSolved, side]);
  useEffect(() => {
    if (!isAI) return;
    let solvedNodes = 0;
    const targetMap = new Map(puzzle.targetNodes.map((node) => [node.id, node]));
    const stepDelay = Math.max(250, 430 - puzzle.round * 6);
    const timer = setInterval(() => {
      solvedNodes += 1;
      setNodes((current) =>
        current.map((node, index) => {
          if (index >= solvedNodes) return node;
          const target = targetMap.get(node.id);
          if (!target) return node;
          return {
            ...node,
            x: target.x,
            y: target.y,
          };
        })
      );
      if (solvedNodes >= puzzle.nodes.length) clearInterval(timer);
    }, stepDelay);
    return () => clearInterval(timer);
  }, [isAI, puzzle]);
  const moveNode = (event, nodeId) => {
    if (isAI) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 64;
    const clampedX = Math.max(4, Math.min(96, x));
    const clampedY = Math.max(4, Math.min(60, y));
    setNodes((current) =>
      current.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              x: clampedX,
              y: clampedY,
            }
          : node
      )
    );
  };
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  return (
    <div
      className={`planarity-board ${crossingData.count === 0 ? "solved" : ""} ${
        isAI ? "ai-board" : ""
      }`}
    >
      <div className="board-atmosphere" />
      <div className="board-grid" />
      <div className="board-scan" />
      <div className="board-corners corner-a" />
      <div className="board-corners corner-b" />
      <div className="board-corners corner-c" />
      <div className="board-corners corner-d" />
      <svg
        ref={svgRef}
        className="graph-svg"
        viewBox="0 0 100 64"
        preserveAspectRatio="none"
      >
        {puzzle.edges.map((edge) => {
          const a = nodeMap.get(edge.a);
          const b = nodeMap.get(edge.b);
          if (!a || !b) return null;
          const crossed = crossingData.crossedEdges.has(edge.id);
          return (
            <line
              key={edge.id}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              className={`graph-edge ${crossed ? "crossed" : "clear"}`}
            />
          );
        })}
        {nodes.map((node) => (
          <g
            key={node.id}
            className={`graph-node ${dragging === node.id ? "dragging" : ""}`}
            transform={`translate(${node.x} ${node.y})`}
            onPointerDown={(event) => {
              if (isAI) return;
              setDragging(node.id);
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              if (dragging === node.id) moveNode(event, node.id);
            }}
            onPointerUp={(event) => {
              if (isAI) return;
              setDragging(null);
              try {
                event.currentTarget.releasePointerCapture(event.pointerId);
              } catch {
                // ignore
              }
            }}
            onPointerCancel={() => setDragging(null)}
          >
            <circle className="node-outer" r="7.4" />
            <circle className="node-glow" r="5.6" />
            <circle className="node-circle" r="4.1" />
            <circle className="node-core" r="1.15" />
          </g>
        ))}
      </svg>
      <div className="crossing-counter">
        <span className={`counter-light ${crossingData.count === 0 ? "done" : ""}`} />
        {crossingData.count === 0 ? (
          <>
            <strong>{t.clear}</strong>
            <span>{t.stable}</span>
          </>
        ) : (
          <>
            <strong>{crossingData.count}</strong>
            <span>{t.crossings}</span>
          </>
        )}
      </div>
      {isAI && (
        <div className="ai-chip">
          <span />
          CPU SOLVING
        </div>
      )}
      {crossingData.count === 0 && <div className="clear-flash">{t.networkClear}</div>}
    </div>
  );
}
function PuzzlePanel({
  side,
  name,
  puzzle,
  reward,
  onSolved,
  isAI,
  charges,
  onUseSkill,
  gameEnded,
  lang,
}) {
  const t = UI_TEXT[lang];
  return (
    <section className={`puzzle-panel side-${side}`}>
      <div className="panel-header">
        <div>
          <span className="board-label">{isAI ? t.cpuNetwork : `${name} ${t.networkSuffix}`}</span>
          <h2>{t.untangle}</h2>
        </div>
        <div className="reward-display">
          <span>{t.nextUnlock}</span>
          <strong>
            <i>{reward.icon}</i>
            {lang === "zh" ? reward.short : reward.name}
          </strong>
        </div>
      </div>
      <PlanarityBoard
        key={puzzle.id}
        puzzle={puzzle}
        side={side}
        onSolved={onSolved}
        isAI={isAI}
        lang={lang}
      />
      <div className="loadout-label">
        <span>{t.loadout}</span>
        <small>{t.loadoutHint}</small>
      </div>
      <SkillBar
        side={side}
        charges={charges}
        onUse={onUseSkill}
        disabled={gameEnded}
        isAI={isAI}
        lang={lang}
      />
    </section>
  );
}
function StartScreen({ onStart, lang }) {
  const t = UI_TEXT[lang];
  return (
    <div className="overlay start-overlay">
      <img className="planarity-start-bg" src={hubBackground} alt="" />
      <div className="start-card celestial-start-card">
        <div className="start-copy">
          <div className="start-emblem">
            <span />
            <span />
            <span />
            <span />
            <b />
          </div>
          <span className="start-eyebrow">{t.startEyebrow}</span>
          <h1>
            {t.startTitle}
            <br />
            <span>{t.startTitleAccent}</span>
          </h1>
          <p>{t.startDesc}</p>
          <div className="start-actions single-action">
            <button className="primary-btn versus-only" onClick={onStart}>
              <span>{t.versusButton}</span>
              <b>→</b>
            </button>
          </div>
          <div className="start-footer">{t.startFooter}</div>
        </div>
        <div className="start-island-wrap" aria-hidden="true">
          <span className="start-island-ring ring-a" />
          <span className="start-island-ring ring-b" />
          <span className="start-island-glow" />
          <img className="start-island" src={planarityIsland} alt="" />
        </div>
      </div>
    </div>
  );
}
function EndScreen({ winner, scores, onRestart, onMenu, lang }) {
  const t = UI_TEXT[lang];
  let title = t.draw;
  if (winner === "p1") title = t.p1Wins;
  if (winner === "p2") title = t.p2Wins;
  return (
    <div className="overlay">
      <div className="end-card">
        <span className="end-eyebrow">{t.matchComplete}</span>
        <h1>{title}</h1>
        <p>{t.targetEliminated}</p>
        <div className="planarity-end-scores">
          <div>
            <span>{lang === "zh" ? `${t.player1} 最终分数` : `${t.player1} FINAL SCORE`}</span>
            <strong>{scores.p1}</strong>
          </div>
          <div>
            <span>{lang === "zh" ? `${t.player2} 最终分数` : `${t.player2} FINAL SCORE`}</span>
            <strong>{scores.p2}</strong>
          </div>
        </div>
        <div className="end-actions">
          <button className="primary-end" onClick={onRestart}>
            {t.rematch}
          </button>
          <button className="secondary-end" onClick={onMenu}>
            {t.menu}
          </button>
        </div>
      </div>
    </div>
  );
}
export default function Planarity({ onHome }) {
  const [status, setStatus] = useState("menu");
  const [lang, setLang] = useState("en");
  const [gameScale, setGameScale] = useState(1);
  const [fighters, setFighters] = useState({
    p1: { ...INITIAL_FIGHTER },
    p2: { ...INITIAL_FIGHTER },
  });
  const [skills, setSkills] = useState({
    p1: { ...EMPTY_SKILLS },
    p2: { ...EMPTY_SKILLS },
  });
  const [projectiles, setProjectiles] = useState([]);
  const [impacts, setImpacts] = useState([]);
  const [screenShake, setScreenShake] = useState(false);
  const [p1Round, setP1Round] = useState(1);
  const [p2Round, setP2Round] = useState(1);
  const [gameNonce, setGameNonce] = useState(0);
  const [winner, setWinner] = useState(null);
  const [solvedCounts, setSolvedCounts] = useState({ p1: 0, p2: 0 });
  const [competitionResults, setCompetitionResults] = useState({
    p1: null,
    p2: null,
  });
  const [initialCompetitionAttempt] = useState(() =>
    createCompetitionAttempt("planarity")
  );
  const statusRef = useRef(status);
const timeoutsRef = useRef([]);
const bgmRef = useRef(null);
  const endingStartedRef = useRef(false);
  const solvedCountsRef = useRef({ p1: 0, p2: 0 });
  const competitionAttemptRef = useRef(initialCompetitionAttempt);
  useEffect(() => {
    const resizeGame = () => {
      const scale = Math.min(
        window.innerWidth / GAME_WIDTH,
        window.innerHeight / GAME_HEIGHT
      );
      setGameScale(scale);
    };
    resizeGame();
    window.addEventListener("resize", resizeGame);
    return () => window.removeEventListener("resize", resizeGame);
  }, []);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  useEffect(() => {
    const audio = bgmRef.current;
    if (!audio) return;
    audio.volume = 0.42;
    audio.loop = true;
    audio.muted = false;
    if (status === "ended") {
      audio.pause();
      return;
    }
    // Try to keep the same BGM running on both the intro and battle screens.
    audio.play().catch(() => {
      // Browsers may block autoplay until the first user gesture.
      // onPointerDownCapture below unlocks it immediately.
    });
  }, [status]);
useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, []);
  const registerTimeout = useCallback((callback, delay) => {
    const id = setTimeout(() => {
      timeoutsRef.current = timeoutsRef.current.filter((item) => item !== id);
      callback();
    }, delay);
    timeoutsRef.current.push(id);
    return id;
  }, []);
  const clearAllScheduled = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);
  // 同等级时双方题目相同，但一方完成后只换自己的题。
  const p1Puzzle = useMemo(
    () => createPuzzle(p1Round, gameNonce),
    [p1Round, gameNonce]
  );
  const p2Puzzle = useMemo(
    () => createPuzzle(p2Round, gameNonce),
    [p2Round, gameNonce]
  );
  const p1RewardId = REWARD_ORDER[(p1Round - 1) % REWARD_ORDER.length];
  const p2RewardId = REWARD_ORDER[(p2Round - 1) % REWARD_ORDER.length];
  const p1Reward = getSkill(p1RewardId);
  const p2Reward = getSkill(p2RewardId);
  const t = UI_TEXT[lang];
  const playerOneName = t.player1;
  const playerTwoName = t.player2;
  const p1LiveScore = calculatePlanarityScore({
    solvedPuzzles: solvedCounts.p1,
    outcome: "playing",
    hp: fighters.p1.hp,
    shield: fighters.p1.shieldHP,
  });
  const p2LiveScore = calculatePlanarityScore({
    solvedPuzzles: solvedCounts.p2,
    outcome: "playing",
    hp: fighters.p2.hp,
    shield: fighters.p2.shieldHP,
  });
  const displayedScores = {
    p1: competitionResults.p1?.finalScore ?? p1LiveScore,
    p2: competitionResults.p2?.finalScore ?? p2LiveScore,
  };
  const startGame = useCallback(() => {
    clearAllScheduled();
    endingStartedRef.current = false;
    solvedCountsRef.current = { p1: 0, p2: 0 };
    competitionAttemptRef.current = createCompetitionAttempt("planarity");
    setSolvedCounts({ p1: 0, p2: 0 });
    setCompetitionResults({ p1: null, p2: null });
    setStatus("playing");
    if (bgmRef.current) {
      bgmRef.current.volume = 0.42;
      bgmRef.current.muted = false;
      bgmRef.current.play().catch(() => {});
    }
    setWinner(null);
    setP1Round(1);
    setP2Round(1);
    setGameNonce((value) => value + 1);
    setProjectiles([]);
    setImpacts([]);
    setScreenShake(false);
    setFighters({
      p1: { ...INITIAL_FIGHTER },
      p2: { ...INITIAL_FIGHTER },
    });
    setSkills({
      p1: { ...EMPTY_SKILLS },
      p2: { ...EMPTY_SKILLS },
    });
  }, [clearAllScheduled]);
  const triggerShake = useCallback(
    (heavy = false) => {
      setScreenShake(true);
      registerTimeout(() => setScreenShake(false), heavy ? 300 : 150);
    },
    [registerTimeout]
  );
  const spawnProjectile = useCallback(
    (side, type) => {
      const id = `${Date.now()}-${Math.random()}`;
      const offsetYMap = {
        burst: 47,
        grenade: 46,
        molotov: 46,
      };
      setProjectiles((current) => [
        ...current,
        {
          id,
          side,
          type,
          offsetY: offsetYMap[type] ?? 48,
        },
      ]);
      const life =
        type === "grenade" || type === "molotov" ? 760 : 460;
      registerTimeout(() => {
        setProjectiles((current) => current.filter((item) => item.id !== id));
      }, life);
    },
    [registerTimeout]
  );
  const spawnImpact = useCallback(
    (target, type) => {
      const id = `${Date.now()}-impact-${Math.random()}`;
      setImpacts((current) => [
        ...current,
        {
          id,
          target,
          type,
        },
      ]);
      registerTimeout(() => {
        setImpacts((current) => current.filter((item) => item.id !== id));
      }, type === "death" ? 1300 : 650);
    },
    [registerTimeout]
  );
  const setFiringState = useCallback(
    (side, weaponId) => {
      setFighters((current) => ({
        ...current,
        [side]: {
          ...current[side],
          firing: true,
          recentWeapon: weaponId,
        },
      }));
      registerTimeout(() => {
        setFighters((current) => ({
          ...current,
          [side]: {
            ...current[side],
            firing: false,
          },
        }));
      }, 115);
    },
    [registerTimeout]
  );
  const dealDamage = useCallback(
    (target, amount, weaponType) => {
      setFighters((current) => {
        const fighter = current[target];
        if (fighter.downed) return current;
        let shieldHP = fighter.shieldHP;
        let hpDamage = amount;
        let impactType = weaponType;
        if (shieldHP > 0) {
          const absorbed = Math.min(shieldHP, amount);
          shieldHP -= absorbed;
          hpDamage = amount - absorbed;
          impactType = shieldHP <= 0 ? "shield-break" : "shield";
        }
        const nextHp = Math.max(0, fighter.hp - hpDamage);
        registerTimeout(() => spawnImpact(target, impactType), 0);
        if (hpDamage > 0) {
          registerTimeout(() => {
            setFighters((flashCurrent) => ({
              ...flashCurrent,
              [target]: {
                ...flashCurrent[target],
                hitFlash: false,
              },
            }));
          }, 130);
        }
        return {
          ...current,
          [target]: {
            ...fighter,
            hp: nextHp,
            shieldHP,
            hitFlash: hpDamage > 0,
          },
        };
      });
      if (weaponType === "grenade") {
        triggerShake(false);
      }
    },
    [registerTimeout, spawnImpact, triggerShake]
  );
  const applyBurn = useCallback(
    (target) => {
      setFighters((current) => ({
        ...current,
        [target]: {
          ...current[target],
          burning: true,
        },
      }));
      for (let i = 0; i < 4; i++) {
        registerTimeout(() => {
          if (statusRef.current !== "playing") return;
          dealDamage(target, 7, "fire");
        }, 420 + i * 430);
      }
      registerTimeout(() => {
        setFighters((current) => ({
          ...current,
          [target]: {
            ...current[target],
            burning: false,
          },
        }));
      }, 2200);
    },
    [dealDamage, registerTimeout]
  );
  const activateSkill = useCallback(
    (side, skillId) => {
      if (statusRef.current !== "playing") return;
      if ((skills[side]?.[skillId] || 0) <= 0) return;
      if (fighters[side].downed) return;
      const opponent = side === "p1" ? "p2" : "p1";
      setSkills((current) => ({
        ...current,
        [side]: {
          ...current[side],
          [skillId]: Math.max(0, current[side][skillId] - 1),
        },
      }));
      if (skillId === "heal") {
        setFighters((current) => ({
          ...current,
          [side]: {
            ...current[side],
            hp: Math.min(MAX_HP, current[side].hp + 24),
            recentWeapon: "heal",
          },
        }));
        spawnImpact(side, "heal");
        return;
      }
      if (skillId === "molotov") {
        setFiringState(side, "molotov");
        spawnProjectile(side, "molotov");
        registerTimeout(() => {
          if (statusRef.current !== "playing") return;
          dealDamage(opponent, 8, "fire");
          applyBurn(opponent);
        }, 560);
        return;
      }
      const config = WEAPON_CONFIG[skillId];
      if (!config) return;
      setFiringState(side, skillId);
      for (let i = 0; i < config.shots; i++) {
        registerTimeout(() => {
          if (statusRef.current !== "playing") return;
          spawnProjectile(side, config.projectileType);
          const travelDelay = config.projectileType === "grenade" ? 520 : 190;
          registerTimeout(() => {
            if (statusRef.current !== "playing") return;
            dealDamage(
              opponent,
              config.damage,
              config.projectileType
            );
          }, travelDelay);
        }, i * config.gap);
      }
    },
    [
      applyBurn,
      dealDamage,
      fighters,
      registerTimeout,
      setFiringState,
      skills,
      spawnImpact,
      spawnProjectile,
    ]
  );
  const finishMatch = useCallback(

    (result, finalFighters, finalSolvedCounts, showKnockoutAnimation) => {

      if (endingStartedRef.current) return;
      endingStartedRef.current = true;

      statusRef.current = "finishing";

      clearAllScheduled();
      const finalizedResults = {};

      for (const side of ["p1", "p2"]) {

        const outcome =

          result === "draw" ? "draw" : result === side ? "win" : "loss";

        const finalScore = calculatePlanarityScore({

          solvedPuzzles: finalSolvedCounts[side],

          outcome,

          hp: finalFighters[side].hp,

          shield: finalFighters[side].shieldHP,

        });
        finalizedResults[side] = competitionAttemptRef.current.finalize({

          playerSlot: side,

          finalScore,

          outcome,

        });

      }
      setCompetitionResults(finalizedResults);

      setWinner(result);

      setStatus(showKnockoutAnimation ? "finishing" : "ended");

      setFighters((current) => ({

        p1: {

          ...current.p1,

          downed: finalFighters.p1.hp <= 0 || current.p1.downed,

          firing: false,

        },

        p2: {

          ...current.p2,

          downed: finalFighters.p2.hp <= 0 || current.p2.downed,

          firing: false,

        },

      }));
      if (showKnockoutAnimation) {

        if (finalFighters.p1.hp <= 0) spawnImpact("p1", "death");

        if (finalFighters.p2.hp <= 0) spawnImpact("p2", "death");

        triggerShake(true);

        registerTimeout(() => setStatus("ended"), 1500);

      }

    },

    [clearAllScheduled, registerTimeout, spawnImpact, triggerShake]

  );
  useEffect(() => {

    if (status !== "playing" || endingStartedRef.current) return;
    const result = getPlanarityKnockoutResult(

      fighters.p1.hp,

      fighters.p2.hp

    );

    if (!result) return;
    finishMatch(result, fighters, solvedCountsRef.current, true);

  }, [fighters, finishMatch, status]);
  const handlePuzzleSolved = useCallback(
    (side) => {
      if (statusRef.current !== "playing" || endingStartedRef.current) return;
      const nextSolvedCounts = {
        ...solvedCountsRef.current,
        [side]: solvedCountsRef.current[side] + 1,
      };
      solvedCountsRef.current = nextSolvedCounts;
      setSolvedCounts(nextSolvedCounts);
      if (side === "p1") {
        const rewardId = REWARD_ORDER[(p1Round - 1) % REWARD_ORDER.length];
        setSkills((current) => ({
          ...current,
          p1: {
            ...current.p1,
            [rewardId]: current.p1[rewardId] + 1,
          },
        }));
        setP1Round((value) => value + 1);
      }
      if (side === "p2") {
        const rewardId = REWARD_ORDER[(p2Round - 1) % REWARD_ORDER.length];
        setSkills((current) => ({
          ...current,
          p2: {
            ...current.p2,
            [rewardId]: current.p2[rewardId] + 1,
          },
        }));
        setP2Round((value) => value + 1);
      }
      // Solving a board never ends the match. It only grants a skill use.
      // Victory is decided exclusively by the existing HP knockout effect.
    },

    [p1Round, p2Round]
  );
  useEffect(() => {
    if (status !== "playing") return;
    const controls = {
      "1": ["p1", "burst"],
      "2": ["p1", "grenade"],
      "3": ["p1", "molotov"],
      "4": ["p1", "heal"],
      "7": ["p2", "burst"],
      "8": ["p2", "grenade"],
      "9": ["p2", "molotov"],
      "0": ["p2", "heal"],
    };
    const handleKey = (event) => {
      const action = controls[event.key.toLowerCase()];
      if (!action) return;
      activateSkill(action[0], action[1]);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activateSkill, status]);
  return (
    <main
      className={`planarity-app ${screenShake ? "screen-shake" : ""}`}
      style={{ "--game-scale": gameScale }}
    >
      <audio
        ref={bgmRef}
        src={`${import.meta.env.BASE_URL}audio/planarity.mp3`}
        loop
        preload="auto"
      />
      <div className="planarity-global-controls">
        <div className="planarity-lang-switch" role="group" aria-label="Language">
          <button
            type="button"
            className={lang === "en" ? "active" : ""}
            onClick={() => setLang("en")}
          >
            EN
          </button>
          <button
            type="button"
            className={lang === "zh" ? "active" : ""}
            onClick={() => setLang("zh")}
          >
            中文
          </button>
        </div>
      </div>
      <div className="world-background">
        <img className="celestial-world-image" src={hubBackground} alt="" />
        <div className="sky-gradient" />
        <div className="moon-glow" />
        <div className="city city-back" />
        <div className="city city-front" />
        <div className="nebula nebula-a" />
        <div className="nebula nebula-b" />
        <div className="arena-stars" />
        <div className="floating-dust dust-a" />
        <div className="floating-dust dust-b" />
        <div className="scanlines" />
      </div>
      <div className={`game-shell ${status === "menu" ? "menu-blur" : ""}`}>
        <header className="game-topbar">
          <div className="brand">
            <div className="brand-icon">
              <span />
              <span />
              <span />
            </div>
            <div>
              <strong>PLANARITY</strong>
              <small>{t.subBrand}</small>
            </div>
          </div>
          <div className="match-status">
            <div>
              <span>{t.p1Level}</span>
              <strong>{String(p1Round).padStart(2, "0")}</strong>
              <small className="planarity-live-score">P1 SCORE {displayedScores.p1}</small>
            </div>
            <div className="versus-status"><strong>VS</strong></div>
            <div>
              <span>{t.p2Level}</span>
              <strong>{String(p2Round).padStart(2, "0")}</strong>
              <small className="planarity-live-score">P2 SCORE {displayedScores.p2}</small>
            </div>
          </div>
          <button className="menu-button" onClick={() => setStatus("menu")}>
            {t.menu}
          </button>
        </header>
        <section className={`battle-zone ${status === "finishing" ? "finishing" : ""}`}>
          <div className="arena-backdrop">
            <div className="arena-wall wall-left" />
            <div className="arena-wall wall-right" />
            <div className="arena-grid" />
            <div className="horizon-glow" />
            <div className="spotlight spotlight-left" />
            <div className="spotlight spotlight-right" />
            <div className="floor-line" />
            <div className="battle-particles">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>
          <ProjectileLayer projectiles={projectiles} />
          <ImpactLayer impacts={impacts} />
          <Shooter side="p1" fighter={fighters.p1} name={playerOneName} />
          <div className="arena-divider" />
          <Shooter side="p2" fighter={fighters.p2} name={playerTwoName} />
          {status === "finishing" && (
            <div className="elimination-banner">
              <span>{t.elimination}</span>
              <strong>{t.targetDown}</strong>
            </div>
          )}
        </section>
        <section className="puzzle-zone">
          <PuzzlePanel
            side="p1"
            name={playerOneName}
            puzzle={p1Puzzle}
            reward={p1Reward}
            onSolved={handlePuzzleSolved}
            isAI={false}
            charges={skills.p1}
            onUseSkill={activateSkill}
            gameEnded={status !== "playing"}
            lang={lang}
          />
          <div className="vertical-divider" />
          <PuzzlePanel
            side="p2"
            name={playerTwoName}
            puzzle={p2Puzzle}
            reward={p2Reward}
            onSolved={handlePuzzleSolved}
            isAI={false}
            charges={skills.p2}
            onUseSkill={activateSkill}
            gameEnded={status !== "playing"}
            lang={lang}
          />
        </section>
      </div>
      {status === "menu" && <StartScreen onStart={startGame} lang={lang} />}
      {status === "ended" && winner && (
        <EndScreen
          winner={winner}
          scores={displayedScores}
          lang={lang}
          onRestart={onHome ?? startGame}
          onMenu={onHome ?? (() => {
            clearAllScheduled();
            setWinner(null);
            setStatus("menu");
          })}
        />
      )}
    </main>
  );
}
