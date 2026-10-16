import { useCallback, useEffect, useRef, useState } from "react";
import "./KNN.css";
import knnIslandImg from "../../assets/home-layers/knn.png";
import backgroundImg from "../../assets/home-layers/background.png";
import {
  calculateKnnCompetitionScore,
  createCompetitionAttempt,
} from "../../scoring/competitionScoring.js";

const C = {
  blue: { hex: "#57a8ff", rgb: "87,168,255", zh: "蓝", en: "BLUE" },
  red: { hex: "#ff5d79", rgb: "255,93,121", zh: "红", en: "RED" },
  green: { hex: "#3ee3a4", rgb: "62,227,164", zh: "绿", en: "GREEN" }
};
const T = {
  zh: {
    title: "KNN 潜行劫案", sub: "潜入 · 破解 · 撤离",
    intro: "潜入区域并找到保险箱。点击彩色点可查看它与中心保险箱的距离，在 3 次机会内选出最近的 K 个指定颜色点，取得钥匙后解锁出口。",
    start: "开始任务", map: "地图", confirm: "潜入", target: "目标", got: "已收", k: "K", score: "原游戏分", armor: "护甲",
    accuracy: "准确奖励", competitionScore: "竞赛分", finalScore: "最终得分", completionBonus: "通关奖励",
    collect: "寻找保险箱", escape: "前往出口", run: "奔跑", caught: "被发现！", lost: "丢失目标", picked: "已收集",
    allGot: "全部收齐！前往出口", win: "任务完成", lose: "任务失败", replay: "再来一次", lang: "EN", paused: "已暂停", resume: "继续", cd: "冷却",
    interact: "互动 (F)", blockedDoor: "有物体阻挡，无法关门！"
  },
  en: {
    title: "KNN HEIST", sub: "Infiltrate · Crack · Extract",
    intro: "Find the vault. Tap colored dots to measure their distances from the central vault, then select the K nearest dots of the required color within 3 attempts. Grab the key and escape!",
    start: "START", map: "MAP", confirm: "INFILTRATE", target: "TARGET", got: "GOT", k: "K", score: "GAME SCORE", armor: "ARMOR",
    accuracy: "ACCURACY", competitionScore: "COMPETITION", finalScore: "FINAL SCORE", completionBonus: "CLEAR BONUS",
    collect: "FIND THE VAULT", escape: "HEAD TO EXIT", run: "RUN", caught: "SPOTTED!", lost: "LOST", picked: "COLLECTED",
    allGot: "ALL COLLECTED! EXIT", win: "MISSION COMPLETE", lose: "MISSION FAILED", replay: "PLAY AGAIN", lang: "中文", paused: "PAUSED", resume: "RESUME", cd: "CD",
    interact: "INTERACT (F)", blockedDoor: "BLOCKED!"
  }
};

const HH = 38;
const WALK = 8, RUN = 14;
const RUN_DUR = 3500, RUN_CD = 3000;
const MAX_ARMOR = 5, VIS_R = 14.5, VIS_A = Math.PI / 2.5;
const NOISE_R = 9; 
const COMPETITION_LEVEL_COUNT = 3;

// 地图构建助手，精确计算带缺口的墙壁和门，彻底杜绝交叉穿模
const uid = () => Math.random().toString(36).slice(2, 7);
const W = (x1, x2, z1, z2) => ({ x: (x1 + x2) / 2, z: (z1 + z2) / 2, w: Math.max(1.6, Math.abs(x2 - x1)), h: Math.max(1.6, Math.abs(z2 - z1)) });
const D = (x1, x2, z1, z2) => ({ id: uid(), x: (x1 + x2) / 2, z: (z1 + z2) / 2, w: Math.max(1.6, Math.abs(x2 - x1)), h: Math.max(1.6, Math.abs(z2 - z1)), open: false });

const OUTER_WALLS = [
  W(-38, -6, 38, 38), W(6, 38, 38, 38),       // 底部边界 + 入口
  W(-38, -6, -38, -38), W(6, 38, -38, -38),   // 顶部边界 + 出口
  W(-38, -38, -38, 38), W(38, 38, -38, 38)    // 左右边界
];

const LEVELS_DATA = [
  // Level 1: 办公区 (四个带门的房间 + 十字走廊)
  {
    k: 3,
    guards: 3,
    tgt: "blue",
    safe: { x: 25, z: -25 },
puzzleN: 10,

  walls: [
    ...OUTER_WALLS,

    // 左边中央墙
    W(-12, -12, -38, -22),
    W(-12, -12, -14, 14),
    W(-12, -12, 22, 38),

    // 右边中央墙
    W(12, 12, -38, -22),
    W(12, 12, -14, 14),
    W(12, 12, 22, 38),

    // 左边房间分隔墙
    W(-38, -12, 0, 0),

    // 右边房间分隔墙
    W(12, 38, 0, 0)
  ],

  doors: [
    // 左上门
    D(-12, -12, -22, -14),

    // 左下门
    D(-12, -12, 14, 22),

    // 右上门
    D(12, 12, -22, -14),

    // 右下门
    D(12, 12, 14, 22)
  ],

  routes: [
    // 中央走廊
    [
      { x: 0, z: -28 },
      { x: 0, z: 28 }
    ],

    // 左上房间
    [
      { x: -25, z: -25 },
      { x: -17, z: -25 },
      { x: -17, z: -8 },
      { x: -25, z: -8 }
    ],

    // 右下房间
    [
      { x: 25, z: 25 },
      { x: 17, z: 25 },
      { x: 17, z: 8 },
      { x: 25, z: 8 }
    ]
  ]
},
  // Level 2: 仓库区 (高密度货架，长走廊)
  {
    k: 4, guards: 4, tgt: "red",
    safe: { x: -30, z: -20 },
    puzzleN: 13,
    walls: [
      ...OUTER_WALLS,
      W(-20, -20, -25, 25), W(10, 10, -25, 25), // 垂直长货架
      W(-5, -5, -38, -15), W(-5, -5, -5, 38), 
      W(25, 25, -38, 15), W(25, 25, 25, 38),
      W(-38, -28, 0, 0), W(-12, -5, 0, 0), W(10, 25, 0, 0) // 横向隔断
    ],
    doors: [
      D(-5, -5, -15, -5), D(25, 25, 15, 25),
      D(-28, -12, 0, 0), D(-5, 10, 0, 0)
    ],
    routes: [
      [{x: -12, z: 30}, {x: -12, z: -30}],
      [{x: 2, z: -30}, {x: 2, z: 30}],
      [{x: 18, z: 30}, {x: 18, z: -30}],
      [{x: 32, z: -20}, {x: 32, z: 20}]
    ]
  },
  // Level 3: 封锁地带 (套娃房)
  {
    k: 5, guards: 5, tgt: "green",
    safe: { x: 0, z: 0 },
    puzzleN: 16,
    walls: [
      ...OUTER_WALLS,
      W(-38, -15, -15, -15), W(-15, -15, -38, -15), // 左上
      W(15, 38, 15, 15), W(15, 15, 15, 38),         // 右下
      W(10, 25, -20, -20), W(25, 25, -38, -20),     // 右上 L
      W(-25, -10, 20, 20), W(-25, -25, 20, 38)      // 左下 L
    ],
    doors: [
      D(-15, -15, -15, -5), D(15, 15, 5, 15),
      D(-25, -15, 20, 20), D(15, 25, -20, -20)
    ],
   routes: [
  // 中央上方巡逻
  [
    { x: -8, z: -28 },
    { x: 8, z: -28 }
  ],

  // 中央下方巡逻
  [
    { x: -8, z: 28 },
    { x: 8, z: 28 }
  ],

  // 中央左侧
  [
    { x: -8, z: -10 },
    { x: -8, z: 10 }
  ],

  // 中央右侧
  [
    { x: 8, z: -10 },
    { x: 8, z: 10 }
  ],

  // 中央横向巡逻
  [
    { x: -8, z: 0 },
    { x: 8, z: 0 }
  ]
]
  },
  // Level 4: 安检站 (横向截断)
// Level 4: 安检站
  {
    k: 6,
    guards: 6,
    tgt: "blue",
    safe: { x: 0, z: 0 },
puzzleN: 19,

  walls: [
    ...OUTER_WALLS,

    // ===== 上方安检线 z = -12 =====
    W(-38, -22, -12, -12),
    W(-14, -4, -12, -12),
    W(4, 14, -12, -12),
    W(22, 38, -12, -12),

    // ===== 下方安检线 z = 12 =====
    W(-38, -22, 12, 12),
    W(-14, -4, 12, 12),
    W(4, 14, 12, 12),
    W(22, 38, 12, 12)
  ],

  doors: [
    // 上方三个安检门
    D(-22, -14, -12, -12),
    D(-4, 4, -12, -12),
    D(14, 22, -12, -12),

    // 下方三个安检门
    D(-22, -14, 12, 12),
    D(-4, 4, 12, 12),
    D(14, 22, 12, 12)
  ],

  routes: [
    // ===== EXIT 区域 =====
    [
      { x: -28, z: -26 },
      { x: 28, z: -26 }
    ],

    [
      { x: 28, z: -19 },
      { x: -28, z: -19 }
    ],

    // ===== 中央安检区域 =====
    [
      { x: -28, z: -5 },
      { x: 28, z: -5 }
    ],

    [
      { x: 28, z: 5 },
      { x: -28, z: 5 }
    ],

    // ===== 入口区域 =====
    [
      { x: -28, z: 19 },
      { x: 28, z: 19 }
    ],

    [
      { x: 28, z: 26 },
      { x: -28, z: 26 }
    ]
  ]
},
  // Level 5: 同心金库
  {
    k: 7, guards: 8, tgt: "red",
    safe: { x: 0, z: 0 },
    puzzleN: 22,
    walls: [
      ...OUTER_WALLS,
      W(-25, 25, -25, -25), W(-25, 25, 25, 25), // 中圈横壁
      W(-25, -25, -25, -5), W(-25, -25, 5, 25), // 中圈左壁
      W(25, 25, -25, -5), W(25, 25, 5, 25),     // 中圈右壁
      W(-12, -6, -12, -12), W(6, 12, -12, -12), // 内圈顶壁
      W(-12, -6, 12, 12), W(6, 12, 12, 12),     // 内圈底壁
      W(-12, -12, -12, 12), W(12, 12, -12, 12)  // 内圈侧壁
    ],
    doors: [
      D(-25, -25, -5, 5), D(25, 25, -5, 5),     // 中圈门
      D(-6, 6, 12, 12), D(-6, 6, -12, -12)      // 内圈门
    ],
    routes: [
      [{x: -30, z: -30}, {x: 30, z: -30}, {x: 30, z: 30}, {x: -30, z: 30}], // 外环巡逻 1
      [{x: 30, z: 30}, {x: -30, z: 30}, {x: -30, z: -30}, {x: 30, z: -30}], // 外环巡逻 2
      [{x: -18, z: -18}, {x: 18, z: -18}, {x: 18, z: 18}, {x: -18, z: 18}], // 中环巡逻 1
      [{x: 18, z: 18}, {x: -18, z: 18}, {x: -18, z: -18}, {x: 18, z: -18}], // 中环巡逻 2
      [{x: 0, z: -30}, {x: 0, z: -20}], [{x: 0, z: 30}, {x: 0, z: 20}],
      [{x: 0, z: 0}, {x: 0, z: 5}], [{x: 0, z: 0}, {x: 0, z: -5}]           // 内圈死守
    ]
  }
];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);

