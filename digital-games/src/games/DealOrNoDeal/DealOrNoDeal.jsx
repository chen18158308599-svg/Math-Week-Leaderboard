import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./DealOrNoDeal.css";
import {
  calculateDealScore,
  createCompetitionAttempt,
} from "../../scoring/competitionScoring.js";

import homeBackground from "../../assets/home-layers/background.png";
import dealIsland from "../../assets/home-layers/deal.png";

const WORLD_W = 4800;
const WORLD_H = 3000;
const VIEW_W = 1600;
const VIEW_H = 900;

const START_COINS = 900;
const START_AMMO = 10;
const PLAYER_MAX_HP = 120;
const BEST_COINS_STORAGE_KEY = "high-seas-four-seas-best-coins-v1";

const AMMO_PACK_COST = 300;
const AMMO_PACK_SIZE = 5;
const REPAIR_COST = 420;
const REPAIR_AMOUNT = 35;

const PLAYER_SPEED = 185;
const PLAYER_BULLET_SPEED = 820;
const PLAYER_FIRE_COOLDOWN = 0.42;
const PLAYER_DAMAGE = 32;

// Failsafe: if there is no ammunition AND not enough money to buy it,
// use a slower, weaker emergency cannon. It never consumes coins.
// Regular purchased cannonballs remain significantly stronger.
const EMERGENCY_DAMAGE = 24;
const EMERGENCY_FIRE_COOLDOWN = 1.08;

const CHEST_RANGE = 125;
const BULLET_HIT_RANGE = 38;
const PIRATE_ACTIVATION_PADDING = 8;

const PIRATE_TYPES = {
  raider: {
    key: "raider",
    zh: "掠夺艇",
    en: "RAIDER",
    hp: 90,
    damage: 9,
    bounty: 170,
    bulletSpeed: 485,
    fireMin: 1.2,
    fireMax: 1.65,
    spread: 0.12,
    scale: 0.86,
  },
  corsair: {
    key: "corsair",
    zh: "海盗战舰",
    en: "CORSAIR",
    hp: 135,
    damage: 13,
    bounty: 230,
    bulletSpeed: 440,
    fireMin: 1.4,
    fireMax: 1.9,
    spread: 0.085,
    scale: 0.98,
  },
  gunship: {
    key: "gunship",
    zh: "炮击舰",
    en: "GUNSHIP",
    hp: 190,
    damage: 18,
    bounty: 340,
    bulletSpeed: 395,
    fireMin: 1.65,
    fireMax: 2.15,
    spread: 0.055,
    scale: 1.11,
  },
  dreadnought: {
    key: "dreadnought",
    zh: "无畏舰",
    en: "DREADNOUGHT",
    hp: 285,
    damage: 24,
    bounty: 520,
    bulletSpeed: 350,
    fireMin: 2.05,
    fireMax: 2.65,
    spread: 0.04,
    scale: 1.27,
  },
};

const COPY = {
  zh: {
    topEyebrow: "MATH WEEK 2026",
    title: "海上抉择",
    englishTitle: "DEAL OR NO DEAL",
    badge: "四片海域",
    intro: "开宝箱 · 击沉所有海盗",
    enter: "开始游戏",
    guide: "玩法",
    best: "最高金币",
    language: "中/EN",
    mission: "击沉进度",
    coins: "金币",
    ammo: "炮弹",
    pirates: "击沉",
    hull: "船体",
    competitionScore: "积分",
    finalScore: "竞赛得分",
    buyAmmo: "+5 炮弹",
    buyAmmoCost: "◈300",
    repair: "+35 HP",
    repairCost: "◈420",
    repairFull: "血量已满",
    repairBought: "修复",
    repairNoMoney: "金币不足",
    fire: "开炮",
    fireLocked: "靠近海盗",
    inspect: "开宝箱",
    chestCost: "开箱",
    possibleRewards: "宝箱奖励",
    oneOfThree: "随机获得其中一项",
    openChest: "开箱",
    leaveChest: "跳过",
    continueSailing: "继续航行",
    chestOpened: "开箱结果",
    reward: "获得",
    netGain: "净赚",
    netLoss: "净亏",
    notEnough: "金币不足",
    warningMessage: "危险海域",
    noAmmo: "补充炮弹",
    emergencyActive: "⚡ 免费火炮",
    emergencyLabel: "免费开炮",
    emergencyInfo: "免费 · 低伤害",
    ammoBought: "+5 炮弹",
    ammoNoMoney: "金币不足",
    pirateDown: "击沉",
    bounty: "赏金",
    controls: "摇杆航行",
    keyboard: "WASD · SPACE · E · Q · H",
    map: "海图",
    safeRoute: "安全航道",
    victory: "挑战成功",
    defeat: "船已沉没",
    retry: "再来一次",
    backIntro: "返回",
    leaveTitle: "结束航行？",
    stay: "继续",
    leave: "退出",
    howTo: "玩法一览",
    step1: "航行",
    step1Text: "摇杆 / WASD",
    step2: "开宝箱",
    step2Text: "付金币，随机得一项奖励",
    step3: "开炮",
    step3Text: "靠近海盗，按键开炮",
    step4: "免费应急炮",
    step4Text: "没钱又没炮弹时可免费开炮",
    step5: "补给 / 修复",
    step5Text: "◈300 买 5 弹 · ◈420 修 35 HP",
  },
  en: {
    topEyebrow: "MATH WEEK 2026",
    title: "High Seas",
    englishTitle: "DEAL OR NO DEAL",
    badge: "FOUR SEAS",
    intro: "Open chests · Sink all pirates",
    enter: "PLAY NOW",
    guide: "HOW TO PLAY",
    best: "BEST COINS",
    language: "中/EN",
    mission: "SUNK",
    coins: "COINS",
    ammo: "AMMO",
    pirates: "SUNK",
    hull: "HULL",
    competitionScore: "SCORE",
    finalScore: "FINAL SCORE",
    buyAmmo: "+5 AMMO",
    buyAmmoCost: "◈300",
    repair: "+35 HP",
    repairCost: "◈420",
    repairFull: "Full HP",
    repairBought: "Repaired",
    repairNoMoney: "Not enough coins",
    fire: "FIRE",
    fireLocked: "Find pirates",
    inspect: "OPEN CHEST",
    chestCost: "COST",
    possibleRewards: "POSSIBLE LOOT",
    oneOfThree: "ONE RANDOM REWARD",
    openChest: "OPEN",
    leaveChest: "SKIP",
    continueSailing: "CONTINUE",
    chestOpened: "CHEST OPENED",
    reward: "WON",
    netGain: "PROFIT",
    netLoss: "LOSS",
    notEnough: "Not enough coins",
    warningMessage: "HOSTILE WATERS",
    noAmmo: "Buy ammo",
    emergencyActive: "⚡ Free cannon",
    emergencyLabel: "FREE FIRE",
    emergencyInfo: "FREE · LOW POWER",
    ammoBought: "+5 AMMO",
    ammoNoMoney: "Not enough coins",
    pirateDown: "SUNK",
    bounty: "BOUNTY",
    controls: "Sail with joystick",
    keyboard: "WASD · SPACE · E · Q · H",
    map: "MAP",
    safeRoute: "SAFE ROUTE",
    victory: "VICTORY",
    defeat: "SHIP SUNK",
    retry: "PLAY AGAIN",
    backIntro: "BACK",
    leaveTitle: "End voyage?",
    stay: "STAY",
    leave: "EXIT",
    howTo: "HOW TO PLAY",
    step1: "SAIL",
    step1Text: "Joystick / WASD",
    step2: "CHESTS",
    step2Text: "Pay coins for 1 random reward",
    step3: "FIRE",
    step3Text: "Auto-aim · press to fire",
    step4: "FREE CANNON",
    step4Text: "Free fire when out of ammo & coins",
    step5: "SUPPLY / REPAIR",
    step5Text: "◈300: 5 ammo · ◈420: 35 HP",
  },
};

const SEA_REGIONS = [
  {
    id: "crimson",
    x: 1050,
    y: 700,
    radius: 430,
    zh: "赤礁海域",
    en: "CRIMSON REEF",
    maxAttackers: 1,
  },
  {
    id: "blackwater",
    x: 2650,
    y: 650,
    radius: 460,
    zh: "黑潮海域",
    en: "BLACKWATER",
    maxAttackers: 2,
  },
  {
    id: "ghost",
    x: 1750,
    y: 2200,
    radius: 450,
    zh: "幽灵浅滩",
    en: "GHOST SHOAL",
    maxAttackers: 2,
  },
  {
    id: "iron",
    x: 3800,
    y: 1200,
    radius: 500,
    zh: "铁牙海峡",
    en: "IRON FANG",
    maxAttackers: 2,
  },
  {
    id: "storm",
    x: 3450,
    y: 2450,
    radius: 480,
    zh: "风暴坟场",
    en: "STORM GRAVE",
    maxAttackers: 3,
  },
];

const CHEST_LAYOUT = [
  { id: 1, x: 520, y: 480, cost: 180, options: [70, 260, 520] },
  { id: 2, x: 520, y: 2500, cost: 260, options: [100, 420, 700] },
  { id: 3, x: 1550, y: 1200, cost: 340, options: [140, 560, 900] },
  { id: 4, x: 1850, y: 350, cost: 420, options: [180, 690, 1120] },
  { id: 5, x: 2500, y: 1600, cost: 500, options: [220, 830, 1320] },
  { id: 6, x: 3150, y: 380, cost: 560, options: [260, 960, 1480] },
  { id: 7, x: 4450, y: 520, cost: 620, options: [300, 1100, 1680] },
  { id: 8, x: 4500, y: 1800, cost: 700, options: [340, 1250, 1880] },
  { id: 9, x: 2800, y: 2800, cost: 780, options: [390, 1420, 2150] },
  { id: 10, x: 980, y: 1900, cost: 620, options: [310, 1100, 1700] },
  { id: 11, x: 4050, y: 2880, cost: 860, options: [430, 1550, 2380] },
  { id: 12, x: 2300, y: 2800, cost: 720, options: [360, 1280, 1980] },
];

const PIRATE_LAYOUT = [
  { id: 1, regionId: "crimson", type: "raider", baseX: 920, baseY: 610, patrolRadius: 70, patrolSpeed: 0.52, phase: 0.2 },
  { id: 2, regionId: "crimson", type: "raider", baseX: 1120, baseY: 735, patrolRadius: 78, patrolSpeed: 0.46, phase: 2.1 },
  { id: 3, regionId: "crimson", type: "corsair", baseX: 1085, baseY: 535, patrolRadius: 66, patrolSpeed: 0.37, phase: 4.0 },

  { id: 4, regionId: "blackwater", type: "raider", baseX: 2475, baseY: 585, patrolRadius: 75, patrolSpeed: 0.49, phase: 0.7 },
  { id: 5, regionId: "blackwater", type: "corsair", baseX: 2760, baseY: 560, patrolRadius: 84, patrolSpeed: 0.37, phase: 2.7 },
  { id: 6, regionId: "blackwater", type: "gunship", baseX: 2640, baseY: 790, patrolRadius: 68, patrolSpeed: 0.29, phase: 4.5 },

  { id: 7, regionId: "ghost", type: "corsair", baseX: 1575, baseY: 2130, patrolRadius: 82, patrolSpeed: 0.4, phase: 0.9 },
  { id: 8, regionId: "ghost", type: "corsair", baseX: 1860, baseY: 2090, patrolRadius: 75, patrolSpeed: 0.35, phase: 2.8 },
  { id: 9, regionId: "ghost", type: "gunship", baseX: 1770, baseY: 2350, patrolRadius: 66, patrolSpeed: 0.27, phase: 4.7 },

  { id: 10, regionId: "iron", type: "corsair", baseX: 3590, baseY: 1100, patrolRadius: 84, patrolSpeed: 0.38, phase: 0.3 },
  { id: 11, regionId: "iron", type: "gunship", baseX: 3930, baseY: 1050, patrolRadius: 72, patrolSpeed: 0.3, phase: 2.3 },
  { id: 12, regionId: "iron", type: "dreadnought", baseX: 3830, baseY: 1380, patrolRadius: 58, patrolSpeed: 0.21, phase: 4.3 },

  { id: 13, regionId: "storm", type: "gunship", baseX: 3260, baseY: 2350, patrolRadius: 76, patrolSpeed: 0.31, phase: 0.8 },
  { id: 14, regionId: "storm", type: "dreadnought", baseX: 3580, baseY: 2300, patrolRadius: 62, patrolSpeed: 0.22, phase: 2.8 },
  { id: 15, regionId: "storm", type: "dreadnought", baseX: 3480, baseY: 2640, patrolRadius: 64, patrolSpeed: 0.2, phase: 4.8 },
];

// Activate four seas and only the pirate ships located inside them.
// The fifth predefined sea remains disabled until a future expansion.
const ACTIVE_SEA_REGIONS = SEA_REGIONS.slice(0, 4);
const ACTIVE_PIRATE_LAYOUT = PIRATE_LAYOUT.filter((pirate) =>
  ACTIVE_SEA_REGIONS.some((region) => region.id === pirate.regionId)
);