function losClear(gx, gz, px, pz, walls, doors) {
  const dx = px - gx, dz = pz - gz;
  const dist = Math.hypot(dx, dz);
  if (dist < .01) return true;
  const steps = Math.ceil(dist / .5);
  const sx = dx / steps, sz = dz / steps;
  let cx = gx, cz = gz;
  for (let i = 1; i < steps; i++) {
    cx += sx; cz += sz;
    for (const w of walls) {
      if (Math.abs(cx - w.x) < w.w / 2 && Math.abs(cz - w.z) < w.h / 2) return false;
    }
    for (const d of doors) {
      if (!d.open && Math.abs(cx - d.x) < d.w / 2 && Math.abs(cz - d.z) < d.h / 2) return false;
    }
  }
  return true;
}

// 独立的双轴丝滑碰撞系统
function applyCollision(px, pz, mx, mz, spd, dt, walls, doors, radius = 1.25) {
  const steps = 4;
  const sdt = (dt / steps) * spd;
  let cx = px, cz = pz;

  for (let i = 0; i < steps; i++) {
    const nx = cx + mx * sdt;
    const nz = cz + mz * sdt;
    let hitX = false, hitZ = false;

    for (const w of walls) {
      if (!hitX && Math.abs(nx - w.x) < w.w / 2 + radius && Math.abs(cz - w.z) < w.h / 2 + radius) hitX = true;
      if (!hitZ && Math.abs(cx - w.x) < w.w / 2 + radius && Math.abs(nz - w.z) < w.h / 2 + radius) hitZ = true;
    }
    for (const d of doors) {
      if (!d.open) {
        if (!hitX && Math.abs(nx - d.x) < d.w / 2 + radius && Math.abs(cz - d.z) < d.h / 2 + radius) hitX = true;
        if (!hitZ && Math.abs(cx - d.x) < d.w / 2 + radius && Math.abs(nz - d.z) < d.h / 2 + radius) hitZ = true;
      }
    }

    if (!hitX) cx = nx;
    if (!hitZ) cz = nz;
  }
  return { x: cx, z: cz };
}

// 点到矩形的真实距离：用于长门交互，避免只检测门中心。
function pointRectDistance(x, z, rect) {
  const dx = Math.max(Math.abs(x - rect.x) - rect.w / 2, 0);
  const dz = Math.max(Math.abs(z - rect.z) - rect.h / 2, 0);
  return Math.hypot(dx, dz);
}

function circleHitsRect(x, z, r, rect) {
  return Math.abs(x - rect.x) < rect.w / 2 + r && Math.abs(z - rect.z) < rect.h / 2 + r;
}

function wallBlocked(x, z, walls, r = 1.2) {
  return walls.some(w => circleHitsRect(x, z, r, w));
}

// 轻量网格寻路。门视为可通过，因为守卫会在靠近时自动开门；墙始终不可穿。
const NAV_STEP = 2;
const NAV_MIN = -36;
const NAV_MAX = 36;
const NAV_SIZE = Math.round((NAV_MAX - NAV_MIN) / NAV_STEP) + 1;
const navKey = (ix, iz) => `${ix},${iz}`;
const navWorld = i => NAV_MIN + i * NAV_STEP;
const navIndex = v => clamp(Math.round((v - NAV_MIN) / NAV_STEP), 0, NAV_SIZE - 1);

function nearestFreeNavNode(x, z, walls) {
  const sx = navIndex(x), sz = navIndex(z);
  for (let r = 0; r <= 5; r++) {
    for (let dz = -r; dz <= r; dz++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
        const ix = sx + dx, iz = sz + dz;
        if (ix < 0 || iz < 0 || ix >= NAV_SIZE || iz >= NAV_SIZE) continue;
        const wx = navWorld(ix), wz = navWorld(iz);
        if (!wallBlocked(wx, wz, walls, 1.15)) return { ix, iz, x: wx, z: wz };
      }
    }
  }
  return null;
}

function findWallPath(start, goal, walls) {
  const s = nearestFreeNavNode(start.x, start.z, walls);
  const g = nearestFreeNavNode(goal.x, goal.z, walls);
  if (!s || !g) return [];
  const sk = navKey(s.ix, s.iz), gk = navKey(g.ix, g.iz);
  if (sk === gk) return [{ x: goal.x, z: goal.z }];

  const queue = [{ ix: s.ix, iz: s.iz }];
  let qi = 0;
  const came = new Map([[sk, null]]);
  const dirs = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [1, 1], [1, -1], [-1, 1], [-1, -1]
  ];

  while (qi < queue.length) {
    const cur = queue[qi++];
    const ck = navKey(cur.ix, cur.iz);
    if (ck === gk) break;

    for (const [dx, dz] of dirs) {
      const nx = cur.ix + dx, nz = cur.iz + dz;
      if (nx < 0 || nz < 0 || nx >= NAV_SIZE || nz >= NAV_SIZE) continue;
      const nk = navKey(nx, nz);
      if (came.has(nk)) continue;

      const wx = navWorld(nx), wz = navWorld(nz);
      if (wallBlocked(wx, wz, walls, 1.15)) continue;

      // 对角移动不能从墙角硬切过去。
      if (dx !== 0 && dz !== 0) {
        const wx1 = navWorld(cur.ix + dx), wz1 = navWorld(cur.iz);
        const wx2 = navWorld(cur.ix), wz2 = navWorld(cur.iz + dz);
        if (wallBlocked(wx1, wz1, walls, 1.15) || wallBlocked(wx2, wz2, walls, 1.15)) continue;
      }

      came.set(nk, ck);
      queue.push({ ix: nx, iz: nz });
    }
  }

  if (!came.has(gk)) return [];
  const rev = [];
  let curKey = gk;
  while (curKey && curKey !== sk) {
    const [ix, iz] = curKey.split(',').map(Number);
    rev.push({ x: navWorld(ix), z: navWorld(iz) });
    curKey = came.get(curKey);
  }
  rev.reverse();

  // 每隔几个格子取一个点，减少守卫抖动；最后保留真实目标。
  const path = rev.filter((_, i) => i % 2 === 1 || i === rev.length - 1);
  if (!wallBlocked(goal.x, goal.z, walls, .9)) path.push({ x: goal.x, z: goal.z });
  return path;
}

function buildReachableNavSet(start, walls) {
  const s = nearestFreeNavNode(start.x, start.z, walls);
  const seen = new Set();
  if (!s) return seen;

  const queue = [{ ix: s.ix, iz: s.iz }];
  let qi = 0;
  seen.add(navKey(s.ix, s.iz));
  const dirs = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [1, 1], [1, -1], [-1, 1], [-1, -1]
  ];

  while (qi < queue.length) {
    const cur = queue[qi++];
    for (const [dx, dz] of dirs) {
      const nx = cur.ix + dx, nz = cur.iz + dz;
      if (nx < 0 || nz < 0 || nx >= NAV_SIZE || nz >= NAV_SIZE) continue;
      const nk = navKey(nx, nz);
      if (seen.has(nk)) continue;

      const wx = navWorld(nx), wz = navWorld(nz);
      if (wallBlocked(wx, wz, walls, 1.15)) continue;
      if (dx !== 0 && dz !== 0) {
        const wx1 = navWorld(cur.ix + dx), wz1 = navWorld(cur.iz);
        const wx2 = navWorld(cur.ix), wz2 = navWorld(cur.iz + dz);
        if (wallBlocked(wx1, wz1, walls, 1.15) || wallBlocked(wx2, wz2, walls, 1.15)) continue;
      }

      seen.add(nk);
      queue.push({ ix: nx, iz: nz });
    }
  }
  return seen;
}

function reachableFromSet(x, z, walls, reachable) {
  const n = nearestFreeNavNode(x, z, walls);
  return !!n && reachable.has(navKey(n.ix, n.iz));
}

function getGuardNavTarget(g, goal, walls, now) {
  const goalKey = `${Math.round(goal.x / 3)},${Math.round(goal.z / 3)}`;
  const needPath = !g.navPath?.length || g.navGoalKey !== goalKey || now >= (g.navAt || 0);
  if (needPath) {
    g.navPath = findWallPath({ x: g.x, z: g.z }, goal, walls);
    g.navIndex = 0;
    g.navGoalKey = goalKey;
    g.navAt = now + 650;
  }

  while (g.navPath?.length && g.navIndex < g.navPath.length - 1) {
    const n = g.navPath[g.navIndex];
    if (Math.hypot(n.x - g.x, n.z - g.z) > 1.15) break;
    g.navIndex += 1;
  }
  return g.navPath?.[g.navIndex] || goal;
}

function openNearbyGuardDoors(g, doors) {
  // Guards automatically open a nearby door so their navigation does not freeze.
  doors.forEach(d => {
    if (!d.open && pointRectDistance(g.x, g.z, d) < 2.35) {
      d.open = true;
    }
  });
}

// The same Euclidean-distance formula is used for scoring and on-screen measurements.
// Coordinates lie on a virtual 100-by-100 plane with the vault at (50, 50).
function getKnnDistance(point) {
  return Math.hypot(point.x - 50, point.y - 50);
}

function formatKnnDistance(point) {
  return getKnnDistance(point).toFixed(3);
}

function createKnnPuzzle(target, k, count) {
  const others = Object.keys(C).filter(c => c !== target);

  const points = Array.from({ length: count }, (_, i) => {
    let x, y;

    do {
      x = rand(8, 92);
      y = rand(10, 90);
    } while (Math.hypot(x - 50, y - 50) < 8);

    return {
      id: `p${i}`,
      x,
      y,
      cls: i < k + 4
        ? target
        : others[(i - k) % others.length]
    };
  });

  const correct = points
    .filter(p => p.cls === target)
    .sort(
      (a, b) =>
        getKnnDistance(a) -
        getKnnDistance(b)
    )
    .slice(0, k)
    .map(p => p.id);

  return { points, correct };
}

function buildLevel(idx) {
  const data = LEVELS_DATA[Math.min(idx, LEVELS_DATA.length - 1)];
  const walls = data.walls.map(w => ({ ...w }));
  const doors = data.doors.map(d => ({ ...d }));

  // 旧版彩色收集物已移除；颜色点只会出现在 KNN 保险箱题目中。
  const items = [];
  const tgt = data.tgt;

  const guards = [];
  for (let g = 0; g < data.guards; g++) {
    const route = data.routes[g % data.routes.length];
    guards.push({
      id: "g" + g,
      x: route[0].x,
      z: route[0].z,
      path: route.map(p => ({ ...p })),
      wp: route.length > 1 ? 1 : 0,
      angle: 0,
      detect: 0,
      state: "patrol",
      alert: 0,
      lastSeen: null,
      search: 0,
      spdMult: 1 + idx * 0.08,
      navPath: [],
      navIndex: 0,
      navGoalKey: "",
      navAt: 0,
      stuck: 0
    });
  }
  return {
  items,
  guards,
  walls,
  doors,
  k: data.k,
  tgt,
  safe: { ...data.safe },
  puzzleN: data.puzzleN
};
}