const MAP_DECOR = [
  { id: "reef-a", x: 180, y: 250, size: 155 },
  { id: "reef-b", x: 760, y: 1320, size: 180 },
  { id: "reef-c", x: 1460, y: 520, size: 118 },
  { id: "reef-d", x: 2240, y: 1180, size: 145 },
  { id: "reef-e", x: 3050, y: 1050, size: 165 },
  { id: "reef-f", x: 4600, y: 1280, size: 160 },
  { id: "reef-g", x: 4200, y: 2460, size: 120 },
  { id: "reef-h", x: 2500, y: 2450, size: 150 },
  { id: "reef-i", x: 1200, y: 2860, size: 132 },
  { id: "reef-j", x: 320, y: 1780, size: 116 },
  { id: "reef-k", x: 2100, y: 2920, size: 92 },
  { id: "reef-l", x: 3600, y: 250, size: 130 },
  { id: "reef-m", x: 4680, y: 2850, size: 105 },
  { id: "reef-n", x: 930, y: 2100, size: 95 },
  { id: "reef-o", x: 2850, y: 1880, size: 118 },
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const toDeg = (radians) => (radians * 180) / Math.PI;

function regionById(id) {
  return SEA_REGIONS.find((region) => region.id === id) ?? null;
}

function randomCooldown(type) {
  return type.fireMin + Math.random() * (type.fireMax - type.fireMin);
}

function createGame() {
  return {
    status: "playing",
    player: {
      x: 250,
      y: 1500,
      angle: 90,
      hp: PLAYER_MAX_HP,
      maxHp: PLAYER_MAX_HP,
      coins: START_COINS,
      ammo: START_AMMO,
      shotCooldown: 0,
      invuln: 0,
    },
    chests: CHEST_LAYOUT.map((chest) => ({
      ...chest,
      reward: chest.options[Math.floor(Math.random() * chest.options.length)],
      opened: false,
    })),
    pirates: ACTIVE_PIRATE_LAYOUT.map((pirate) => {
      const type = PIRATE_TYPES[pirate.type];
      const x = pirate.baseX + Math.cos(pirate.phase) * pirate.patrolRadius;
      const y = pirate.baseY + Math.sin(pirate.phase) * pirate.patrolRadius;
      return {
        ...pirate,
        x,
        y,
        hp: type.hp,
        maxHp: type.hp,
        damage: type.damage,
        bounty: type.bounty,
        bulletSpeed: type.bulletSpeed,
        angle: 0,
        fireCooldown: randomCooldown(type) * (0.55 + Math.random() * 0.4),
        sunk: false,
        active: false,
        hitFlash: 0,
      };
    }),
    bullets: [],
    effects: [],
    sunkCount: 0,
    message: "",
    messageTone: "neutral",
    messageTimer: 0,
  };
}

function readBest() {
  try {
    return Number(localStorage.getItem(BEST_COINS_STORAGE_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    localStorage.setItem(BEST_COINS_STORAGE_KEY, String(value));
  } catch {
    // localStorage is optional.
  }
}

function ShipGraphic({ pirate = false, type = "player" }) {
  const typeClass = pirate ? `type-${type}` : "type-player";

  return (
    <svg className={`hs4-ship-svg ${typeClass}`} viewBox="0 0 100 140" aria-hidden="true">
      <path className="hs4-ship-wake" d="M22 108 Q50 138 78 108 Q67 131 50 139 Q33 131 22 108Z" />
      <path className="hs4-ship-shadow" d="M19 77 L81 77 L70 122 Q50 136 30 122Z" />
      <path className="hs4-ship-hull" d="M21 70 L79 70 L68 119 Q50 132 32 119Z" />
      <path className="hs4-ship-rim" d="M27 77 Q50 85 73 77" />
      <path className="hs4-ship-mast" d="M50 21 L50 94" />
      <path className="hs4-ship-sail-main" d="M46 27 L46 68 L15 61 Q27 38 46 27Z" />
      <path className="hs4-ship-sail-side" d="M54 33 L54 68 L83 61 Q72 42 54 33Z" />
      <path className="hs4-ship-flag" d="M50 21 L50 9 L75 16 L50 22Z" />
      <circle className="hs4-cannon-port port-a" cx="28" cy="87" r="2.5" />
      <circle className="hs4-cannon-port port-b" cx="72" cy="87" r="2.5" />

      {pirate && (
        <>
          <circle className="hs4-skull-eye" cx="39" cy="50" r="2.7" />
          <circle className="hs4-skull-eye" cx="45" cy="50" r="2.7" />
          <path className="hs4-skull-mark" d="M36 55 Q42 60 48 55 M38 59 L46 44" />
          {(type === "gunship" || type === "dreadnought") && (
            <>
              <path className="hs4-heavy-cannon left" d="M21 83 L7 88 L20 91" />
              <path className="hs4-heavy-cannon right" d="M79 83 L93 88 L80 91" />
            </>
          )}
          {type === "dreadnought" && <path className="hs4-armour-mark" d="M28 100 L72 100 M31 108 L69 108" />}
        </>
      )}
    </svg>
  );
}

function ChestGraphic({ opened = false }) {
  return (
    <div className={`hs4-chest ${opened ? "is-open" : ""}`} aria-hidden="true">
      <span className="hs4-chest-glow" />
      <span className="hs4-chest-lid" />
      <span className="hs4-chest-body" />
      <span className="hs4-chest-band left" />
      <span className="hs4-chest-band right" />
      <span className="hs4-chest-lock">◆</span>
    </div>
  );
}

export default function DealOrNoDeal({ onBack }) {
  const [language, setLanguage] = useState("en");

  const [view, setView] = useState("entry");
  const [game, setGame] = useState(createGame);
  const [showRules, setShowRules] = useState(false);
  const [showLeave, setShowLeave] = useState(false);
  const [chestDialog, setChestDialog] = useState(null);
  const [chestResult, setChestResult] = useState(null);
  const [bestCoins, setBestCoins] = useState(readBest);
  const [joystickVisual, setJoystickVisual] = useState({ x: 0, y: 0 });
  const [competitionFinal, setCompetitionFinal] = useState(null);

  const joystickRef = useRef({ x: 0, y: 0, active: false, pointerId: null });
  const keysRef = useRef(new Set());
  const bulletIdRef = useRef(1);
  const effectIdRef = useRef(1);
  const competitionAttemptRef = useRef(null);
  const competitionFinalRef = useRef(null);

  const t = COPY[language];

  useEffect(() => {
    try {
      localStorage.setItem("high-seas-language-v4", language);
    } catch {
      // localStorage is optional.
    }
  }, [language]);

  const resetControls = useCallback(() => {
    keysRef.current.clear();
    joystickRef.current = { x: 0, y: 0, active: false, pointerId: null };
    setJoystickVisual({ x: 0, y: 0 });
  }, []);

  const startGame = useCallback(() => {
    bulletIdRef.current = 1;
    effectIdRef.current = 1;
    competitionAttemptRef.current = createCompetitionAttempt("deal-or-no-deal");
    competitionFinalRef.current = null;
    setCompetitionFinal(null);
    resetControls();
    setGame(createGame());
    setChestDialog(null);
    setChestResult(null);
    setShowLeave(false);
    setShowRules(false);
    setView("game");
  }, [resetControls]);

  const returnToLobby = useCallback(() => {
    if (typeof onBack === "function") {
      onBack();
      return;
    }
    if (window.history.length > 1) window.history.back();
  }, [onBack]);

  const camera = useMemo(
    () => ({
      x: clamp(game.player.x - VIEW_W / 2, 0, WORLD_W - VIEW_W),
      y: clamp(game.player.y - VIEW_H / 2, 0, WORLD_H - VIEW_H),
    }),
    [game.player.x, game.player.y]
  );

  const worldStyle = useCallback(
    (x, y) => ({
      left: `${((x - camera.x) / VIEW_W) * 100}%`,
      top: `${((y - camera.y) / VIEW_H) * 100}%`,
    }),
    [camera]
  );

  const activeRegionIds = useMemo(
    () =>
      ACTIVE_SEA_REGIONS.filter(
        (region) => distance(game.player, region) <= region.radius + PIRATE_ACTIVATION_PADDING
      ).map((region) => region.id),
    [game.player]
  );

  const activeRegion = useMemo(
    () => ACTIVE_SEA_REGIONS.find((region) => activeRegionIds.includes(region.id)) ?? null,
    [activeRegionIds]
  );

  const combatTargets = useMemo(
    () =>
      game.pirates
        .filter((pirate) => !pirate.sunk && activeRegionIds.includes(pirate.regionId))
        .sort((a, b) => distance(game.player, a) - distance(game.player, b)),
    [activeRegionIds, game.pirates, game.player]
  );

  const currentTargetId = combatTargets[0]?.id ?? null;

  const nearestChest = useMemo(() => {
    if (view !== "game" || game.status !== "playing") return null;

    let nearest = null;
    let nearestDistance = Infinity;

    game.chests.forEach((chest) => {
      if (chest.opened) return;
      const d = distance(game.player, chest);
      if (d < CHEST_RANGE && d < nearestDistance) {
        nearest = chest;
        nearestDistance = d;
      }
    });

    return nearest;
  }, [game.chests, game.player, game.status, view]);

  const selectedChest = useMemo(
    () =>
      chestDialog == null
        ? null
        : game.chests.find((chest) => chest.id === chestDialog) ?? null,
    [chestDialog, game.chests]
  );

  const inspectChest = useCallback(() => {
    if (!nearestChest) return;
    resetControls();
    setChestResult(null);
    setChestDialog(nearestChest.id);
  }, [nearestChest, resetControls]);

  const openChest = useCallback(() => {
    if (!selectedChest || selectedChest.opened || chestResult) return;

    if (game.player.coins < selectedChest.cost) {
      setGame((prev) => ({
        ...prev,
        message: t.notEnough,
        messageTone: "danger",
        messageTimer: 2.2,
      }));
      return;
    }

    setGame((prev) => {
      const net = selectedChest.reward - selectedChest.cost;

      return {
        ...prev,
        chests: prev.chests.map((chest) =>
          chest.id === selectedChest.id ? { ...chest, opened: true } : chest
        ),
        player: {
          ...prev.player,
          coins: prev.player.coins - selectedChest.cost + selectedChest.reward,
        },
        message: net >= 0 ? `◈ +${net}` : `◈ ${net}`,
        messageTone: net >= 0 ? "success" : "danger",
        messageTimer: 2.4,
        effects: [
          ...prev.effects,
          {
            id: effectIdRef.current++,
            type: "chest",
            x: selectedChest.x,
            y: selectedChest.y,
            ttl: 0.8,
            maxTtl: 0.8,
          },
        ],
      };
    });

    const net = selectedChest.reward - selectedChest.cost;
    setChestResult({ reward: selectedChest.reward, cost: selectedChest.cost, net });
  }, [chestResult, game.player.coins, selectedChest, t.netGain, t.netLoss, t.notEnough]);

  const closeChestDialog = useCallback(() => {
    setChestDialog(null);
    setChestResult(null);
    resetControls();
  }, [resetControls]);

  const buyAmmo = useCallback(() => {
    setGame((prev) => {
      if (prev.status !== "playing") return prev;

      if (prev.player.coins < AMMO_PACK_COST) {
        return {
          ...prev,
          message: prev.player.ammo === 0 ? t.emergencyActive : t.ammoNoMoney,
          messageTone: prev.player.ammo === 0 ? "warning" : "danger",
          messageTimer: 2.2,
        };
      }

      return {
        ...prev,
        player: {
          ...prev.player,
          coins: prev.player.coins - AMMO_PACK_COST,
          ammo: prev.player.ammo + AMMO_PACK_SIZE,
        },
        message: t.ammoBought,
        messageTone: "success",
        messageTimer: 2.2,
      };
    });
  }, [t.ammoBought, t.ammoNoMoney]);

  const repairHull = useCallback(() => {
    setGame((prev) => {
      if (prev.status !== "playing") return prev;

      if (prev.player.hp >= prev.player.maxHp) {
        return {
          ...prev,
          message: t.repairFull,
          messageTone: "neutral",
          messageTimer: 1.8,
        };
      }

      if (prev.player.coins < REPAIR_COST) {
        return {
          ...prev,
          message: t.repairNoMoney,
          messageTone: "danger",
          messageTimer: 2.2,
        };
      }

      const healed = Math.min(REPAIR_AMOUNT, prev.player.maxHp - prev.player.hp);

      return {
        ...prev,
        player: {
          ...prev.player,
          coins: prev.player.coins - REPAIR_COST,
          hp: Math.min(prev.player.maxHp, prev.player.hp + REPAIR_AMOUNT),
        },
        message: `✚ +${healed} HP`,
        messageTone: "success",
        messageTimer: 2.2,
        effects: [
          ...prev.effects,
          {
            id: effectIdRef.current++,
            type: "repair",
            x: prev.player.x,
            y: prev.player.y,
            ttl: 0.8,
            maxTtl: 0.8,
          },
        ],
      };
    });
  }, [t.repairBought, t.repairFull, t.repairNoMoney]);

  const shoot = useCallback(() => {
    if (chestDialog || showLeave || showRules) return;

    setGame((prev) => {
      if (prev.status !== "playing" || prev.player.shotCooldown > 0) return prev;

      const regionIds = ACTIVE_SEA_REGIONS.filter(
        (region) => distance(prev.player, region) <= region.radius + PIRATE_ACTIVATION_PADDING
      ).map((region) => region.id);

      const targets = prev.pirates
        .filter((pirate) => !pirate.sunk && regionIds.includes(pirate.regionId))
        .sort((a, b) => distance(prev.player, a) - distance(prev.player, b));

      if (!targets.length) {
        return {
          ...prev,
          message: t.fireLocked,
          messageTone: "warning",
          messageTimer: 1.5,
        };
      }

      // Never trap a player with no money and no ammunition.
      // Emergency rounds cost nothing but are weaker and fire more slowly.
      const emergency = prev.player.ammo <= 0 && prev.player.coins < AMMO_PACK_COST;
      if (prev.player.ammo <= 0 && !emergency) {
        return {
          ...prev,
          message: t.noAmmo,
          messageTone: "warning",
          messageTimer: 2,
        };
      }

      const target = targets[0];
      const fireAngle = Math.atan2(target.y - prev.player.y, target.x - prev.player.x);
      const muzzleX = prev.player.x + Math.cos(fireAngle) * 50;
      const muzzleY = prev.player.y + Math.sin(fireAngle) * 50;

      return {
        ...prev,
        player: {
          ...prev.player,
          ammo: emergency ? 0 : prev.player.ammo - 1,
          shotCooldown: emergency ? EMERGENCY_FIRE_COOLDOWN : PLAYER_FIRE_COOLDOWN,
        },
        bullets: [
          ...prev.bullets,
          {
            id: bulletIdRef.current++,
            owner: "player",
            regionId: target.regionId,
            targetId: target.id,
            damage: emergency ? EMERGENCY_DAMAGE : PLAYER_DAMAGE,
            emergency,
            x: muzzleX,
            y: muzzleY,
            vx: Math.cos(fireAngle) * PLAYER_BULLET_SPEED,
            vy: Math.sin(fireAngle) * PLAYER_BULLET_SPEED,
            ttl: 1.75,
          },
        ],
        effects: [
          ...prev.effects,
          {
            id: effectIdRef.current++,
            type: "muzzle-player",
            x: muzzleX,
            y: muzzleY,
            ttl: 0.2,
            maxTtl: 0.2,
          },
        ],
        message: "",
        messageTone: "neutral",
        messageTimer: 0,
      };
    });
  }, [chestDialog, showLeave, showRules, t.fireLocked, t.noAmmo]);

  useEffect(() => {
    const onKeyDown = (event) => {
      const key = event.key.toLowerCase();
      keysRef.current.add(key);

      if (
        view !== "game" ||
        game.status !== "playing" ||
        chestDialog ||
        showLeave ||
        showRules
      ) {
        return;
      }

      if (event.code === "Space" && !event.repeat) {
        event.preventDefault();
        shoot();
      }

      if (key === "e" && !event.repeat) inspectChest();
      if (key === "q" && !event.repeat) buyAmmo();
      if (key === "h" && !event.repeat) repairHull();
    };

    const onKeyUp = (event) => {
      keysRef.current.delete(event.key.toLowerCase());
    };

    const onBlur = () => resetControls();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [
    buyAmmo,
    chestDialog,
    game.status,
    inspectChest,
    repairHull,
    resetControls,
    shoot,
    showLeave,
    showRules,
    view,
  ]);

  useEffect(() => {
    if (
      view !== "game" ||
      game.status !== "playing" ||
      chestDialog ||
      showLeave ||
      showRules
    ) {
      return undefined;
    }

    let last = performance.now();

    const timer = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      setGame((prev) => {
        if (prev.status !== "playing") return prev;

        const keys = keysRef.current;
        const keyX =
          (keys.has("d") || keys.has("arrowright") ? 1 : 0) -
          (keys.has("a") || keys.has("arrowleft") ? 1 : 0);
        const keyY =
          (keys.has("s") || keys.has("arrowdown") ? 1 : 0) -
          (keys.has("w") || keys.has("arrowup") ? 1 : 0);

        let moveX = joystickRef.current.x + keyX;
        let moveY = joystickRef.current.y + keyY;
        const moveLength = Math.hypot(moveX, moveY);

        if (moveLength > 1) {
          moveX /= moveLength;
          moveY /= moveLength;
        }

        let player = {
          ...prev.player,
          shotCooldown: Math.max(0, prev.player.shotCooldown - dt),
          invuln: Math.max(0, prev.player.invuln - dt),
        };

        if (Math.hypot(moveX, moveY) > 0.05) {
          player.x = clamp(player.x + moveX * PLAYER_SPEED * dt, 55, WORLD_W - 55);
          player.y = clamp(player.y + moveY * PLAYER_SPEED * dt, 60, WORLD_H - 60);
          player.angle = toDeg(Math.atan2(moveY, moveX)) + 90;
        }

        const activeRegionsNow = ACTIVE_SEA_REGIONS.filter(
          (region) => distance(player, region) <= region.radius + PIRATE_ACTIVATION_PADDING
        );
        const regionIdsNow = activeRegionsNow.map((region) => region.id);

        let pirates = prev.pirates.map((pirate) => {
          if (pirate.sunk) return { ...pirate, hitFlash: Math.max(0, pirate.hitFlash - dt) };

          const nextPhase = pirate.phase + pirate.patrolSpeed * dt;
          const x = pirate.baseX + Math.cos(nextPhase) * pirate.patrolRadius;
          const y = pirate.baseY + Math.sin(nextPhase * 0.92) * pirate.patrolRadius;
          const active = regionIdsNow.includes(pirate.regionId);
          const angle = active
            ? toDeg(Math.atan2(player.y - y, player.x - x)) + 90
            : toDeg(nextPhase + Math.PI / 2) + 90;

          return {
            ...pirate,
            x,
            y,
            phase: nextPhase,
            active,
            angle,
            fireCooldown: Math.max(0, pirate.fireCooldown - dt),
            hitFlash: Math.max(0, pirate.hitFlash - dt),
          };
        });

        const spawnedBullets = [];
        const spawnedEffects = [];

        activeRegionsNow.forEach((region) => {
          const attackers = pirates
            .filter((pirate) => !pirate.sunk && pirate.active && pirate.regionId === region.id)
            .sort((a, b) => distance(player, a) - distance(player, b))
            .slice(0, region.maxAttackers);

          attackers.forEach((attacker) => {
            if (attacker.fireCooldown > 0) return;

            const type = PIRATE_TYPES[attacker.type];
            const attackAngle = Math.atan2(player.y - attacker.y, player.x - attacker.x);
            const finalAngle = attackAngle + (Math.random() - 0.5) * type.spread;
            const muzzleX = attacker.x + Math.cos(finalAngle) * 44;
            const muzzleY = attacker.y + Math.sin(finalAngle) * 44;

            spawnedBullets.push({
              id: bulletIdRef.current++,
              owner: "pirate",
              pirateType: attacker.type,
              regionId: attacker.regionId,
              damage: attacker.damage,
              x: muzzleX,
              y: muzzleY,
              vx: Math.cos(finalAngle) * attacker.bulletSpeed,
              vy: Math.sin(finalAngle) * attacker.bulletSpeed,
              ttl: 2.8,
            });

            spawnedEffects.push({
              id: effectIdRef.current++,
              type: "muzzle-pirate",
              x: muzzleX,
              y: muzzleY,
              ttl: 0.22,
              maxTtl: 0.22,
            });

            attacker.fireCooldown = randomCooldown(type);
          });
        });

        let bullets = [...prev.bullets, ...spawnedBullets]
          .map((bullet) => ({
            ...bullet,
            x: bullet.x + bullet.vx * dt,
            y: bullet.y + bullet.vy * dt,
            ttl: bullet.ttl - dt,
          }))
          .filter(
            (bullet) =>
              bullet.ttl > 0 &&
              bullet.x > -60 &&
              bullet.x < WORLD_W + 60 &&
              bullet.y > -60 &&
              bullet.y < WORLD_H + 60
          );

        let effects = [...prev.effects, ...spawnedEffects]
          .map((effect) => ({ ...effect, ttl: effect.ttl - dt }))
          .filter((effect) => effect.ttl > 0);

        const spent = new Set();
        let sunkCount = prev.sunkCount;
        let message = prev.message;
        let messageTone = prev.messageTone;
        let messageTimer = Math.max(0, prev.messageTimer - dt);

        bullets.forEach((bullet) => {
          if (spent.has(bullet.id)) return;

          if (bullet.owner === "player") {
            for (let i = 0; i < pirates.length; i += 1) {
              const pirate = pirates[i];

              if (pirate.sunk || pirate.regionId !== bullet.regionId) continue;

              const type = PIRATE_TYPES[pirate.type];
              const collisionRange = BULLET_HIT_RANGE + Math.max(0, (type.scale - 1) * 16);

              if (distance(bullet, pirate) < collisionRange) {
                spent.add(bullet.id);
                const nextHp = Math.max(0, pirate.hp - bullet.damage);
                const sunk = nextHp <= 0;

                pirates[i] = {
                  ...pirate,
                  hp: nextHp,
                  sunk,
                  active: sunk ? false : pirate.active,
                  hitFlash: 0.18,
                };

                effects.push({
                  id: effectIdRef.current++,
                  type: sunk ? "explosion-large" : "impact",
                  x: pirate.x,
                  y: pirate.y,
                  ttl: sunk ? 0.9 : 0.4,
                  maxTtl: sunk ? 0.9 : 0.4,
                });

                if (sunk) {
                  player.coins += pirate.bounty;
                  sunkCount += 1;
                  message = `☠ +${pirate.bounty} ◈`;
                  messageTone = "success";
                  messageTimer = 2.4;
                }
                break;
              }
            }
          } else {
            const bulletRegionStillActive = regionIdsNow.includes(bullet.regionId);

            if (
              bulletRegionStillActive &&
              player.invuln <= 0 &&
              distance(bullet, player) < BULLET_HIT_RANGE - 3
            ) {
              spent.add(bullet.id);
              player.hp = Math.max(0, player.hp - bullet.damage);
              player.invuln = 0.42;
              message = `-${bullet.damage} HP`;
              messageTone = "danger";
              messageTimer = 1.4;

              effects.push({
                id: effectIdRef.current++,
                type: "player-hit",
                x: player.x,
                y: player.y,
                ttl: 0.48,
                maxTtl: 0.48,
              });
            }
          }
        });

        bullets = bullets.filter((bullet) => {
          if (spent.has(bullet.id)) return false;
          if (bullet.owner === "pirate" && !regionIdsNow.includes(bullet.regionId)) return false;
          return true;
        });

        if (messageTimer <= 0 && message) {
          message = "";
          messageTone = "neutral";
        }

        const living = pirates.filter((pirate) => !pirate.sunk).length;
        let status = prev.status;

        if (player.hp <= 0) status = "defeat";
        else if (living === 0) status = "victory";

        return {
          ...prev,
          status,
          player,
          pirates,
          bullets,
          effects,
          sunkCount,
          message,
          messageTone,
          messageTimer,
        };
      });
    }, 32);

    return () => window.clearInterval(timer);
  }, [chestDialog, game.status, showLeave, showRules, t.bounty, t.pirateDown, view]);

  useEffect(() => {
    if (view !== "game" || game.status !== "victory" || game.player.coins <= bestCoins) return;
    setBestCoins(game.player.coins);
    saveBest(game.player.coins);
  }, [bestCoins, game.player.coins, game.status, view]);

  const liveCompetitionScore = useMemo(
    () =>
      calculateDealScore({
        piratesSunk: game.sunkCount,
        coins: game.player.coins,
        hp: game.player.hp,
        victory: game.status === "victory",
      }),
    [game.player.coins, game.player.hp, game.status, game.sunkCount]
  );

  useEffect(() => {
    if (
      view !== "game" ||
      game.status === "playing" ||
      competitionFinalRef.current ||
      !competitionAttemptRef.current
    ) {
      return;
    }

    const result = competitionAttemptRef.current.finalize({
      playerSlot: "single",
      finalScore: liveCompetitionScore,
      outcome: game.status === "victory" ? "win" : "loss",
    });

    competitionFinalRef.current = result;
    setCompetitionFinal(result);
  }, [game.status, liveCompetitionScore, view]);

  const updateJoystick = useCallback((event) => {
    const node = event.currentTarget;
    const rect = node.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let dx = event.clientX - centerX;
    let dy = event.clientY - centerY;
    const radius = rect.width * 0.31;
    const length = Math.hypot(dx, dy);

    if (length > radius) {
      dx = (dx / length) * radius;
      dy = (dy / length) * radius;
    }

    joystickRef.current.x = dx / radius;
    joystickRef.current.y = dy / radius;
    setJoystickVisual({ x: dx, y: dy });
  }, []);

  const joystickDown = useCallback(
    (event) => {
      event.currentTarget.setPointerCapture?.(event.pointerId);
      joystickRef.current.active = true;
      joystickRef.current.pointerId = event.pointerId;
      updateJoystick(event);
    },
    [updateJoystick]
  );

  const joystickMove = useCallback(
    (event) => {
      if (!joystickRef.current.active || joystickRef.current.pointerId !== event.pointerId) return;
      updateJoystick(event);
    },
    [updateJoystick]
  );

  const joystickUp = useCallback(
    (event) => {
      if (
        joystickRef.current.pointerId !== null &&
        joystickRef.current.pointerId !== event.pointerId
      ) {
        return;
      }
      resetControls();
    },
    [resetControls]
  );

  const warning = activeRegionIds.length > 0;
  const canFire = combatTargets.length > 0 && game.status === "playing";
  const emergencyReady = game.player.ammo === 0 && game.player.coins < AMMO_PACK_COST;
  const repairDisabled = game.status !== "playing" || game.player.hp >= game.player.maxHp;
  const competitionScore = competitionFinal?.finalScore ?? liveCompetitionScore;

  return (
    <main className="deal-page high-seas-page hs4-page">
      <section className="hs4-frame">
        {view === "entry" ? (
          <section className="hs4-entry">
            <img src={homeBackground} className="hs4-entry-bg" alt="" aria-hidden="true" draggable="false" />
            <div className="hs4-entry-shade" />
            <div className="hs4-entry-stars" />

           

            <header className="hs4-entry-topbar">
              <div>
                <span>{t.topEyebrow}</span>
                <strong>DEAL OR NO DEAL</strong>
              </div>
              <nav>
                <button type="button" onClick={() => setLanguage((value) => (value === "zh" ? "en" : "zh"))}>
                  {t.language}
                </button>
                <button type="button" onClick={() => setShowRules(true)} title={t.guide} aria-label={t.guide}>?</button>
              </nav>
            </header>

            <div className="hs4-entry-layout">
              <section className="hs4-entry-copy">
                <span className="hs4-entry-badge">⚓ {t.badge}</span>
                <h1>{t.title}</h1>
                <p className="hs4-entry-tagline">{t.intro}</p>

                <div className="hs4-entry-stats" aria-label={language === "zh" ? "四片海域，十二艘海盗船，十二个宝箱" : "Four seas, twelve pirates, twelve chests"}>
                  <div><i aria-hidden="true">◉</i><strong>4</strong><small>{language === "zh" ? "海域" : "SEAS"}</small></div>
                  <div><i aria-hidden="true">☠</i><strong>{ACTIVE_PIRATE_LAYOUT.length}</strong><small>{language === "zh" ? "海盗" : "PIRATES"}</small></div>
                  <div><i aria-hidden="true">◆</i><strong>{CHEST_LAYOUT.length}</strong><small>{language === "zh" ? "宝箱" : "CHESTS"}</small></div>
                </div>

                <button type="button" className="hs4-entry-start" onClick={startGame}>
                  <span>{t.enter}</span><b>➜</b>
                </button>
                <small className="hs4-entry-record">◈ {t.best}: <strong>{bestCoins ? bestCoins.toLocaleString() : "—"}</strong></small>
              </section>

              <section className="hs4-entry-island" aria-hidden="true">
                <div className="hs4-island-orbit orbit-a" />
                <div className="hs4-island-orbit orbit-b" />
                <div className="hs4-island-glow" />
                <img src={dealIsland} alt="" draggable="false" />
                <span className="hs4-route-line route-a" />
                <span className="hs4-route-line route-b" />
              </section>
            </div>
          </section>
        ) : (
          <section className="hs4-game">
            <div className="hs4-sea-base">
              <div className="hs4-sea-light" />
              <div className="hs4-water-lines" style={{ backgroundPosition: `${-camera.x * 0.08}px ${-camera.y * 0.06}px` }} />
              <div className="hs4-water-glints" style={{ transform: `translate(${-camera.x * 0.025}px, ${-camera.y * 0.018}px)` }} />
            </div>

            <header className="hs4-hud">
              <div className="hs4-hud-left">
                <button
                  type="button"
                  className="hs4-back-button"
                  onClick={() => {
                    resetControls();
                    setShowLeave(true);
                  }}
                  aria-label={t.backIntro}
                  title={t.backIntro}
                >
                  ←
                </button>
                <div className="hs4-mission" title={t.mission} aria-label={`${t.mission} ${game.sunkCount} / ${ACTIVE_PIRATE_LAYOUT.length}`}>
                  <span className="hs4-mission-icon" aria-hidden="true">☠</span>
                  <strong>{game.sunkCount}<em>/{ACTIVE_PIRATE_LAYOUT.length}</em></strong>
                </div>
              </div>

              <div className="hs4-resource-row">
                <div className="hs4-resource"><i>◈</i><div><span>{t.coins}</span><strong>{game.player.coins.toLocaleString()}</strong></div></div>
                <div className={`hs4-resource ${emergencyReady ? "is-emergency" : ""}`}><i>●</i><div><span>{emergencyReady ? t.emergencyLabel : t.ammo}</span><strong>{emergencyReady ? "∞" : game.player.ammo}</strong></div></div>
                <div className="hs4-resource hs4-score-resource"><i>★</i><div><span>{t.competitionScore}</span><strong>{competitionScore.toLocaleString()}</strong></div></div>
                <button type="button" className="hs4-language-button" onClick={() => setLanguage((value) => (value === "zh" ? "en" : "zh"))}>
                  {language === "zh" ? "EN" : "中"}
                </button>
              </div>
            </header>

            <div className="hs4-world">
              <div className="hs4-world-grid" style={{ backgroundPosition: `${-camera.x * 0.12}px ${-camera.y * 0.12}px` }} />

              {MAP_DECOR.map((decor) => (
                <div key={decor.id} className="hs4-reef" style={{ ...worldStyle(decor.x, decor.y), width: `${(decor.size / VIEW_W) * 100}%` }} />
              ))}

              {ACTIVE_SEA_REGIONS.map((region) => {
                const aliveInRegion = game.pirates.filter((pirate) => pirate.regionId === region.id && !pirate.sunk).length;
                const active = activeRegionIds.includes(region.id);
                return (
                  <div
                    key={region.id}
                    className={[
                      "hs4-pirate-zone",
                      `zone-${region.id}`,
                      active ? "is-alert" : "",
                      aliveInRegion === 0 ? "is-cleared" : "",
                    ].filter(Boolean).join(" ")}
                    style={{ ...worldStyle(region.x, region.y), width: `${((region.radius * 2) / VIEW_W) * 100}%` }}
                  >
                    <div className="hs4-zone-label">
                      <span>{language === "zh" ? region.zh : region.en}</span>
                      <strong>{aliveInRegion === 0 ? "✓" : `☠ ${aliveInRegion}`}</strong>
                    </div>
                    <i className="hs4-zone-ring ring-a" />
                    <i className="hs4-zone-ring ring-b" />
                  </div>
                );
              })}

              {game.chests.map((chest) => (
                <div key={chest.id} className={`hs4-world-chest ${chest.opened ? "is-opened" : ""}`} style={worldStyle(chest.x, chest.y)}>
                  <ChestGraphic opened={chest.opened} />
                  {!chest.opened && <span className="hs4-chest-cost">◈ {chest.cost}</span>}
                </div>
              ))}

              {game.pirates.map((pirate) => {
                const type = PIRATE_TYPES[pirate.type];
                const isTarget = currentTargetId === pirate.id && !pirate.sunk;
                return (
                  <div
                    key={pirate.id}
                    className={[
                      "hs4-world-ship",
                      "hs4-pirate-ship",
                      `pirate-${pirate.type}`,
                      pirate.sunk ? "is-sunk" : "",
                      pirate.hitFlash > 0 ? "is-hit" : "",
                      isTarget ? "is-target" : "",
                    ].filter(Boolean).join(" ")}
                    style={{
                      ...worldStyle(pirate.x, pirate.y),
                      transform: `translate(-50%, -50%) scale(${type.scale})`,
                    }}
                  >
                    <div className="hs4-ship-rotator" style={{ transform: `rotate(${pirate.angle}deg)` }}>
                      <ShipGraphic pirate type={pirate.type} />
                    </div>

                    {!pirate.sunk && (
                      <>
                        <div className="hs4-enemy-health" title={`${language === "zh" ? type.zh : type.en} · ${pirate.hp}/${pirate.maxHp} HP`}><i style={{ width: `${(pirate.hp / pirate.maxHp) * 100}%` }} /></div>
                        {isTarget && <span className="hs4-bounty">◈ {pirate.bounty}</span>}
                        {isTarget && <span className="hs4-target-reticle" />}
                      </>
                    )}
                  </div>
                );
              })}

              {game.bullets.map((bullet) => (
                <i
                  key={bullet.id}
                  className={`hs4-cannonball ${bullet.owner} ${bullet.emergency ? "emergency" : ""} ${bullet.pirateType ? `type-${bullet.pirateType}` : ""}`}
                  style={worldStyle(bullet.x, bullet.y)}
                />
              ))}

              {game.effects.map((effect) => (
                <span
                  key={effect.id}
                  className={`hs4-effect effect-${effect.type}`}
                  style={{
                    ...worldStyle(effect.x, effect.y),
                    "--effect-progress": effect.maxTtl ? 1 - effect.ttl / effect.maxTtl : 0,
                  }}
                />
              ))}

              <div
                className={`hs4-world-ship hs4-player-ship ${game.player.invuln > 0 ? "is-damaged" : ""}`}
                style={{ ...worldStyle(game.player.x, game.player.y), transform: `translate(-50%, -50%) rotate(${game.player.angle}deg)` }}
              >
                <ShipGraphic />
              </div>
            </div>

            <aside className="hs4-minimap">
              <header><span>◉ {t.map}</span><strong>{activeRegion ? (language === "zh" ? activeRegion.zh : activeRegion.en) : "✓"}</strong></header>
              <div className="hs4-minimap-body">
                <span
                  className="hs4-mini-camera"
                  style={{
                    left: `${(camera.x / WORLD_W) * 100}%`,
                    top: `${(camera.y / WORLD_H) * 100}%`,
                    width: `${(VIEW_W / WORLD_W) * 100}%`,
                    height: `${(VIEW_H / WORLD_H) * 100}%`,
                  }}
                />
                {ACTIVE_SEA_REGIONS.map((region) => (
                  <i
                    key={region.id}
                    className={`hs4-mini-zone ${activeRegionIds.includes(region.id) ? "is-active" : ""}`}
                    style={{
                      left: `${(region.x / WORLD_W) * 100}%`,
                      top: `${(region.y / WORLD_H) * 100}%`,
                      width: `${((region.radius * 2) / WORLD_W) * 100}%`,
                    }}
                  />
                ))}
                {game.chests.filter((chest) => !chest.opened).map((chest) => (
                  <b key={chest.id} className="hs4-mini-chest" style={{ left: `${(chest.x / WORLD_W) * 100}%`, top: `${(chest.y / WORLD_H) * 100}%` }}>◆</b>
                ))}
                {game.pirates.filter((pirate) => !pirate.sunk).map((pirate) => (
                  <b key={pirate.id} className={`hs4-mini-pirate mini-${pirate.type}`} style={{ left: `${(pirate.x / WORLD_W) * 100}%`, top: `${(pirate.y / WORLD_H) * 100}%` }}>•</b>
                ))}
                <i className="hs4-mini-player" style={{ left: `${(game.player.x / WORLD_W) * 100}%`, top: `${(game.player.y / WORLD_H) * 100}%` }} />
              </div>
            </aside>

            <section className={`hs4-hull-card ${game.player.hp <= 35 ? "is-critical" : ""}`}>
              <div className="hs4-hull-card-head"><span>{t.hull}</span><strong>{game.player.hp} / {game.player.maxHp}</strong></div>
              <div className="hs4-hull-track"><i style={{ width: `${(game.player.hp / game.player.maxHp) * 100}%` }} /></div>
            </section>

            {warning && game.status === "playing" && (
              <div className="hs4-zone-status danger" role="status"><i /><span>{t.warningMessage}</span></div>
            )}

            {game.message && <div className={`hs4-message tone-${game.messageTone}`}>{game.message}</div>}

            {nearestChest && !chestDialog && game.status === "playing" && (
              <button type="button" className="hs4-nearby-chest" onClick={inspectChest}>
                <span>◆</span><strong>{t.inspect}</strong><b>→</b>
              </button>
            )}

            <div
              className="hs4-joystick"
              onPointerDown={joystickDown}
              onPointerMove={joystickMove}
              onPointerUp={joystickUp}
              onPointerCancel={joystickUp}
              aria-label={t.controls}
            >
              <span className="hs4-joystick-north">△</span>
              <div className="hs4-joystick-knob" style={{ transform: `translate(calc(-50% + ${joystickVisual.x}px), calc(-50% + ${joystickVisual.y}px))` }} />
            </div>

            <div className="hs4-combat-panel">
              <button
                type="button"
                className="hs4-action-button ammo"
                onClick={buyAmmo}
                disabled={game.status !== "playing" || game.player.coins < AMMO_PACK_COST}
                aria-label={`${language === "zh" ? "购买" : "Buy"} ${AMMO_PACK_SIZE} ${t.ammo}, ${AMMO_PACK_COST} ${t.coins}`}
                title={`${t.buyAmmo} ${t.ammo} · ${t.buyAmmoCost}`}
              >
                <span>●</span><div><strong>{t.buyAmmo}</strong><small>{t.buyAmmoCost}</small></div>
              </button>

              <button
                type="button"
                className="hs4-action-button repair"
                onClick={repairHull}
                disabled={repairDisabled || game.player.coins < REPAIR_COST}
                aria-label={`${language === "zh" ? "修复" : "Repair"} ${REPAIR_AMOUNT} HP, ${REPAIR_COST} ${t.coins}`}
                title={`${t.repair} · ${t.repairCost}`}
              >
                <span>✚</span><div><strong>{t.repair}</strong><small>{t.repairCost}</small></div>
              </button>

              <button
                type="button"
                className={`hs4-fire-button ${!canFire ? "is-locked" : ""} ${emergencyReady && canFire ? "is-emergency" : ""}`}
                onPointerDown={(event) => { event.preventDefault(); shoot(); }}
                disabled={game.status !== "playing"}
                aria-label={canFire ? (emergencyReady ? t.emergencyLabel : t.fire) : t.fireLocked}
                title={canFire ? (emergencyReady ? t.emergencyInfo : t.fire) : t.fireLocked}
              >
                <span className="hs4-fire-symbol">{emergencyReady ? "⚡" : canFire ? "✹" : "◇"}</span>
                <strong>{emergencyReady && canFire ? t.emergencyLabel : t.fire}</strong>
              </button>
            </div>

            <div className="hs4-control-help" title={language === "zh" ? "移动 · 开炮 · 宝箱 · 买弹 · 修复" : "Move · Fire · Chest · Ammo · Repair"}>{t.keyboard}</div>

            {game.status !== "playing" && (
              <div className="hs4-overlay">
                <section className={`hs4-end-card ${game.status}`}>
                  <div className="hs4-end-icon">{game.status === "victory" ? "♔" : "⚓"}</div>
                  <h2>{game.status === "victory" ? t.victory : t.defeat}</h2>
                  <div className="hs4-final-score">
                    <span>{t.finalScore}</span>
                    <strong>{competitionScore.toLocaleString()}</strong>
                  </div>
                  <div className="hs4-end-stats">
                    <div><span>{t.coins}</span><strong>{game.player.coins.toLocaleString()}</strong></div>
                    <div><span>{t.pirates}</span><strong>{game.sunkCount} / {ACTIVE_PIRATE_LAYOUT.length}</strong></div>
                    <div><span>{t.hull}</span><strong>{game.player.hp}</strong></div>
                  </div>
                  <div className="hs4-end-actions">
                    <button type="button" className="hs4-gold-button" onClick={startGame}>{t.retry}</button>
                    <button type="button" className="hs4-dark-button" onClick={returnToLobby}>{t.backIntro}</button>
                  </div>
                </section>
              </div>
            )}
          </section>
        )}

        {chestDialog && selectedChest && (
          <div className="hs4-overlay hs4-chest-overlay">
            <section className="hs4-chest-modal">
              <div className="hs4-modal-chest"><ChestGraphic opened={Boolean(chestResult)} /></div>

              {!chestResult ? (
                <>
                  <h2>{t.possibleRewards}</h2>
                  <span className="hs4-modal-kicker">{t.oneOfThree}</span>
                  <div className="hs4-outcome-grid">
                    {selectedChest.options.map((value, index) => (
                      <article key={`${value}-${index}`}><strong>◈ {value}</strong></article>
                    ))}
                  </div>
                  <div className="hs4-price-strip"><span>{t.chestCost}</span><strong>◈ {selectedChest.cost}</strong></div>
                  <div className="hs4-modal-actions">
                    <button type="button" className="hs4-dark-button" onClick={closeChestDialog}>{t.leaveChest}</button>
                    <button type="button" className="hs4-gold-button" onClick={openChest} disabled={game.player.coins < selectedChest.cost}>
                      {game.player.coins < selectedChest.cost ? t.notEnough : t.openChest}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="hs4-modal-kicker">{t.chestOpened}</span>
                  <div className="hs4-loot-result">
                    <div className="hs4-loot-payout">
                      <small>{t.reward}</small>
                      <strong>◈ {chestResult.reward}</strong>
                    </div>
                    <div className={`hs4-result-number ${chestResult.net >= 0 ? "positive" : "negative"}`}>
                      <small>{chestResult.net >= 0 ? t.netGain : t.netLoss}</small>
                      <strong>{chestResult.net >= 0 ? "+" : ""}{chestResult.net}</strong>
                    </div>
                  </div>
                  <button type="button" className="hs4-gold-button hs4-full-button" onClick={closeChestDialog}>{t.continueSailing}</button>
                </>
              )}
            </section>
          </div>
        )}

        {showRules && (
          <div className="hs4-overlay" onMouseDown={() => setShowRules(false)}>
            <section className="hs4-rules-modal" onMouseDown={(event) => event.stopPropagation()}>
              <button type="button" className="hs4-close-button" onClick={() => setShowRules(false)}>×</button>
              <h2>{t.howTo}</h2>
              <div className="hs4-rules-grid">
                {[
                  ["🧭", t.step1, t.step1Text],
                  ["◆", t.step2, t.step2Text],
                  ["✹", t.step3, t.step3Text],
                  ["⚡", t.step4, t.step4Text],
                  ["✚", t.step5, t.step5Text],
                ].map(([icon, title, detail]) => (
                  <article key={title}>
                    <span className="hs4-rule-icon" aria-hidden="true">{icon}</span>
                    <strong>{title}</strong>
                    <small>{detail}</small>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}

        {showLeave && (
          <div className="hs4-overlay" onMouseDown={() => setShowLeave(false)}>
            <section className="hs4-leave-modal" onMouseDown={(event) => event.stopPropagation()}>
              <div className="hs4-end-icon">⚓</div>
              <h2>{t.leaveTitle}</h2>
              <div className="hs4-modal-actions">
                <button type="button" className="hs4-dark-button" onClick={() => setShowLeave(false)}>{t.stay}</button>
                <button type="button" className="hs4-gold-button" onClick={() => { setShowLeave(false); resetControls(); setView("entry"); }}>{t.leave}</button>
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