// -------------- 绘制 --------------
function drawWorld(ctx, s, w, h, dpr) {
  const { px, pz, guards, walls, doors, now, safe, hasKey } = s;
  ctx.save(); ctx.scale(dpr, dpr); ctx.clearRect(0, 0, w, h);
  const sc = Math.max(9, Math.min(w, h) / 40);
  const cx = w / 2, cy = h / 2;
  const TX = x => (x - px) * sc + cx;
  const TZ = z => (z - pz) * sc + cy;

  // 地板
  ctx.fillStyle = "#071226"; ctx.fillRect(0, 0, w, h);
  const gg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * .75);
  gg.addColorStop(0, "rgba(43,87,151,.52)"); gg.addColorStop(.52, "rgba(68,49,130,.22)"); gg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gg; ctx.fillRect(0, 0, w, h);

  // Celestial haze: visual only, does not affect collisions or gameplay.
  const nebula = ctx.createLinearGradient(0, 0, w, h);
  nebula.addColorStop(0, "rgba(81,120,255,.07)");
  nebula.addColorStop(.5, "rgba(139,79,255,.05)");
  nebula.addColorStop(1, "rgba(49,220,202,.05)");
  ctx.fillStyle = nebula;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(119,191,255,.12)"; ctx.lineWidth = 1;
  const gs = 2;
  for (let x = Math.floor((px - w / 2 / sc) / gs) * gs; x < px + w / 2 / sc; x += gs) {
    const sx = TX(x); ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, h); ctx.stroke();
  }
  for (let z = Math.floor((pz - h / 2 / sc) / gs) * gs; z < pz + h / 2 / sc; z += gs) {
    const sz = TZ(z); ctx.beginPath(); ctx.moveTo(0, sz); ctx.lineTo(w, sz); ctx.stroke();
  }

  // 出入口
  const ex = TX(0), ey = TZ(-38);
  const pu = (now % 1400) / 1400;
  const escCol = hasKey ? "62,227,164" : "255,93,121";
  ctx.fillStyle = `rgba(${escCol},${.15 + (1 - pu) * .25})`;
  ctx.beginPath(); ctx.arc(ex, ey, 3.5 * sc * (.85 + pu * .35), 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = `rgb(${escCol})`; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(ex, ey, 3.5 * sc * (.9 + pu * .4), 0, Math.PI * 2); ctx.stroke();
  ctx.font = "900 11px Inter"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = `rgb(${escCol})`; ctx.fillText(hasKey ? "EXIT" : "LOCKED", ex, ey - 3.5 * sc - 14);

  const ix = TX(0), iy = TZ(38);
  ctx.strokeStyle = "rgba(180,180,180,.5)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(ix, iy, 3 * sc, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = "rgba(180,180,180,.5)"; ctx.font = "900 10px Inter";
  ctx.fillText("IN", ix, iy + 3 * sc + 14);

  // ===== HIGH QUALITY DOOR =====
  doors.forEach(d => {
    const dx = TX(d.x);
    const dz = TZ(d.z);
    const dw = d.w * sc;
    const dh = d.h * sc;

    if (
      dx > w + 40 ||
      dz > h + 40 ||
      dx + dw < -40 ||
      dz + dh < -40
    ) return;

    const horizontal = d.w > d.h;

    ctx.save();
    ctx.translate(dx, dz);

    // Ground shadow
    ctx.shadowColor = "rgba(0,0,0,.65)";
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 5;
    ctx.fillStyle = "rgba(0,0,0,.42)";
    ctx.fillRect(-dw / 2 + 3, -dh / 2 + 4, dw, dh);

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Metallic frame
    const frameGradient = horizontal
      ? ctx.createLinearGradient(0, -dh / 2, 0, dh / 2)
      : ctx.createLinearGradient(-dw / 2, 0, dw / 2, 0);

    frameGradient.addColorStop(0, "#a69bc7");
    frameGradient.addColorStop(.18, "#465474");
    frameGradient.addColorStop(.55, "#18233d");
    frameGradient.addColorStop(.82, "#4a4c78");
    frameGradient.addColorStop(1, "#d0b56c");

    ctx.fillStyle = frameGradient;
    ctx.fillRect(-dw / 2 - 4, -dh / 2 - 4, dw + 8, dh + 8);

    ctx.strokeStyle = "rgba(230,215,155,.28)";
    ctx.lineWidth = 1;
    ctx.strokeRect(-dw / 2 - 3.5, -dh / 2 - 3.5, dw + 7, dh + 7);

    if (d.open) {
      // Dark opening
      const opening = ctx.createLinearGradient(
        -dw / 2, -dh / 2, dw / 2, dh / 2
      );
      opening.addColorStop(0, "rgba(8,18,42,.82)");
      opening.addColorStop(.5, "rgba(31,68,112,.34)");
      opening.addColorStop(1, "rgba(14,15,48,.82)");
      ctx.fillStyle = opening;
      ctx.fillRect(-dw / 2, -dh / 2, dw, dh);

      // Tracks
      ctx.strokeStyle = "rgba(165,190,170,.30)";
      ctx.lineWidth = 1;

      if (horizontal) {
        ctx.beginPath();
        ctx.moveTo(-dw / 2, -dh * .28);
        ctx.lineTo(dw / 2, -dh * .28);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-dw / 2, dh * .28);
        ctx.lineTo(dw / 2, dh * .28);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(-dw * .28, -dh / 2);
        ctx.lineTo(-dw * .28, dh / 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(dw * .28, -dh / 2);
        ctx.lineTo(dw * .28, dh / 2);
        ctx.stroke();
      }

      // Retracted door leaves
      const leafGradient = ctx.createLinearGradient(
        -dw / 2, -dh / 2, dw / 2, dh / 2
      );
      leafGradient.addColorStop(0, "#b49a47");
      leafGradient.addColorStop(.22, "#725d25");
      leafGradient.addColorStop(.55, "#3d351e");
      leafGradient.addColorStop(.8, "#826d2f");
      leafGradient.addColorStop(1, "#d1b458");
      ctx.fillStyle = leafGradient;

      if (horizontal) {
        const leafW = dw * .22;
        ctx.fillRect(-dw / 2, -dh / 2, leafW, dh);
        ctx.fillRect(dw / 2 - leafW, -dh / 2, leafW, dh);
      } else {
        const leafH = dh * .22;
        ctx.fillRect(-dw / 2, -dh / 2, dw, leafH);
        ctx.fillRect(-dw / 2, dh / 2 - leafH, dw, leafH);
      }

      // Open indicator
      ctx.shadowColor = "#3ee3a4";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#55f0b2";
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(2.5, sc * .18), 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      // Closed metallic leaf
      const doorGradient = horizontal
        ? ctx.createLinearGradient(0, -dh / 2, 0, dh / 2)
        : ctx.createLinearGradient(-dw / 2, 0, dw / 2, 0);

      doorGradient.addColorStop(0, "#d1b65d");
      doorGradient.addColorStop(.12, "#9d8138");
      doorGradient.addColorStop(.42, "#57471f");
      doorGradient.addColorStop(.58, "#44391d");
      doorGradient.addColorStop(.86, "#9b813b");
      doorGradient.addColorStop(1, "#d5bb62");

      ctx.fillStyle = doorGradient;
      ctx.fillRect(-dw / 2, -dh / 2, dw, dh);

      // Inner bevel
      if (dw > 9 && dh > 9) {
        ctx.strokeStyle = "rgba(255,235,170,.32)";
        ctx.lineWidth = 1.2;
        ctx.strokeRect(
          -dw / 2 + 4,
          -dh / 2 + 4,
          Math.max(1, dw - 8),
          Math.max(1, dh - 8)
        );
      }

      // Center seam
      ctx.strokeStyle = "rgba(15,15,10,.65)";
      ctx.lineWidth = 2;
      ctx.beginPath();

      if (horizontal) {
        ctx.moveTo(0, -dh / 2 + 3);
        ctx.lineTo(0, dh / 2 - 3);
      } else {
        ctx.moveTo(-dw / 2 + 3, 0);
        ctx.lineTo(dw / 2 - 3, 0);
      }
      ctx.stroke();

      // Seam highlight
      ctx.strokeStyle = "rgba(255,230,140,.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();

      if (horizontal) {
        ctx.moveTo(2, -dh / 2 + 4);
        ctx.lineTo(2, dh / 2 - 4);
      } else {
        ctx.moveTo(-dw / 2 + 4, 2);
        ctx.lineTo(dw / 2 - 4, 2);
      }
      ctx.stroke();

      // Control panel
      const panelW = horizontal
        ? Math.min(12, Math.max(6, dw * .12))
        : Math.min(Math.max(6, dw * .55), 12);

      const panelH = horizontal
        ? Math.min(Math.max(6, dh * .55), 12)
        : Math.min(12, Math.max(6, dh * .12));

      ctx.fillStyle = "#141812";
      ctx.fillRect(-panelW / 2, -panelH / 2, panelW, panelH);

      ctx.shadowColor = "#ffd66b";
      ctx.shadowBlur = 10;
      ctx.fillStyle = "#ffe39a";
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(1.5, sc * .10), 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  });

  // 墙
  // ===== HIGH QUALITY WALL =====
walls.forEach(wl => {
  const wx = TX(wl.x - wl.w / 2);
  const wz = TZ(wl.z - wl.h / 2);

  const ww = wl.w * sc;
  const wh = wl.h * sc;

  if (
    wx > w + 40 ||
    wz > h + 40 ||
    wx + ww < -40 ||
    wz + wh < -40
  ) return;

  ctx.save();

  // ===== 深层阴影 =====
  ctx.shadowColor = "rgba(0,0,0,.75)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 7;

  ctx.fillStyle = "#0e1730";
  ctx.fillRect(wx, wz, ww, wh);

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // ===== 主体材质 =====
  const horizontal = ww > wh;

  const wallGradient = horizontal
    ? ctx.createLinearGradient(wx, wz, wx, wz + wh)
    : ctx.createLinearGradient(wx, wz, wx + ww, wz);

  wallGradient.addColorStop(0, "#7789ae");
  wallGradient.addColorStop(.08, "#536b94");
  wallGradient.addColorStop(.32, "#30466f");
  wallGradient.addColorStop(.68, "#202e53");
  wallGradient.addColorStop(.92, "#171f3d");
  wallGradient.addColorStop(1, "#0d142b");

  ctx.fillStyle = wallGradient;
  ctx.fillRect(wx, wz, ww, wh);

  // ===== 外框 =====
  ctx.strokeStyle = "rgba(5,9,28,.96)";
  ctx.lineWidth = 3;
  ctx.strokeRect(
    wx + 1.5,
    wz + 1.5,
    Math.max(0, ww - 3),
    Math.max(0, wh - 3)
  );

  // ===== 内框 =====
  if (ww > 8 && wh > 8) {
    ctx.strokeStyle = "rgba(190,215,255,.20)";
    ctx.lineWidth = 1;

    ctx.strokeRect(
      wx + 4.5,
      wz + 4.5,
      ww - 9,
      wh - 9
    );
  }

  // ===== 顶部高光 =====
  ctx.strokeStyle = "rgba(207,226,255,.28)";
  ctx.lineWidth = 1;

  ctx.beginPath();

  if (horizontal) {
    ctx.moveTo(wx + 3, wz + 3);
    ctx.lineTo(wx + ww - 3, wz + 3);
  } else {
    ctx.moveTo(wx + 3, wz + 3);
    ctx.lineTo(wx + 3, wz + wh - 3);
  }

  ctx.stroke();

  // ===== 底部暗边，产生厚度 =====
  ctx.strokeStyle = "rgba(0,0,0,.48)";
  ctx.lineWidth = 2;

  ctx.beginPath();

  if (horizontal) {
    ctx.moveTo(wx + 2, wz + wh - 2);
    ctx.lineTo(wx + ww - 2, wz + wh - 2);
  } else {
    ctx.moveTo(wx + ww - 2, wz + 2);
    ctx.lineTo(wx + ww - 2, wz + wh - 2);
  }

  ctx.stroke();

  // ===== 墙板接缝 =====
  ctx.strokeStyle = "rgba(4,9,26,.34)";
  ctx.lineWidth = 1;

  const panelSize = Math.max(28, sc * 3);

  if (horizontal && ww > panelSize * 1.5) {

    for (
      let x = wx + panelSize;
      x < wx + ww - 8;
      x += panelSize
    ) {
      ctx.beginPath();

      ctx.moveTo(
        Math.round(x) + .5,
        wz + 5
      );

      ctx.lineTo(
        Math.round(x) + .5,
        wz + wh - 5
      );

      ctx.stroke();

      // 接缝旁高光
      ctx.strokeStyle = "rgba(174,216,255,.075)";

      ctx.beginPath();

      ctx.moveTo(
        Math.round(x + 1) + .5,
        wz + 6
      );

      ctx.lineTo(
        Math.round(x + 1) + .5,
        wz + wh - 6
      );

      ctx.stroke();

      ctx.strokeStyle = "rgba(4,9,26,.34)";
    }

  } else if (!horizontal && wh > panelSize * 1.5) {

    for (
      let y = wz + panelSize;
      y < wz + wh - 8;
      y += panelSize
    ) {
      ctx.beginPath();

      ctx.moveTo(
        wx + 5,
        Math.round(y) + .5
      );

      ctx.lineTo(
        wx + ww - 5,
        Math.round(y) + .5
      );

      ctx.stroke();

      ctx.strokeStyle = "rgba(174,216,255,.075)";

      ctx.beginPath();

      ctx.moveTo(
        wx + 6,
        Math.round(y + 1) + .5
      );

      ctx.lineTo(
        wx + ww - 6,
        Math.round(y + 1) + .5
      );

      ctx.stroke();

      ctx.strokeStyle = "rgba(4,9,26,.34)";
    }
  }

  // ===== 金属铆钉 =====
  if (ww > 16 && wh > 16) {
    const rivets = [
      [wx + 6, wz + 6],
      [wx + ww - 6, wz + 6],
      [wx + 6, wz + wh - 6],
      [wx + ww - 6, wz + wh - 6]
    ];

    rivets.forEach(([rx, ry]) => {
      const rg = ctx.createRadialGradient(
        rx - 1,
        ry - 1,
        0,
        rx,
        ry,
        2.3
      );

      rg.addColorStop(0, "#c6dbff");
      rg.addColorStop(.4, "#5f759e");
      rg.addColorStop(1, "#111b36");

      ctx.fillStyle = rg;

      ctx.beginPath();
      ctx.arc(rx, ry, 2.2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  ctx.restore();
});

  // 守卫视野
  guards.forEach(g => {
    const gx = TX(g.x), gy = TZ(g.z);
    if (gx < -100 || gx > w + 100 || gy < -100 || gy > h + 100) return; // 优化渲染
    const isC = g.state === "chase", isS = g.state === "search" || g.state === "suspicious";
    const rgb = isC ? "255,80,80" : isS ? "255,160,60" : "255,210,90";
    const R = VIS_R * sc;
    const a0 = g.angle - VIS_A / 2, a1 = g.angle + VIS_A / 2;
    const N = 24;
    ctx.beginPath(); ctx.moveTo(gx, gy);
    for (let i = 0; i <= N; i++) {
      const a = a0 + (a1 - a0) * i / N;
      const dirx = Math.cos(a), dirz = Math.sin(a);
      let hit = R;
      for (let r = 1; r <= R; r += 4) {
        const hx = gx + dirx * r, hy = gy + dirz * r;
        const wx = px + (hx - cx) / sc, wz = pz + (hy - cy) / sc;
        let blocked = false;
        for (const wl of walls) {
          if (Math.abs(wx - wl.x) < wl.w / 2 && Math.abs(wz - wl.z) < wl.h / 2) { blocked = true; break; }
        }
        if (!blocked) {
          for (const d of doors) {
            if (!d.open && Math.abs(wx - d.x) < d.w / 2 && Math.abs(wz - d.z) < d.h / 2) { blocked = true; break; }
          }
        }
        if (blocked) { hit = r; break; }
      }
      ctx.lineTo(gx + dirx * hit, gy + dirz * hit);
    }
    ctx.closePath();
    const cg = ctx.createRadialGradient(gx, gy, 0, gx, gy, R);
    cg.addColorStop(0, `rgba(${rgb},.34)`); cg.addColorStop(.7, `rgba(${rgb},.08)`); cg.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = cg; ctx.fill();

    ctx.fillStyle = "rgba(0,0,0,.55)";
    ctx.beginPath(); ctx.ellipse(gx + 2, gy + 5, 1.15 * sc, .55 * sc, 0, 0, Math.PI * 2); ctx.fill();
    const bgl = ctx.createRadialGradient(gx - 1, gy - 1, 0, gx, gy, 1.15 * sc);
    if (isC) { bgl.addColorStop(0, "#ff9090"); bgl.addColorStop(1, "#8b2020"); }
    else if (isS) { bgl.addColorStop(0, "#ffc080"); bgl.addColorStop(1, "#8a4a10"); }
    else { bgl.addColorStop(0, "#f2ca72"); bgl.addColorStop(1, "#7a5a18"); }
    ctx.fillStyle = bgl; ctx.beginPath(); ctx.arc(gx, gy, 1.15 * sc, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#1a1206"; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = "#1a1206"; ctx.beginPath();
    ctx.moveTo(gx + Math.cos(g.angle) * 1.35 * sc, gy + Math.sin(g.angle) * 1.35 * sc);
    ctx.lineTo(gx + Math.cos(g.angle + 2.6) * .6 * sc, gy + Math.sin(g.angle + 2.6) * .6 * sc);
    ctx.lineTo(gx + Math.cos(g.angle - 2.6) * .6 * sc, gy + Math.sin(g.angle - 2.6) * .6 * sc);
    ctx.closePath(); ctx.fill();

    if (g.detect > 0.05 && !isC) {
      ctx.strokeStyle = `rgba(255,${Math.floor(200 - g.detect * 180)},80,${.7 + g.detect * .3})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(gx, gy, 1.7 * sc, -Math.PI / 2, -Math.PI / 2 + g.detect * Math.PI * 2); ctx.stroke();
    }
    if (isC || isS) {
      ctx.fillStyle = isC ? "#ff3333" : "#ff9933";
      ctx.font = "900 20px Inter"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(isC ? "!" : "?", gx, gy - 2.1 * sc);
    }
  });

  // 保险箱
  if (safe && !hasKey) {
    const sx = TX(safe.x), sy = TZ(safe.z);
    if (sx > -60 && sx < w + 60 && sy > -60 && sy < h + 60) {
      const pulse = (Math.sin(now / 260) + 1) / 2;
      const size = 2.15 * sc;

      const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, size * 2.4);
      glow.addColorStop(0, `rgba(255,214,107,${.28 + pulse * .18})`);
      glow.addColorStop(1, "rgba(255,214,107,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(sx, sy, size * 2.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(0,0,0,.5)";
      ctx.fillRect(sx - size * .9 + 3, sy - size * .65 + 5, size * 1.8, size * 1.3);

      const vg = ctx.createLinearGradient(sx, sy - size, sx, sy + size);
      vg.addColorStop(0, "#e8ce7f");
      vg.addColorStop(1, "#80641e");
      ctx.fillStyle = vg;
      ctx.fillRect(sx - size * .9, sy - size * .65, size * 1.8, size * 1.3);
      ctx.strokeStyle = "#fff0a5";
      ctx.lineWidth = 2;
      ctx.strokeRect(sx - size * .9, sy - size * .65, size * 1.8, size * 1.3);

      ctx.fillStyle = "#16150e";
      ctx.beginPath();
      ctx.arc(sx, sy, size * .22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(sx - size * .08, sy, size * .16, size * .34);

      ctx.font = "900 10px Inter";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffe69a";
      ctx.fillText("VAULT", sx, sy - size - 10);
    }
  }

  // 玩家
  const ppx = TX(px), ppy = TZ(pz);
  const pr = 1.05 * sc;
  ctx.fillStyle = "rgba(0,0,0,.55)";
  ctx.beginPath(); ctx.ellipse(ppx + 2, ppy + pr * .55, pr * 1.05, pr * .5, 0, 0, Math.PI * 2); ctx.fill();
  const pgl = ctx.createRadialGradient(ppx, ppy, 0, ppx, ppy, pr * 4);
  pgl.addColorStop(0, "rgba(255,240,140,.28)"); pgl.addColorStop(1, "rgba(255,240,140,0)");
  ctx.fillStyle = pgl; ctx.beginPath(); ctx.arc(ppx, ppy, pr * 4, 0, Math.PI * 2); ctx.fill();
  const pbg = ctx.createRadialGradient(ppx - pr * .3, ppy - pr * .3, 0, ppx, ppy, pr);
  pbg.addColorStop(0, "#fff"); pbg.addColorStop(.5, "#f0e090"); pbg.addColorStop(1, "#a89040");
  ctx.fillStyle = pbg; ctx.beginPath(); ctx.arc(ppx, ppy, pr, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#1a1606"; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.fillStyle = "#1a1606";
  ctx.beginPath(); ctx.arc(ppx, ppy, pr * .35, 0, Math.PI * 2); ctx.fill();

  const vg = ctx.createRadialGradient(cx, cy, Math.min(w, h) * .32, cx, cy, Math.max(w, h) * .72);
  vg.addColorStop(.5, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.72)");
  ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function TouchStick({ vector, onChange }) {
  const bR = useRef(null), aR = useRef(false), pR = useRef(null);
  const upd = useCallback(e => {
    if (!aR.current || !bR.current) return;
    const r = bR.current.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const mx = r.width * .34, mg = Math.hypot(dx, dy) || 1, sc = Math.min(1, mx / mg);
    onChange({ x: clamp(dx * sc / mx, -1, 1), y: clamp(dy * sc / mx, -1, 1) });
  }, [onChange]);
  const end = useCallback(() => { aR.current = false; pR.current = null; onChange({ x: 0, y: 0 }); }, [onChange]);
  return (
    <div ref={bR} className="stick"
      onPointerDown={e => { e.stopPropagation(); e.currentTarget.setPointerCapture?.(e.pointerId); pR.current = e.pointerId; aR.current = true; upd(e); }}
      onPointerMove={e => { if (pR.current !== e.pointerId) return; upd(e); }}
      onPointerUp={end} onPointerCancel={end}>
      <span className="stick-ring" />
      <span className="stick-knob" style={{ transform: `translate(calc(-50% + ${vector.x * 32}px), calc(-50% + ${vector.y * 32}px))` }} />
    </div>
  );
}

function MiniMap({ guards, walls, doors, player, safe, hasKey, t, onClick }) {
  const mp = v => `${clamp(((v + 42) / 84) * 100, 0, 100)}%`;

  return (
    <div className="mini-map" onClick={onClick}>
      <div className="mm-floor">
        {walls.map((w, i) => (
          <div key={i} className="mm-wall" style={{ left: mp(w.x), top: mp(w.z), width: `${(w.w / 84) * 100}%`, height: `${(w.h / 84) * 100}%` }} />
        ))}
        {doors.filter(d => !d.open).map(d => (
          <div key={d.id} className="mm-door" style={{ left: mp(d.x), top: mp(d.z), width: `${(d.w / 84) * 100}%`, height: `${(d.h / 84) * 100}%` }} />
        ))}
        {safe && !hasKey && (
          <div
            title="Vault"
            style={{
              position: "absolute",
              left: mp(safe.x),
              top: mp(safe.z),
              transform: "translate(-50%,-50%)",
              width: 15,
              height: 15,
              display: "grid",
              placeItems: "center",
              borderRadius: 3,
              background: "#d5b75e",
              color: "#14120b",
              fontSize: 9,
              fontWeight: 900,
              boxShadow: "0 0 10px rgba(255,214,107,.7)",
              zIndex: 5
            }}
          >
            ▣
          </div>
        )}
        {guards.map(g => (
          <div key={g.id} className={`mm-guard ${g.state === "chase" ? "chase" : ""}`} style={{ left: mp(g.x), top: mp(g.z) }} />
        ))}
        <div className="mm-player" style={{ left: mp(player.x), top: mp(player.z) }} />
        <div
          className="mm-exit"
          style={{
            left: "50%",
            top: mp(-38),
            background: hasKey ? "#3ee3a4" : "#ff5d79",
            boxShadow: hasKey ? "0 0 10px rgba(62,227,164,.7)" : "0 0 10px rgba(255,93,121,.7)"
          }}
        />
      </div>
      <div className="mm-label">{t.map} <b>{hasKey ? "KEY ✓" : "VAULT"}</b></div>
    </div>
  );
}

function BigMap({ guards, walls, doors, player, safe, hasKey, target, k, lang, t, onConfirm }) {
  const mp = v => `${clamp(((v + 42) / 84) * 100, 0, 100)}%`;
  const c = C[target] || C.blue;

  return (
    <div className="map-overlay" onClick={onConfirm}>
      <div className="map-panel" onClick={e => e.stopPropagation()}>
        <div className="map-head">
          <span>{t.target}: {lang === "zh" ? c.zh : c.en} · K={k}</span>
          <div className={`map-tgt class-${target}`}>
            <i style={{ background: c.hex, boxShadow: `0 0 14px ${c.hex}` }} />
            {lang === "zh" ? c.zh : c.en}
          </div>
        </div>

        <div className="map-board">
          <div className="map-house">
            {walls.map((w, i) => (
              <div key={i} className="map-wall" style={{ left: mp(w.x), top: mp(w.z), width: `${(w.w / 84) * 100}%`, height: `${(w.h / 84) * 100}%` }} />
            ))}
            {doors.map(d => (
              <div key={d.id} className="map-door-big" style={{ left: mp(d.x), top: mp(d.z), width: `${(d.w / 84) * 100}%`, height: `${(d.h / 84) * 100}%`, opacity: d.open ? 0.2 : 1 }} />
            ))}

            <div
              className="map-exit"
              style={{
                left: "50%",
                top: mp(-38),
                background: hasKey ? "rgba(62,227,164,.85)" : "rgba(255,93,121,.9)",
                borderColor: hasKey ? "#3ee3a4" : "#ff5d79",
                boxShadow: hasKey ? "0 0 14px rgba(62,227,164,.5)" : "0 0 14px rgba(255,93,121,.5)"
              }}
            >
              {hasKey ? "E" : "LOCK"}
            </div>
            <div className="map-ent" style={{ left: "50%", top: mp(38) }}>IN</div>

            {safe && !hasKey && (
              <div
                style={{
                  position: "absolute",
                  left: mp(safe.x),
                  top: mp(safe.z),
                  transform: "translate(-50%,-50%)",
                  minWidth: 34,
                  height: 26,
                  padding: "0 6px",
                  display: "grid",
                  placeItems: "center",
                  border: "1.5px solid #fff0a5",
                  borderRadius: 4,
                  background: "#b99a3f",
                  color: "#16150e",
                  fontSize: 8,
                  fontWeight: 900,
                  boxShadow: "0 0 16px rgba(255,214,107,.55)",
                  zIndex: 6
                }}
              >
                VAULT
              </div>
            )}

            {guards.map(g => (
              <div key={g.id} className={`map-guard ${g.state === "chase" ? "chase" : ""}`} style={{ left: mp(g.x), top: mp(g.z) }}>▲</div>
            ))}
            <div className="map-me" style={{ left: mp(player.x), top: mp(player.z) }} />
          </div>
        </div>

        <button className="map-confirm" onClick={onConfirm}>{t.confirm} ▶</button>
      </div>
    </div>
  );
}

export default function KNN({ onHome }) {
  const [lang, setLang] = useState("en");
  const t = T[lang];
  const [screen, setScreen] = useState("start");
  const [showBigMap, setShowBigMap] = useState(false);
  const [siteIdx, setSiteIdx] = useState(0);
  const [level, setLevel] = useState(null);
  const [phase, setPhase] = useState("vault");
  const [hasKey, setHasKey] = useState(false);
  const [showPuzzle, setShowPuzzle] = useState(false);
  const [puzzleData, setPuzzleData] = useState(null);
  const [selected, setSelected] = useState([]);
  const [inspectedId, setInspectedId] = useState(null);
  const [attempts, setAttempts] = useState(3);
  const [score, setScore] = useState(0);
  const [accuracyBonus, setAccuracyBonus] = useState(0);
  const [competitionFinal, setCompetitionFinal] = useState(null);
  const [armor, setArmor] = useState(MAX_ARMOR);
  const [toast, setToast] = useState(null);
  const [paused, setPaused] = useState(false);
  const [runReady, setRunReady] = useState(true);
  const [runLeft, setRunLeft] = useState(0);
  const [move, setMove] = useState({ x: 0, y: 0 });
  const [time, setTime] = useState(0);
  const music = true;
  const sfxOn = true;
  const [hurt, setHurt] = useState(0);
  const [canInteract, setCanInteract] = useState(false);
  const [resultType, setResultType] = useState("win");
  const inspectedPoint = puzzleData?.points.find(p => p.id === inspectedId) ?? null;

  const cvRef = useRef(null), stRef = useRef(null);
  const pRef = useRef({ x: 0, z: 42 });
  const levelRef = useRef(null);
  const itemsRef = useRef([]);
  const guardsRef = useRef([]);
  const doorsRef = useRef([]);
  const wallsRef = useRef([]);
  const moveRef = useRef({ x: 0, y: 0 });
  const pausedRef = useRef(false);
  const bigMapRef = useRef(false);
  const keysRef = useRef(new Set());
  const phaseRef = useRef("vault");
  const activeMsRef = useRef(0);
  const rafRef = useRef(0);
  const lastRef = useRef(0);
  const uiRef = useRef(0);
  const hurtRef = useRef(0);
  const armorRef = useRef(MAX_ARMOR);
  const doneRef = useRef(false);
  const hasKeyRef = useRef(false);
  const puzzleRef = useRef(false);
  const audioRef = useRef(null);
  const gainRef = useRef(null);
  const bgmRef = useRef(null);
  const runBufRef = useRef(0);
  const runCdRef = useRef(0);
  const runHeldRef = useRef(false);
  const runReadyRef = useRef(true);
  const gameScoreRef = useRef(0);
  const accuracyBonusRef = useRef(0);
  const accuracyAwardedLevelsRef = useRef(new Set());
  const competitionAttemptRef = useRef(null);
  const competitionFinalRef = useRef(null);

  const show = useCallback((txt, type = "info", ms = 900) => {
    const id = uid(); setToast({ id, txt, type });
    setTimeout(() => setToast(v => v?.id === id ? null : v), ms);
  }, []);

  const finalizeCompetition = useCallback(({
    outcome,
    gameScore: finalGameScore = gameScoreRef.current,
    accuracy: finalAccuracy = accuracyBonusRef.current,
    finalArmor = armorRef.current,
  }) => {
    if (competitionFinalRef.current || !competitionAttemptRef.current) {
      return competitionFinalRef.current;
    }

    const victory = outcome === "win";
    const completionBonus = victory ? 1000 + 50 * finalArmor : 0;
    const finalScore = calculateKnnCompetitionScore({
      gameScore: finalGameScore,
      accuracyBonus: finalAccuracy,
      victory,
      armor: finalArmor,
    });
    const result = competitionAttemptRef.current.finalize({
      playerSlot: "single",
      finalScore,
      outcome,
    });
    const snapshot = Object.freeze({
      ...result,
      gameScore: finalGameScore,
      accuracyBonus: finalAccuracy,
      armor: finalArmor,
      completionBonus,
    });

    competitionFinalRef.current = snapshot;
    setCompetitionFinal(snapshot);
    return snapshot;
  }, []);

  const ensureAudio = useCallback(() => {
    if (!sfxOn) return null;
    const Ac = window.AudioContext || window.webkitAudioContext;
    if (!Ac) return null;
    if (!audioRef.current) {
      const c = new Ac(), g = c.createGain();
      g.gain.value = .4; g.connect(c.destination);
      audioRef.current = c; gainRef.current = g;
    }
    if (audioRef.current.state === "suspended") audioRef.current.resume().catch(() => { });
    return audioRef.current;
  }, [sfxOn]);

  const tone = useCallback((f1, f2, dur, vol = .05, type = "sine", delay = 0) => {
    const c = ensureAudio(), m = gainRef.current;
    if (!c || !m || !sfxOn) return;
    const s = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f1, s);
    o.frequency.exponentialRampToValueAtTime(Math.max(25, f2), s + dur);
    g.gain.setValueAtTime(.0001, s);
    g.gain.exponentialRampToValueAtTime(vol, s + .012);
    g.gain.exponentialRampToValueAtTime(.0001, s + dur);
    o.connect(g); g.connect(m);
    o.start(s); o.stop(s + dur + .04);
  }, [ensureAudio, sfxOn]);

  const sfx = useCallback(name => {
    if (name === "pick") { tone(680, 1120, .09, .055, "triangle"); tone(1020, 1420, .07, .03, "sine", .05); }
    else if (name === "alert") { tone(220, 90, .22, .06, "sawtooth"); }
    else if (name === "hurt") { tone(300, 80, .25, .07, "square"); }
    else if (name === "run") { tone(180, 320, .12, .04, "triangle"); }
    else if (name === "door") { tone(150, 100, .1, .06, "square"); }
    else if (name === "clear") { [420, 620, 860, 1180].forEach((f, i) => tone(f, f * 1.04, .14, .035, "sine", i * .055)); }
    else if (name === "win") { [520, 660, 880, 1180, 1480].forEach((f, i) => tone(f, f * 1.05, .18, .04, "triangle", i * .08)); }
  }, [tone]);

  const ensureBgm = useCallback(() => {
    if (!bgmRef.current) {
      const base = import.meta.env.BASE_URL || "/";
      const a = new Audio(`${base}audio/KNN background music.mp3`);
      a.loop = true; a.preload = "auto"; a.volume = .32;
      bgmRef.current = a;
    }
    return bgmRef.current;
  }, []);

  const loadLevel = useCallback(idx => {
    const lv = buildLevel(idx);

    levelRef.current = lv;
    itemsRef.current = lv.items;
    guardsRef.current = lv.guards;
    wallsRef.current = lv.walls;
    doorsRef.current = lv.doors;
    pRef.current = { x: 0, z: 42 };

    phaseRef.current = "vault";
    hurtRef.current = 0;
    doneRef.current = false;
    hasKeyRef.current = false;
    puzzleRef.current = false;
    runBufRef.current = RUN_DUR;
    runCdRef.current = 0;
    runReadyRef.current = true;
    bigMapRef.current = true;

    setSiteIdx(idx);
    setLevel(lv);
    setPhase("vault");
    setHasKey(false);
    setShowPuzzle(false);
    setPuzzleData(null);
    setSelected([]);
    setInspectedId(null);
    setAttempts(3);
    setShowBigMap(true);
    setRunReady(true);
    setRunLeft(RUN_DUR);
    setCanInteract(false);
  }, []);

  const resetGame = useCallback(() => {
    competitionAttemptRef.current = createCompetitionAttempt("knn");
    competitionFinalRef.current = null;
    gameScoreRef.current = 0;
    accuracyBonusRef.current = 0;
    accuracyAwardedLevelsRef.current = new Set();
    setScore(0);
    setAccuracyBonus(0);
    setCompetitionFinal(null);
    setArmor(MAX_ARMOR); armorRef.current = MAX_ARMOR; setTime(0); setToast(null);
    setPaused(false); pausedRef.current = false; setHurt(0); setResultType("win");
    activeMsRef.current = 0;
    loadLevel(0);
  }, [loadLevel]);

  const startGame = useCallback(() => {
    resetGame(); setScreen("game"); ensureAudio();
    const b = ensureBgm();
    if (music) b.play().catch(() => { });
  }, [ensureAudio, ensureBgm, music, resetGame]);

  // Browser autoplay rules require a user gesture before sound can begin.
  // Any interaction on the KNN intro page unlocks the audio context/BGM.
  const unlockStartAudio = useCallback(() => {
    ensureAudio();
    const b = ensureBgm();
    if (music && b.paused) b.play().catch(() => { });
  }, [ensureAudio, ensureBgm, music]);

  // Return from the live mission to the KNN realm intro.
  // Starting again will reset the mission through startGame().
  const returnToIntro = useCallback(() => {
    runHeldRef.current = false;
    keysRef.current.clear();
    pausedRef.current = false;
    bigMapRef.current = false;
    puzzleRef.current = false;

    setMove({ x: 0, y: 0 });
    setPaused(false);
    setShowBigMap(false);
    setShowPuzzle(false);
    setSelected([]);
    setInspectedId(null);
    setCanInteract(false);
    setScreen("start");
  }, []);

  const doInteract = useCallback(() => {
    const p = pRef.current;
    const lv = levelRef.current;

    // 保险箱：靠近后按 F / 点击互动按钮进入 KNN 题目。
    if (
      lv?.safe &&
      !hasKeyRef.current &&
      Math.hypot(p.x - lv.safe.x, p.z - lv.safe.z) < 3
    ) {
      setPuzzleData(createKnnPuzzle(lv.tgt, lv.k, lv.puzzleN));
      setSelected([]);
      setInspectedId(null);
      setAttempts(3);
      setShowPuzzle(true);
      puzzleRef.current = true;
      runHeldRef.current = false;
      return;
    }

    // 普通门
    const door = doorsRef.current
      .map(d => ({ d, dist: pointRectDistance(p.x, p.z, d) }))
      .filter(x => x.dist < 2.7)
      .sort((a, b) => a.dist - b.dist)[0]?.d;

    if (!door) return;

    if (door.open) {
      const r = 1.25;
      const pIn =
        Math.abs(p.x - door.x) < door.w / 2 + r &&
        Math.abs(p.z - door.z) < door.h / 2 + r;
      const gIn = guardsRef.current.some(g =>
        Math.abs(g.x - door.x) < door.w / 2 + r &&
        Math.abs(g.z - door.z) < door.h / 2 + r
      );

      if (pIn || gIn) {
        show(t.blockedDoor, "warn", 700);
        return;
      }
    }

    door.open = !door.open;
    sfx("door");
  }, [sfx, show, t.blockedDoor]);

  const togglePuzzlePoint = useCallback(id => {
    const lv = levelRef.current;
    if (!lv) return;

    // Always measure the tapped dot, even when the answer already has K selections.
    // Measuring is free: only CONFIRM consumes an attempt if the answer is wrong.
    setInspectedId(id);
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= lv.k) return prev;
      return [...prev, id];
    });
  }, []);

  const submitPuzzle = useCallback(() => {
    const lv = levelRef.current;
    if (!lv || !puzzleData || hasKeyRef.current || competitionFinalRef.current) return;

    const answer = [...selected].sort().join(",");
    const correct = [...puzzleData.correct].sort().join(",");

    if (answer === correct) {
      let nextAccuracy = accuracyBonusRef.current;
      if (!accuracyAwardedLevelsRef.current.has(siteIdx)) {
        accuracyAwardedLevelsRef.current.add(siteIdx);
        const levelBonus = attempts === 3 ? 200 : attempts === 2 ? 100 : 0;
        nextAccuracy += levelBonus;
        accuracyBonusRef.current = nextAccuracy;
        setAccuracyBonus(nextAccuracy);
      }

      const nextGameScore = gameScoreRef.current + 500;
      gameScoreRef.current = nextGameScore;
      setScore(nextGameScore);
      setHasKey(true);
      hasKeyRef.current = true;
      phaseRef.current = "escape";
      setPhase("escape");
      setShowPuzzle(false);
      puzzleRef.current = false;
      sfx("clear");
      show(
        lang === "zh" ? "获得钥匙！出口已解锁" : "KEY ACQUIRED! EXIT UNLOCKED",
        "clear",
        1600
      );
      return;
    }

    const left = attempts - 1;
    setAttempts(left);
    setSelected([]);
    setInspectedId(null);

    if (left <= 0) {
      doneRef.current = true;
      runHeldRef.current = false;
      setTime(activeMsRef.current / 1000);
      setShowPuzzle(false);
      puzzleRef.current = false;
      finalizeCompetition({ outcome: "loss" });
      setResultType("lose");
      setScreen("result");
      bgmRef.current?.pause();
      return;
    }

    show(
      lang === "zh" ? `答案错误！剩余 ${left} 次机会` : `WRONG! ${left} ATTEMPTS LEFT`,
      "warn",
      1200
    );
  }, [attempts, finalizeCompetition, lang, puzzleData, selected, sfx, show, siteIdx]);

  useEffect(() => { moveRef.current = move; }, [move]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { bigMapRef.current = showBigMap; }, [showBigMap]);
  useEffect(() => { hasKeyRef.current = hasKey; }, [hasKey]);
  useEffect(() => { puzzleRef.current = showPuzzle; }, [showPuzzle]);

  useEffect(() => {
    if (screen !== "game") return;

    const dn = e => {
      const k = e.key.toLowerCase();

      if (puzzleRef.current) {
        if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", " ", "shift", "f"].includes(k)) {
          e.preventDefault();
        }
        return;
      }

      keysRef.current.add(k);
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", " ", "shift", "f"].includes(k)) {
        e.preventDefault();
      }
      if (k === "shift") runHeldRef.current = true;
      if (k === "m" && !bigMapRef.current) setShowBigMap(true);
      if (k === "escape" || k === "p") setPaused(v => !v);
      if (k === "f" || k === " ") doInteract();
    };

    const up = e => {
      const k = e.key.toLowerCase();
      keysRef.current.delete(k);
      if (k === "shift") runHeldRef.current = false;
    };

    window.addEventListener("keydown", dn, { passive: false });
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", dn);
      window.removeEventListener("keyup", up);
    };
  }, [screen, doInteract]);

  useEffect(() => {
    const b = ensureBgm();

    const shouldPlay =
      music &&
      (screen === "start" || (screen === "game" && !paused));

    if (shouldPlay) b.play().catch(() => { });
    else b.pause();
  }, [ensureBgm, music, paused, screen]);

  useEffect(() => () => { bgmRef.current?.pause(); audioRef.current?.close?.().catch(() => { }); }, []);

  useEffect(() => {
    if (screen !== "game") return;
    lastRef.current = performance.now();

    const finishMission = (type) => {
      if (doneRef.current) return;
      doneRef.current = true;
      runHeldRef.current = false;
      setResultType(type);
      setTime(activeMsRef.current / 1000);
      if (type === "lose") {
        finalizeCompetition({ outcome: "loss" });
        setTimeout(() => {
          setScreen("result");
          bgmRef.current?.pause();
        }, 260);
      }
    };

    const moveGuardToward = (g, goal, speed, dt, walls, doors, now, patrolMode = false) => {
      const navTarget = getGuardNavTarget(g, goal, walls, now);
      const dx = navTarget.x - g.x, dz = navTarget.z - g.z;
      const dist = Math.hypot(dx, dz);
      if (dist < .08) return 0;

      const targetAngle = Math.atan2(dz, dx);
      let da = targetAngle - g.angle;
      while (da > Math.PI) da -= Math.PI * 2;
      while (da < -Math.PI) da += Math.PI * 2;
      g.angle += da * Math.min(1, dt * (patrolMode ? 4.5 : 7));

      openNearbyGuardDoors(g, doors);
      const beforeX = g.x, beforeZ = g.z;
      const next = applyCollision(g.x, g.z, dx / dist, dz / dist, speed, dt, walls, doors, 1.05);
      g.x = next.x; g.z = next.z;
      const moved = Math.hypot(g.x - beforeX, g.z - beforeZ);
      g.stuck = moved < .006 ? (g.stuck || 0) + dt : 0;
      if (g.stuck > .75) {
        g.navPath = [];
        g.navAt = 0;
      }
      return moved;
    };

    const loop = now => {
      rafRef.current = requestAnimationFrame(loop);
      const dt = Math.min(.034, (now - lastRef.current) / 1000);
      lastRef.current = now;

      const st = stRef.current, cv = cvRef.current;
      if (!st || !cv) return;
      const rc = st.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const tw = Math.max(1, Math.floor(rc.width * dpr)), th = Math.max(1, Math.floor(rc.height * dpr));
      if (cv.width !== tw || cv.height !== th) {
        cv.width = tw; cv.height = th;
        cv.style.width = `${rc.width}px`; cv.style.height = `${rc.height}px`;
      }

      const p = pRef.current;
      const doors = doorsRef.current;
      const walls = wallsRef.current;
      const guards = guardsRef.current;

      // 暂停、看地图、或正在切关时：保留画面但不推进计时/AI。
      if (
  pausedRef.current ||
  bigMapRef.current ||
  puzzleRef.current ||
  doneRef.current
) {
        drawWorld(cv.getContext("2d"), {
          px: p.x, pz: p.z, guards, walls, doors,
          now, safe: levelRef.current?.safe, hasKey: hasKeyRef.current
        }, rc.width, rc.height, dpr);
        return;
      }

      activeMsRef.current += dt * 1000;

      let mx = 0, mz = 0;
      const k = keysRef.current;
      if (k.has("w") || k.has("arrowup")) mz -= 1;
      if (k.has("s") || k.has("arrowdown")) mz += 1;
      if (k.has("a") || k.has("arrowleft")) mx -= 1;
      if (k.has("d") || k.has("arrowright")) mx += 1;
      mx += moveRef.current.x; mz += moveRef.current.y;
      const mag = Math.hypot(mx, mz);
      const moving = mag > .1;

      let isRun = false;
      if (runHeldRef.current && moving && runBufRef.current > 0 && runCdRef.current <= 0) {
        isRun = true;
        runBufRef.current = Math.max(0, runBufRef.current - dt * 1000);
        if (runBufRef.current <= 0) {
          runCdRef.current = RUN_CD;
          runReadyRef.current = false;
        }
      } else {
        if (runCdRef.current > 0) {
          runCdRef.current = Math.max(0, runCdRef.current - dt * 1000);
          if (runCdRef.current <= 0) {
            runBufRef.current = RUN_DUR;
            runReadyRef.current = true;
          }
        }
        if (!runHeldRef.current && runCdRef.current <= 0 && runBufRef.current < RUN_DUR) {
          runBufRef.current = Math.min(RUN_DUR, runBufRef.current + dt * 1000 * .5);
        }
      }

      const spd = isRun ? RUN : WALK;
      if (moving) {
        const normX = mx / Math.max(mag, 1), normZ = mz / Math.max(mag, 1);
        const collisionWalls = hasKeyRef.current
          ? walls
          : [...walls, { x: 0, z: -38, w: 12, h: 1.6 }];

        const nextPos = applyCollision(
          p.x, p.z, normX, normZ, spd, dt, collisionWalls, doors
        );
        p.x = nextPos.x; p.z = nextPos.z;
      }

      for (const g of guards) {
        if (doneRef.current) break;
        const dx = p.x - g.x, dz = p.z - g.z;
        const dist = Math.hypot(dx, dz) || .001;
        const angTo = Math.atan2(dz, dx);
        const los = losClear(g.x, g.z, p.x, p.z, walls, doors);
        let dA = angTo - g.angle;
        while (dA > Math.PI) dA -= Math.PI * 2;
        while (dA < -Math.PI) dA += Math.PI * 2;
        const inCone = Math.abs(dA) < VIS_A / 2 && dist < VIS_R;
        const canSee = inCone && los;

        if (isRun && moving && dist < NOISE_R) {
          const noiseFactor = (NOISE_R - dist) / NOISE_R;
          g.detect = Math.min(1, g.detect + dt * noiseFactor * 3.5);
          if (g.state === "patrol" || g.state === "search") g.state = "suspicious";
          g.angle += dA * Math.min(1, dt * 8);
          if (g.detect >= 1 && !los) g.lastSeen = { x: p.x, z: p.z };
        }

        if (g.state === "patrol") {
          if (canSee) {
            const rate = moving ? (isRun ? 2.5 : 1.4) : .5;
            g.detect = Math.min(1, g.detect + dt * rate);
            if (g.detect >= 1) {
              g.state = "chase";
              g.alert = 8;
              g.lastSeen = { x: p.x, z: p.z };
              g.navPath = [];
              sfx("alert");
              show(t.caught, "warn", 900);
            } else if (g.detect > .4) {
              g.state = "suspicious";
            }
          } else {
            g.detect = Math.max(0, g.detect - dt * .6);
          }

          const wp = g.path[g.wp] || g.path[0];
          const wd = Math.hypot(wp.x - g.x, wp.z - g.z);
          if (wd < 1.1 || g.stuck > 1.5) {
            g.wp = (g.wp + 1) % g.path.length;
            g.navPath = [];
            g.navAt = 0;
            g.stuck = 0;
          } else {
            moveGuardToward(g, wp, 2.8 * g.spdMult, dt, walls, doors, now, true);
          }
        } else if (g.state === "suspicious") {
          let dA2 = angTo - g.angle;
          while (dA2 > Math.PI) dA2 -= Math.PI * 2;
          while (dA2 < -Math.PI) dA2 += Math.PI * 2;
          g.angle += dA2 * Math.min(1, dt * 5);
          if (canSee) {
            g.detect = Math.min(1, g.detect + dt * 1.8);
            if (g.detect >= 1) {
              g.state = "chase";
              g.alert = 8;
              g.lastSeen = { x: p.x, z: p.z };
              g.navPath = [];
              sfx("alert");
              show(t.caught, "warn", 900);
            }
          } else {
            g.detect = Math.max(0, g.detect - dt * .7);
            if (g.detect <= .15) {
              g.state = "patrol";
              g.navPath = [];
            }
          }
        } else if (g.state === "chase") {
          g.alert -= dt;
          if (canSee) {
            g.lastSeen = { x: p.x, z: p.z };
            g.alert = Math.max(g.alert, 4);
          } else {
            g.alert -= dt * 1.5;
          }

          const target = g.lastSeen || { x: p.x, z: p.z };
          moveGuardToward(g, target, 5.5 * g.spdMult, dt, walls, doors, now);

          if (g.alert <= 0) {
            g.state = "search";
            g.search = 6;
            g.detect = .5;
            g.navPath = [];
            show(t.lost, "info", 700);
          }

          if (dist < 1.8 && hurtRef.current <= 0 && !doneRef.current) {
            hurtRef.current = 2;
            armorRef.current = Math.max(0, armorRef.current - 1);
            setArmor(armorRef.current);

            const pushDist = Math.max(dist, .35);
            const pushed = applyCollision(
              p.x, p.z,
              -(dx / pushDist), -(dz / pushDist),
              2.5, 1, walls, doors
            );
            p.x = pushed.x; p.z = pushed.z;

            sfx("hurt");
            setHurt(1);
            setTimeout(() => setHurt(0), 200);
            show(t.caught, "warn", 1000);

            if (armorRef.current <= 0) {
              finishMission("lose");
              break;
            }
          }
        } else if (g.state === "search") {
          g.search -= dt;
          g.detect = Math.max(0, g.detect - dt * .3);
          const ls = g.lastSeen || { x: g.x, z: g.z };
          const dls = Math.hypot(ls.x - g.x, ls.z - g.z);
          if (dls > .8) {
            moveGuardToward(g, ls, 3 * g.spdMult, dt, walls, doors, now);
          } else {
            g.angle += dt * 1.5;
          }
          if (canSee) {
            g.state = "chase";
            g.alert = 8;
            g.lastSeen = { x: p.x, z: p.z };
            g.navPath = [];
          }
          if (g.search <= 0) {
            g.state = "patrol";
            g.detect = 0;
            g.navPath = [];
          }
        }

        openNearbyGuardDoors(g, doors);
      }

      hurtRef.current = Math.max(0, hurtRef.current - dt);

  

      if (
        hasKeyRef.current &&
        phaseRef.current === "escape" &&
        p.z < -37 &&
        Math.abs(p.x) < 6 &&
        !doneRef.current
      ) {
        doneRef.current = true;
        runHeldRef.current = false;
        sfx("win");
        const nextGameScore = gameScoreRef.current + 800;
        gameScoreRef.current = nextGameScore;
        setScore(nextGameScore);
        setTime(activeMsRef.current / 1000);
        const next = siteIdx + 1;
        if (next >= COMPETITION_LEVEL_COUNT) {
          finalizeCompetition({
            outcome: "win",
            gameScore: nextGameScore,
            accuracy: accuracyBonusRef.current,
            finalArmor: armorRef.current,
          });
        }
        setTimeout(() => {
          if (next >= COMPETITION_LEVEL_COUNT) {
            setResultType("win");
            setScreen("result");
            bgmRef.current?.pause();
          } else {
            loadLevel(next);
          }
        }, 500);
      }

      if (now - uiRef.current > 80) {
        uiRef.current = now;
        setTime(activeMsRef.current / 1000);
        setRunLeft(Math.round(runBufRef.current));
        setRunReady(runReadyRef.current);
        const lv = levelRef.current;
        const nearSafe =
          !!lv?.safe &&
          !hasKeyRef.current &&
          Math.hypot(p.x - lv.safe.x, p.z - lv.safe.z) < 3;
        const nearD = doors.some(d => pointRectDistance(p.x, p.z, d) < 2.7);
        setCanInteract(nearSafe || nearD);
      }

      drawWorld(cv.getContext("2d"), {
        px: p.x, pz: p.z, guards, walls, doors,
        now, safe: levelRef.current?.safe, hasKey: hasKeyRef.current
      }, rc.width, rc.height, dpr);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [screen, finalizeCompetition, loadLevel, sfx, show, siteIdx, t]);

  const liveCompetitionScore = calculateKnnCompetitionScore({
    gameScore: score,
    accuracyBonus,
    victory: false,
    armor,
  });
  const competitionScore = competitionFinal?.finalScore ?? liveCompetitionScore;
  const resultGameScore = competitionFinal?.gameScore ?? score;
  const resultAccuracyBonus = competitionFinal?.accuracyBonus ?? accuracyBonus;
  const resultCompletionBonus = competitionFinal?.completionBonus ?? 0;

  if (screen === "start") {
    return (
      <main className="start-screen knn-start-screen" onPointerDown={unlockStartAudio}>
        <div
          className="knn-start-bg"
          style={{ backgroundImage: `url(${backgroundImg})` }}
          aria-hidden="true"
        />
        <div className="knn-start-overlay" aria-hidden="true" />
        <div className="knn-start-stars" aria-hidden="true" />
        <div className="knn-start-vignette" aria-hidden="true" />

        <div className="knn-start-toolbar">
          <button onClick={() => setLang(v => v === "zh" ? "en" : "zh")}>
            {t.lang}
          </button>
        </div>

        <section className="knn-hero-layout">
          <div className="knn-hero-copy">
            <div className="knn-realm-chip">
              {lang === "zh" ? "分类 · 距离 · 潜行" : "CLASSIFY · DISTANCE · STEALTH"}
            </div>

            <span className="knn-kicker">MATH WEEK 2026 · KNN REALM</span>

            <h1 className="knn-main-title">
              <span>KNN</span>
              <strong>{lang === "zh" ? "潜行劫案" : "HEIST"}</strong>
            </h1>

            <h2>{t.sub}</h2>
            <p>{t.intro}</p>

            <button className="knn-start-btn" onClick={startGame}>
              <span>{t.start}</span>
              <b>✦</b>
            </button>

            <div className="knn-mission-strip-start">
              <div>
                <b>5</b>
                <span>{lang === "zh" ? "关卡" : "LEVELS"}</span>
              </div>
              <div>
                <b>K 3→7</b>
                <span>{lang === "zh" ? "逐关提升" : "PROGRESSION"}</span>
              </div>
              <div>
                <b>3</b>
                <span>{lang === "zh" ? "破解机会" : "ATTEMPTS"}</span>
              </div>
            </div>

            <div className="knn-start-foot">
              <span>WASD / JOYSTICK</span>
              <i />
              <span>F INTERACT</span>
              <i />
              <span>SHIFT RUN</span>
            </div>
          </div>

          <div className="knn-island-scene">
            <div className="knn-island-glow" aria-hidden="true" />
            <span className="knn-orbit knn-orbit-a" aria-hidden="true" />
            <span className="knn-orbit knn-orbit-b" aria-hidden="true" />
            <span className="knn-orbit knn-orbit-c" aria-hidden="true" />
            <span className="knn-spark spark-1" aria-hidden="true" />
            <span className="knn-spark spark-2" aria-hidden="true" />
            <span className="knn-spark spark-3" aria-hidden="true" />
            <span className="knn-spark spark-4" aria-hidden="true" />

            <img
              src={knnIslandImg}
              alt="KNN floating island"
              className="knn-island-img"
            />
          </div>
        </section>
      </main>
    );
  }
  if (screen === "result") {
    return (
      <main className="result-screen">
        <div className="start-vig" />
        <section className={`mission-result ${resultType === "lose" ? "failed" : ""}`}>
          <div className="result-sigil" aria-hidden="true">K</div>
          <span>{resultType === "lose" ? t.lose : t.win}</span>
          <h1>{competitionScore.toLocaleString()}</h1>
          <small>{t.finalScore}</small>
          <div className="knn-result-score-breakdown">
            <div><span>{t.score}</span><b>{resultGameScore.toLocaleString()}</b></div>
            <div><span>{t.accuracy}</span><b>+{resultAccuracyBonus.toLocaleString()}</b></div>
            <div><span>{t.completionBonus}</span><b>+{resultCompletionBonus.toLocaleString()}</b></div>
          </div>
          <div className="result-grid">
            <div><b>{Math.min(siteIdx + 1, COMPETITION_LEVEL_COUNT)}/{COMPETITION_LEVEL_COUNT}</b><span>ROOMS</span></div>
            <div><b>{time.toFixed(1)}s</b><span>TIME</span></div>
            <div><b>{armor}/{MAX_ARMOR}</b><span>{t.armor}</span></div>
          </div>
          <div className="result-actions">
            <button className="deploy-btn" onClick={onHome ?? startGame}><span>{t.replay}</span><b>↻</b></button>
            <button className="knn-result-intro-btn" onClick={onHome ?? returnToIntro}>
              <span>{lang === "zh" ? "返回任务入口" : "BACK TO BRIEFING"}</span>
              <b>↩</b>
            </button>
          </div>
        </section>
      </main>
    );
  }

  const lv = level;
  const c = lv ? C[lv.tgt] : null;

  return (
    <main className={`game ${hurt ? "hurt" : ""}`}>
      <section className="stage" ref={stRef}>
        <div className="stage-sky" aria-hidden="true" />
        <div className="stage-nebula" aria-hidden="true" />
        <div className="stage-clouds" aria-hidden="true" />
        <div className="floating-islands" aria-hidden="true">
          <div className="decor-island island-left">
            <span className="portal-core" />
            <span className="island-label">VAULT</span>
          </div>
          <div className="decor-island island-right">
            <span className="portal-core" />
            <span className="island-label">EXIT</span>
          </div>
          <div className="decor-island island-bottom">
            <span className="portal-core" />
            <span className="island-label">KNN</span>
          </div>
        </div>
        <div className="world-shell" aria-hidden="true" />
        <canvas ref={cvRef} className="world" />
        <header className="top-hud">
          <div className="hud-left">
            <div className="hud-logo"><span>K</span></div>
            <div className="hud-title"><b>{t.title}</b><span>HEIST</span></div>
          </div>
          <div className="hud-center">
            {c && (
              <div className={`target-pill class-${lv.tgt}`}>
                <span>{t.target}</span>
                <b><i style={{ background: c.hex, boxShadow: `0 0 12px ${c.hex}` }} />{lang === "zh" ? c.zh : c.en}</b>
                <em>K={lv.k}</em>
              </div>
            )}
          </div>
          <div className="hud-actions">
            <button
              className="knn-intro-return-btn"
              onClick={returnToIntro}
              aria-label={lang === "zh" ? "返回任务入口" : "Back to briefing"}
              title={lang === "zh" ? "返回任务入口" : "Back to briefing"}
            >
              <span>↩</span>
              <em>{lang === "zh" ? "入口" : "INTRO"}</em>
            </button>
            <button onClick={() => setLang(v => v === "zh" ? "en" : "zh")}>{t.lang}</button>
            <button onClick={() => setPaused(v => !v)}>{paused ? "▶" : "Ⅱ"}</button>
          </div>
        </header>

        <div className="mission-strip">
          <div><span>LEVEL</span><b>{siteIdx + 1}<i>/</i>{COMPETITION_LEVEL_COUNT}</b></div>
          <div><span>{t.k}</span><b>{lv?.k ?? 3}</b></div>
          <div className="knn-game-score-stat"><span>{t.score}</span><b>{score}</b></div>
          <div className="knn-accuracy-stat"><span>{t.accuracy}</span><b>+{accuracyBonus}</b></div>
          <div className="knn-competition-stat"><span>{t.competitionScore}</span><b>{competitionScore}</b></div>
          <div className="armor-stat"><span>{t.armor}</span><b>{Array.from({ length: MAX_ARMOR }, (_, i) => <i key={i} className={i < armor ? "alive" : ""} />)}</b></div>
        </div>

        <div className={`obj-card ${phase === "escape" ? "escape" : ""}`}>
          <span>{phase === "escape" ? t.escape : t.collect}</span>
          <b>{hasKey ? "🔑 KEY ACQUIRED" : "🔐 VAULT LOCKED"}</b>
          <small>
            {phase === "escape"
              ? (lang === "zh" ? "▲ 前往顶部出口" : "▲ HEAD TO THE TOP EXIT")
              : (lang === "zh" ? "▲ 找到保险箱并完成 KNN" : "▲ FIND THE VAULT AND SOLVE KNN")}
          </small>
        </div>

        <MiniMap
          guards={guardsRef.current}
          walls={wallsRef.current}
          doors={doorsRef.current}
          player={pRef.current}
          safe={lv?.safe}
          hasKey={hasKey}
          t={t}
          onClick={() => setShowBigMap(true)}
        />

        <TouchStick vector={move} onChange={setMove} />

        <div className="action-buttons">
          {canInteract && (
            <button className="interact-btn" onPointerDown={doInteract}>
              <i>▢</i><span>{t.interact}</span>
            </button>
          )}
          <button className={`run-btn ${runReady ? "ready" : "cooling"}`}
            onPointerDown={e => { e.stopPropagation(); runHeldRef.current = true; if (runReadyRef.current) sfx("run"); }}
            onPointerUp={() => { runHeldRef.current = false; }} onPointerCancel={() => { runHeldRef.current = false; }} onPointerLeave={() => { runHeldRef.current = false; }}>
            <i>»</i><span>{runReady ? t.run : `${Math.ceil(runLeft / 1000)}s`}</span>
            <b className="run-bar"><i style={{ width: `${(runReady ? runLeft / RUN_DUR : 0) * 100}%` }} /></b>
          </button>
        </div>

        <button className="map-btn" onClick={() => setShowBigMap(true)}>
          <i>▦</i><span>{t.map}</span>
        </button>

        {showPuzzle && puzzleData && lv && (
          <div className="knn-puzzle-overlay">
            <div className="knn-puzzle-panel">
              <div className="knn-puzzle-head">
                <div>
                  <small>KNN SECURITY SYSTEM</small>
                  <h2>
                    {lang === "zh"
                      ? `选择距离保险箱最近的 ${lv.k} 个${C[lv.tgt].zh}色点`
                      : `SELECT ${lv.k} NEAREST ${C[lv.tgt].en} POINTS`}
                  </h2>
                </div>
                <b>{lang === "zh" ? `机会 ${attempts}/3` : `TRIES ${attempts}/3`}</b>
              </div>

              <p className="knn-puzzle-help">
                {lang === "zh"
                  ? "点击任意彩色点即可测量它与中心 🔐 的距离；再次点击可取消选中。测量不会消耗机会。"
                  : "Tap any dot to measure its distance from the central 🔐. Tap again to deselect. Measuring costs no attempts."}
              </p>

              <div className="knn-puzzle-board">
                <div className="knn-board-orbit orbit-one" />
                <div className="knn-board-orbit orbit-two" />
                {inspectedPoint && (
                  <svg
                    className="knn-distance-line"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <line x1="50" y1="50" x2={inspectedPoint.x} y2={inspectedPoint.y} />
                  </svg>
                )}
                <div className="knn-query"><span>🔐</span></div>
                {puzzleData.points.map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    aria-label={`${lang === "zh" ? "点" : "Point"} ${i + 1}, ${lang === "zh" ? C[p.cls].zh : C[p.cls].en}`}
                    aria-pressed={selected.includes(p.id)}
                    className={`knn-point ${selected.includes(p.id) ? "selected" : ""} ${inspectedId === p.id ? "inspected" : ""}`}
                    style={{
                      left: `${p.x}%`,
                      top: `${p.y}%`,
                      background: C[p.cls].hex
                    }}
                    onClick={() => togglePuzzlePoint(p.id)}
                  />
                ))}
                {inspectedPoint && (
                  <div
                    className={`knn-distance-bubble ${inspectedPoint.y < 28 ? "below" : "above"}`}
                    style={{
                      left: `${clamp(inspectedPoint.x, 14, 86)}%`,
                      top: `${inspectedPoint.y}%`
                    }}
                    aria-hidden="true"
                  >
                    <span>{lang === "zh" ? "距离" : "DIST"}</span>
                    <strong>{formatKnnDistance(inspectedPoint)}</strong>
                  </div>
                )}
              </div>

              <div className="knn-distance-readout" role="status" aria-live="polite">
                {inspectedPoint ? (
                  <>
                    <div className="knn-readout-point">
                      <i style={{ background: C[inspectedPoint.cls].hex }} />
                      <span>
                        {lang === "zh" ? "当前测量" : "MEASURING"}
                        <b> P{Number(inspectedPoint.id.slice(1)) + 1} · {lang === "zh" ? C[inspectedPoint.cls].zh : C[inspectedPoint.cls].en}</b>
                      </span>
                    </div>
                    <strong>{formatKnnDistance(inspectedPoint)} <small>{lang === "zh" ? "单位" : "units"}</small></strong>
                  </>
                ) : (
                  <span className="knn-readout-placeholder">
                    {lang === "zh" ? "点击圆点，查看它到中心保险箱的距离" : "Select a dot to see its distance from the central vault"}
                  </span>
                )}
              </div>

              <div className="knn-selected-measurements">
                <span className="knn-measurements-label">
                  {lang === "zh" ? "已选点的距离（由近到远）" : "SELECTED DOT DISTANCES (NEAREST FIRST)"}
                </span>
                <div className="knn-measurements-list">
                  {selected.length ? (
                    puzzleData.points
                      .filter(p => selected.includes(p.id))
                      .sort((a, b) => getKnnDistance(a) - getKnnDistance(b))
                      .map(p => (
                        <span className="knn-measurement-chip" key={p.id}>
                          <i style={{ background: C[p.cls].hex }} />
                          P{Number(p.id.slice(1)) + 1}
                          <b>{formatKnnDistance(p)}</b>
                        </span>
                      ))
                  ) : (
                    <em>{lang === "zh" ? "尚未选择任何点" : "NO DOTS SELECTED"}</em>
                  )}
                </div>
              </div>

              <div className="knn-puzzle-bottom">
                <span>
                  {lang === "zh"
                    ? `已选择 ${selected.length}/${lv.k}`
                    : `SELECTED ${selected.length}/${lv.k}`}
                </span>
                <button
                  type="button"
                  disabled={selected.length !== lv.k}
                  onClick={submitPuzzle}
                >
                  {lang === "zh" ? "确认答案" : "CONFIRM"}
                </button>
              </div>
            </div>
          </div>
        )}
        {paused && (
          <div className="pause-overlay">
            <div><b>{t.paused}</b><button onClick={() => setPaused(false)}>{t.resume}</button></div>
          </div>
        )}
      </section>
      {showBigMap && lv && (
        <BigMap
          guards={guardsRef.current}
          walls={wallsRef.current}
          doors={doorsRef.current}
          player={pRef.current}
          safe={lv.safe}
          hasKey={hasKey}
          target={lv.tgt}
          k={lv.k}
          lang={lang}
          t={t}
          onConfirm={() => setShowBigMap(false)}
        />
      )}
    </main>
  );
}
