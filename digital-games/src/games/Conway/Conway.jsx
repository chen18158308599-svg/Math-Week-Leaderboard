import { useCallback, useEffect, useRef, useState } from "react";

import {

  calculateConwayScore,

  createCompetitionAttempt,

  isConwayMatchWon,

} from "../../scoring/competitionScoring.js";

import "./Conway.css";

import homeBackground from "../../assets/home-layers/background.png";

import conwayIsland from "../../assets/home-layers/conway.png";

const GRID = 8;

const MAX_CELLS = 10;

const CONWAY_READY_SECONDS = 5;

// Each full 30 seconds of table play starts a new Conway round.
const CONWAY_REENTRY_SECONDS = 30;

const CONWAY_PICK_SECONDS = 10;

const CONWAY_EVOLVE_SECONDS = 20;

const MIN_BALL_SPEED = 0.026;

const BASE_MAX_BALL_SPEED = 0.050;

const CAP_STEP = 0.008;

const POWER_SKILL_COST = 1;

const PADDLE_RADIUS_X = 5.0;

const PADDLE_RADIUS_Y = 9.5;

const COPY = {

  zh: {

    eyebrow: "MATH WEEK 2026",

    title: "Conway 乒乓对决",

    englishTitle: "TABLE TENNIS × GAME OF LIFE",

    badge: "2 人 · 双阶段挑战",

    intro:

      "先培养细胞赚取技能，再用球拍决胜。乒乓对战每 30 秒进入一次 Conway。",

    intro2:

      "先得 9 分且领先 2 分获胜 · 12 分封顶",

    start: "开始比赛",

    guide: "玩法",

    language: "中/EN",

    p1: "玩家 1",

    p2: "玩家 2",

    score: "比分",

    skillPoints: "技能点",

    rally: "回合",

    conway: "CONWAY",

    seconds: "秒",

    serve: "发球",

    dragTitle: "滑动球拍",

    dragText: "拖动移动 · 挥得越快，球速越快",

    keyboard1: "P1：WASD",

    keyboard2: "P2：方向键",

    force: "力道",

    forceLow: "轻",

    forceHigh: "重",

    forceCap: "球速上限",

    capLevel: "等级",

    upgradeCap: "提高球速上限",

    needPoint: "技能点不足",

    upgraded: "力道上限提升",

    onlySkill: "消耗 1 ✦",

    readyTitle: "康威生命游戏",

    readyText: "放置细胞 → 观察演化 → 获得 ✦",

    p1PickTitle: "玩家 1 · 选择细胞",

    p2PickTitle: "玩家 2 · 选择细胞",

    pickText: "点击棋格，最多放置 10 个细胞",

    waiting: "等待",

    confirm: "确认部署",

    autoConfirm: "",

    evolveTitle: "细胞演化中",

    evolveText: "观察存活情况，获得技能点",

    cells: "活细胞",

    placed: "已放置",

    aliveTime: "存活时间",

    rule:

      "每存活 5 秒 +1 ✦ · 结束时 ≥3 个细胞再 +1 ✦",

    challengeDone: "获得技能点",

    survival: "存活",

    finalCells: "最终细胞",

    bonus: "结束奖励",

    gained: "获得",

    resume: "开始乒乓球",

    matchOver: "比赛结束",

    wins: "获胜",

    finalScore: "比赛比分",

    playAgain: "返回 MATHVERSE",

    backEntrance: "返回 MATHVERSE",

    pauseTitle: "返回游戏入口？",

    pauseText: "当前比分、技能点与力道上限不会保留。",

    stay: "继续比赛",

    leave: "结束比赛",

    howTo: "快速玩法",

    step1: "选择细胞",

    step1Text:

      "玩家 1、玩家 2 依次点击棋格，各选最多 10 个。",

    step2: "存活得分",

    step2Text:

      "演化 20 秒：每存活 5 秒 +1 ✦；剩余 3 个再 +1 ✦。",

    step3: "挥拍对战",

    step3Text:

      "各控制自己的半场；挥拍越快，回球越快。",

    step4: "升级与胜利",

    step4Text:

      "花 ✦ 提升球速。先得 9 分并领先 2 分获胜，12 分封顶。",

    step5: "胜利",

    step5Text:

      "先得 9 分并领先 2 分，12 分封顶。",

    flowPick: "放置",

    flowEarn: "获得技能",

    flowPlay: "乒乓对战",

    phaseIntro: "双方各放最多 10 个细胞。存活 20 秒，赚取 ✦。",

    lifeRule: "2–3 个邻居则存活 · 恰好 3 个邻居会诞生新细胞",

  },  en: {

    eyebrow: "MATH WEEK 2026",

    title: "Conway Table Tennis",

    englishTitle: "TABLE TENNIS × GAME OF LIFE",

    badge: "2 PLAYERS · 2 PHASES",

    intro:

      "Grow cells for power, then play table tennis. Conway returns every 30s of table play.",

    intro2:

      "First to 9 · Win by 2 · Cap 12",

    start: "Start Match",

    guide: "Guide",

    language: "中/EN",

    p1: "Player 1",

    p2: "Player 2",

    score: "Score",

    skillPoints: "Skill Points",

    rally: "Rally",

    conway: "CONWAY",

    seconds: "sec",

    serve: "Serve",

    dragTitle: "DRAG PADDLE",

    dragText: "Drag to move · Swipe faster for stronger shots",

    keyboard1: "P1: WASD",

    keyboard2: "P2: Arrow keys",

    force: "Force",

    forceLow: "Soft",

    forceHigh: "Hard",

    forceCap: "Speed cap",

    capLevel: "LEVEL",

    upgradeCap: "Boost max ball speed",

    needPoint: "Not enough skill points",

    upgraded: "Force cap increased",

    onlySkill: "COST: 1 ✦",

    readyTitle: "CONWAY'S GAME OF LIFE",

    readyText: "Place cells → evolve → earn ✦",

    p1PickTitle: "PLAYER 1 · PLACE CELLS",

    p2PickTitle: "PLAYER 2 · PLACE CELLS",

    pickText: "Tap up to 10 cells",

    waiting: "Waiting",

    confirm: "Lock In",

    autoConfirm: "",

    evolveTitle: "CELLS EVOLVING",

    evolveText: "Survive to earn skill points",

    cells: "Live Cells",

    placed: "Placed",

    aliveTime: "Alive",

    rule:

      "+1 ✦ per 5s alive · +1 ✦ if 3+ survive",

    challengeDone: "POWER EARNED",

    survival: "Survival",

    finalCells: "Final Cells",

    bonus: "End Bonus",

    gained: "Gained",

    resume: "PLAY TABLE TENNIS",

    matchOver: "Match Over",

    wins: "Wins",

    finalScore: "Match Score",

    playAgain: "RETURN TO MATHVERSE",

    backEntrance: "RETURN TO MATHVERSE",

    pauseTitle: "Return to the entrance?",

    pauseText: "Score, skill points and force-cap upgrades will be lost.",

    stay: "Keep Playing",

    leave: "End Match",

    howTo: "QUICK GUIDE",

    step1: "Pick cells",

    step1Text:

      "P1, then P2: tap up to 10 cells each.",

    step2: "Earn power",

    step2Text:

      "Evolve for 20s: +1 ✦ per 5s alive; +1 ✦ if 3+ remain.",

    step3: "Play ping-pong",

    step3Text:

      "Each controls one half. Faster swipe = faster shot.",

    step4: "Upgrade & win",

    step4Text:

      "Spend ✦ to boost speed. First to 9, win by 2; cap 12.",

    step5: "Win",

    step5Text:

      "First to 9, win by 2; cap 12.",

    flowPick: "PICK CELLS",

    flowEarn: "EARN POWER",

    flowPlay: "PLAY TENNIS",

    phaseIntro: "Place up to 10 cells each. Survive 20s to earn ✦.",

    lifeRule: "2–3 neighbors: survive · Exactly 3: new cell",

  },

};

const makeBoard = () => Array(GRID * GRID).fill(false);

const countAlive = (board) =>

  board.reduce((sum, cell) => sum + (cell ? 1 : 0), 0);

function evolve(board) {

  const next = Array(GRID * GRID).fill(false);

  for (let row = 0; row < GRID; row += 1) {

    for (let col = 0; col < GRID; col += 1) {

      let neighbors = 0;

      for (let dr = -1; dr <= 1; dr += 1) {

        for (let dc = -1; dc <= 1; dc += 1) {

          if (dr === 0 && dc === 0) continue;

          const rr = row + dr;

          const cc = col + dc;

          if (

            rr >= 0 &&

            rr < GRID &&

            cc >= 0 &&

            cc < GRID &&

            board[rr * GRID + cc]

          ) {

            neighbors += 1;

          }

        }

      }

      const index = row * GRID + col;

      next[index] = board[index]

        ? neighbors === 2 || neighbors === 3

        : neighbors === 3;

    }

  }

  return next;

}

function clamp(value, min, max) {

  return Math.max(min, Math.min(max, value));

}

function capSpeed(level) {

  return BASE_MAX_BALL_SPEED + (level - 1) * CAP_STEP;

}

function makePaddle(player) {

  return {

    x: player === "p1" ? 15 : 85,

    y: 50,

    vx: 0,

    vy: 0,

    angle: 0,

    lastMoveAt: performance.now(),

  };

}

function makeRuntime() {

  return {

    p1: makePaddle("p1"),

    p2: makePaddle("p2"),

    rallyActive: false,

    server: "p1",

    lastFrame: performance.now(),

    ball: {

      x: 50,

      y: 50,

      vx: 0,

      vy: 0,

      lastHitter: null,

      hitLockUntil: 0,

    },

  };

}

export default function Conway({ onBack }) {

  const competitionAttemptRef = useRef(null);

  const competitionFinalizedRef = useRef(false);

  const [competitionScores, setCompetitionScores] = useState({ p1: 0, p2: 0 });

  const [finalCompetitionScores, setFinalCompetitionScores] = useState(null);

  const [language, setLanguage] = useState("en");

  const [view, setView] = useState("entry");

  const [nextConwayIn, setNextConwayIn] = useState(CONWAY_REENTRY_SECONDS);

  const tableTimeLeftRef = useRef(CONWAY_REENTRY_SECONDS * 1000);

  const [scores, setScores] = useState({ p1: 0, p2: 0 });

  const scoresRef = useRef({ p1: 0, p2: 0 });

  const [skillPoints, setSkillPoints] = useState({ p1: 0, p2: 0 });

  const [capLevels, setCapLevels] = useState({ p1: 1, p2: 1 });

  const capLevelsRef = useRef({ p1: 1, p2: 1 });

  const [forceLevel, setForceLevel] = useState({ p1: 0, p2: 0 });

  const forceRef = useRef({ p1: 0, p2: 0 });

  const runtimeRef = useRef(makeRuntime());

  const [court, setCourt] = useState(() => {

    const rt = runtimeRef.current;

    return {

      ...rt,

      p1: { ...rt.p1 },

      p2: { ...rt.p2 },

      ball: { ...rt.ball },

    };

  });

  const [rallyNumber, setRallyNumber] = useState(0);

  const [message, setMessage] = useState("");

  const [winner, setWinner] = useState(null);

const [showRules, setShowRules] = useState(false);

  const [showLeave, setShowLeave] = useState(false);

  const [board1, setBoard1] = useState(makeBoard);

  const [board2, setBoard2] = useState(makeBoard);

  const board1Ref = useRef(makeBoard());

  const board2Ref = useRef(makeBoard());

  const [conwayPhase, setConwayPhase] = useState("ready");

  const [conwayTime, setConwayTime] = useState(CONWAY_READY_SECONDS);

  const [survival, setSurvival] = useState({ p1: 0, p2: 0 });

  const survivalRef = useRef({ p1: 0, p2: 0 });

  const [challengeResult, setChallengeResult] = useState(null);

  const keysRef = useRef(new Set());

  const dragRef = useRef(new Map());

  const t = COPY[language];

  const snapshotCourt = useCallback(() => {

    const rt = runtimeRef.current;

    setCourt({

      ...rt,

      p1: { ...rt.p1 },

      p2: { ...rt.p2 },

      ball: { ...rt.ball },

    });

  }, []);

  const setForce = useCallback((player, value) => {

    const next = clamp(value, 0, 1);

    forceRef.current[player] = next;

    setForceLevel((prev) => ({

      ...prev,

      [player]: next,

    }));

  }, []);

  const resetMatch = useCallback(() => {

    competitionAttemptRef.current = createCompetitionAttempt("conway");

    competitionFinalizedRef.current = false;

    setCompetitionScores({ p1: 0, p2: 0 });

    setFinalCompetitionScores(null);

    scoresRef.current = { p1: 0, p2: 0 };

    setScores({ p1: 0, p2: 0 });

    setSkillPoints({ p1: 0, p2: 0 });

    capLevelsRef.current = { p1: 1, p2: 1 };

    setCapLevels({ p1: 1, p2: 1 });

    forceRef.current = { p1: 0, p2: 0 };

    setForceLevel({ p1: 0, p2: 0 });

    setRallyNumber(0);

    // Reset the 30-second table clock for a completely new match.
    tableTimeLeftRef.current = CONWAY_REENTRY_SECONDS * 1000;
    setNextConwayIn(CONWAY_REENTRY_SECONDS);

    setMessage("");

    setWinner(null);

    runtimeRef.current = makeRuntime();

    snapshotCourt();

    const nextBoard1 = makeBoard();

    const nextBoard2 = makeBoard();

    board1Ref.current = nextBoard1;

    board2Ref.current = nextBoard2;

    setBoard1(nextBoard1);

    setBoard2(nextBoard2);

    survivalRef.current = { p1: 0, p2: 0 };

    setSurvival({ p1: 0, p2: 0 });

    setChallengeResult(null);

    setConwayPhase("ready");

    setConwayTime(CONWAY_READY_SECONDS);

    dragRef.current.clear();

    keysRef.current.clear();

  }, [snapshotCourt]);

  const startMatch = useCallback(() => {

    resetMatch();

    setView("conway");

  }, [resetMatch]);

  const returnToLobby = useCallback(() => {

    if (typeof onBack === "function") {

      onBack();

      return;

    }

    if (window.history.length > 1) {

      window.history.back();

    }

  }, [onBack]);

  const registerPoint = useCallback(

    (player) => {

      const rt = runtimeRef.current;

      if (!rt.rallyActive) return;

      rt.rallyActive = false;

      rt.server = player;

      rt.ball.vx = 0;

      rt.ball.vy = 0;

      rt.ball.x = player === "p1" ? rt.p1.x + 6 : rt.p2.x - 6;

      rt.ball.y = player === "p1" ? rt.p1.y : rt.p2.y;

      rt.ball.lastHitter = null;

      const nextScores = {

        ...scoresRef.current,

        [player]: scoresRef.current[player] + 1,

      };

      scoresRef.current = nextScores;

      setScores(nextScores);

      setRallyNumber((value) => value + 1);

      setMessage(`${player === "p1" ? t.p1 : t.p2} +1`);

      snapshotCourt();

      const isMatchOver = isConwayMatchWon(nextScores.p1, nextScores.p2);

      if (!competitionFinalizedRef.current) {

        const nextCompetitionScores = {

          p1: calculateConwayScore(

            nextScores.p1,

            nextScores.p2,

            isMatchOver && player === "p1"

          ),

          p2: calculateConwayScore(

            nextScores.p2,

            nextScores.p1,

            isMatchOver && player === "p2"

          ),

        };

        if (isMatchOver) {

          competitionFinalizedRef.current = true;

          const attempt =

            competitionAttemptRef.current ?? createCompetitionAttempt("conway");

          competitionAttemptRef.current = attempt;

          const p1Result = attempt.finalize({

            playerSlot: "p1",

            finalScore: nextCompetitionScores.p1,

            outcome: player === "p1" ? "win" : "loss",

          });

          const p2Result = attempt.finalize({

            playerSlot: "p2",

            finalScore: nextCompetitionScores.p2,

            outcome: player === "p2" ? "win" : "loss",

          });

          const frozenCompetitionScores = {

            p1: p1Result.finalScore,

            p2: p2Result.finalScore,

          };

          setCompetitionScores(frozenCompetitionScores);

          setFinalCompetitionScores(frozenCompetitionScores);

        } else {

          setCompetitionScores(nextCompetitionScores);

        }

      }

      if (isMatchOver) {

        setWinner(player);

        window.setTimeout(() => {

          setView("end");

        }, 700);

        return;

      }

      window.setTimeout(() => setMessage(""), 500);

    },

    [snapshotCourt, t.p1, t.p2]

  );

  const startRally = useCallback(() => {

    if (view !== "table") return;

    const rt = runtimeRef.current;

    if (rt.rallyActive) return;

    const server = rt.server;

    const paddle = rt[server];

    const direction = server === "p1" ? 1 : -1;

    rt.rallyActive = true;

    rt.ball = {

      x: paddle.x + direction * 6,

      y: paddle.y,

      vx: direction * MIN_BALL_SPEED,

      vy: (Math.random() - 0.5) * 0.008,

      lastHitter: server,

      hitLockUntil: performance.now() + 240,

    };

    setMessage("");

    snapshotCourt();

  }, [snapshotCourt, view]);

  const upgradePower = useCallback(

    (player) => {

      const level = capLevelsRef.current[player];

      if (skillPoints[player] < POWER_SKILL_COST) {

        setMessage(t.needPoint);

        window.setTimeout(() => setMessage(""), 800);

        return;

      }

      setSkillPoints((prev) => ({

        ...prev,

        [player]: prev[player] - POWER_SKILL_COST,

      }));

      const nextLevel = level + 1;

      capLevelsRef.current[player] = nextLevel;

      setCapLevels((prev) => ({

        ...prev,

        [player]: nextLevel,

      }));

      setMessage(

        `${player === "p1" ? t.p1 : t.p2} · ${t.upgraded}`

      );

      window.setTimeout(() => setMessage(""), 900);

    },

    [skillPoints, t.needPoint, t.p1, t.p2, t.upgraded]

  );

  const tablePosition = useCallback((event) => {

    const rect = event.currentTarget.getBoundingClientRect();

    return {

      x: ((event.clientX - rect.left) / rect.width) * 100,

      y: ((event.clientY - rect.top) / rect.height) * 100,

    };

  }, []);

  const movePaddle = useCallback(

    (player, rawX, rawY, vx = 0, vy = 0) => {

      const paddle = runtimeRef.current[player];

      const isP1 = player === "p1";

      paddle.x = clamp(rawX, isP1 ? 5 : 55, isP1 ? 45 : 95);

      paddle.y = clamp(rawY, 9, 91);

      paddle.vx = vx;

      paddle.vy = vy;

      paddle.lastMoveAt = performance.now();

      const swipe = Math.hypot(vx, vy);

      /* 力道由真实手指速度而来。

         约 0.15 %/ms 视为满力道。 */

      const normalizedForce = clamp(swipe / 0.15, 0, 1);

      setForce(player, normalizedForce);

      if (swipe > 0.008) {

        const rawAngle = (Math.atan2(vy, Math.abs(vx) + 0.001) * 180) / Math.PI;

        paddle.angle = clamp(rawAngle, -42, 42);

      }

      snapshotCourt();

    },

    [setForce, snapshotCourt]

  );

  const handlePointerDown = useCallback(

    (event) => {

      if (view !== "table") return;

      event.preventDefault();

      const position = tablePosition(event);

      const player = position.x < 50 ? "p1" : "p2";

      const alreadyControlled = Array.from(dragRef.current.values()).some(

        (item) => item.player === player

      );

      if (alreadyControlled) return;

      event.currentTarget.setPointerCapture?.(event.pointerId);

      dragRef.current.set(event.pointerId, {

        player,

        lastX: position.x,

        lastY: position.y,

        lastTime: performance.now(),

      });

      movePaddle(player, position.x, position.y, 0, 0);

    },

    [movePaddle, tablePosition, view]

  );

  const handlePointerMove = useCallback(

    (event) => {

      const drag = dragRef.current.get(event.pointerId);

      if (!drag || view !== "table") return;

      event.preventDefault();

      const position = tablePosition(event);

      const now = performance.now();

      const dt = Math.max(8, now - drag.lastTime);

      const vx = (position.x - drag.lastX) / dt;

      const vy = (position.y - drag.lastY) / dt;

      drag.lastX = position.x;

      drag.lastY = position.y;

      drag.lastTime = now;

      movePaddle(drag.player, position.x, position.y, vx, vy);

    },

    [movePaddle, tablePosition, view]

  );

  const handlePointerUp = useCallback(

    (event) => {

      const drag = dragRef.current.get(event.pointerId);

      if (!drag) return;

      dragRef.current.delete(event.pointerId);

      runtimeRef.current[drag.player].vx *= 0.18;

      runtimeRef.current[drag.player].vy *= 0.18;

      setForce(drag.player, forceRef.current[drag.player] * 0.35);

    },

    [setForce]

  );

  const tryPaddleHit = useCallback(

    (player, now) => {

      const rt = runtimeRef.current;

      const paddle = rt[player];

      const ball = rt.ball;

      const isP1 = player === "p1";

      const direction = isP1 ? 1 : -1;

      const movingTowardPaddle = isP1 ? ball.vx < 0 : ball.vx > 0;

      if (!movingTowardPaddle || now < ball.hitLockUntil) {

        return false;

      }

      const dx = Math.abs(ball.x - paddle.x);

      const dy = Math.abs(ball.y - paddle.y);

      if (dx > PADDLE_RADIUS_X || dy > PADDLE_RADIUS_Y) {

        return false;

      }

      const swipeSpeed = Math.hypot(paddle.vx, paddle.vy);

      /* 0.015 是轻碰，0.15 视作满力道。 */

      const force = clamp((swipeSpeed - 0.015) / 0.135, 0, 1);

      setForce(player, force);

      const currentCap = capSpeed(capLevelsRef.current[player]);

      /* 力道决定球速：

         0% -> MIN_BALL_SPEED

         100% -> 当前玩家的 max cap */

      const shotSpeed =

        MIN_BALL_SPEED + (currentCap - MIN_BALL_SPEED) * force;

      const verticalFromSwipe = clamp(paddle.vy * 0.055, -0.024, 0.024);

      const verticalFromOffset = clamp(

        ((ball.y - paddle.y) / PADDLE_RADIUS_Y) * 0.010,

        -0.010,

        0.010

      );

      ball.vx = direction * shotSpeed;

      ball.vy = clamp(

        verticalFromSwipe + verticalFromOffset,

        -0.027,

        0.027

      );

      ball.x = paddle.x + direction * (PADDLE_RADIUS_X + 1.4);

      ball.lastHitter = player;

      ball.hitLockUntil = now + 180;

      return true;

    },

    [setForce]

  );

  useEffect(() => {

    const onKeyDown = (event) => {

      keysRef.current.add(event.key.toLowerCase());

      if (view === "table" && event.code === "Space" && !event.repeat) {

        event.preventDefault();

        startRally();

      }

    };

    const onKeyUp = (event) => {

      keysRef.current.delete(event.key.toLowerCase());

    };

    window.addEventListener("keydown", onKeyDown);

    window.addEventListener("keyup", onKeyUp);

    return () => {

      window.removeEventListener("keydown", onKeyDown);

      window.removeEventListener("keyup", onKeyUp);

    };

  }, [startRally, view]);

  useEffect(() => {

    if (view !== "table") return undefined;

    let frame;

    const loop = (time) => {

      const rt = runtimeRef.current;

      const dt = Math.min(32, Math.max(0, time - rt.lastFrame || 16));

      rt.lastFrame = time;

      const keyboardSpeed = 0.026;

      if (keysRef.current.has("a")) rt.p1.x = Math.max(5, rt.p1.x - keyboardSpeed * dt);

      if (keysRef.current.has("d")) rt.p1.x = Math.min(45, rt.p1.x + keyboardSpeed * dt);

      if (keysRef.current.has("w")) rt.p1.y = Math.max(9, rt.p1.y - keyboardSpeed * dt);

      if (keysRef.current.has("s")) rt.p1.y = Math.min(91, rt.p1.y + keyboardSpeed * dt);

      if (keysRef.current.has("arrowleft")) rt.p2.x = Math.max(55, rt.p2.x - keyboardSpeed * dt);

      if (keysRef.current.has("arrowright")) rt.p2.x = Math.min(95, rt.p2.x + keyboardSpeed * dt);

      if (keysRef.current.has("arrowup")) rt.p2.y = Math.max(9, rt.p2.y - keyboardSpeed * dt);

      if (keysRef.current.has("arrowdown")) rt.p2.y = Math.min(91, rt.p2.y + keyboardSpeed * dt);

      if (rt.rallyActive) {

        const ball = rt.ball;

        ball.x += ball.vx * dt;

        ball.y += ball.vy * dt;

        /* 极轻微空气阻力，让高力道仍然明显但不会无限飞快。 */

        ball.vx *= Math.pow(0.99986, dt);

        ball.vy *= Math.pow(0.99972, dt);

        tryPaddleHit("p1", time);

        tryPaddleHit("p2", time);

        if (ball.x < -3) {

          registerPoint("p2");

        } else if (ball.x > 103) {

          registerPoint("p1");

        } else if (ball.y < -4 || ball.y > 104) {

          registerPoint(ball.lastHitter === "p1" ? "p2" : "p1");

        }

      }

      ["p1", "p2"].forEach((player) => {

        const paddle = rt[player];

        if (time - paddle.lastMoveAt > 90) {

          paddle.vx *= 0.75;

          paddle.vy *= 0.75;

          paddle.angle *= 0.82;

          const fadedForce = forceRef.current[player] * 0.90;

          if (fadedForce < 0.01) {

            if (forceRef.current[player] !== 0) setForce(player, 0);

          } else if (Math.abs(fadedForce - forceRef.current[player]) > 0.03) {

            setForce(player, fadedForce);

          }

        }

      });

      setCourt({

        ...rt,

        p1: { ...rt.p1 },

        p2: { ...rt.p2 },

        ball: { ...rt.ball },

      });

      frame = requestAnimationFrame(loop);

    };

    runtimeRef.current.lastFrame = performance.now();

    frame = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(frame);

  }, [registerPoint, setForce, tryPaddleHit, view]);

  const setBoardFor = useCallback((player, next) => {

    if (player === "p1") {

      board1Ref.current = next;

      setBoard1(next);

    } else {

      board2Ref.current = next;

      setBoard2(next);

    }

  }, []);

  const toggleCell = useCallback(

    (player, index) => {

      const canPick =

        (conwayPhase === "p1-pick" && player === "p1") ||

        (conwayPhase === "p2-pick" && player === "p2");

      if (!canPick) return;

      const source =

        player === "p1" ? board1Ref.current : board2Ref.current;

      const next = [...source];

      if (!next[index] && countAlive(next) >= MAX_CELLS) {

        return;

      }

      next[index] = !next[index];

      setBoardFor(player, next);

    },

    [conwayPhase, setBoardFor]

  );

  const nextDraftPhase = useCallback(() => {

    if (conwayPhase === "p1-pick") {

      setConwayPhase("p2-pick");

      setConwayTime(CONWAY_PICK_SECONDS);

      return;

    }

    if (conwayPhase === "p2-pick") {

      survivalRef.current = { p1: 0, p2: 0 };

      setSurvival({ p1: 0, p2: 0 });

      setConwayPhase("evolve");

      setConwayTime(CONWAY_EVOLVE_SECONDS);

    }

  }, [conwayPhase]);

  useEffect(() => {

    if (view !== "conway") return undefined;

    if (conwayPhase === "summary" || conwayPhase === "evolve") {

      return undefined;

    }

    const timer = window.setInterval(() => {

      setConwayTime((value) => {

        if (value > 1) {

          return value - 1;

        }

        if (conwayPhase === "ready") {

          setConwayPhase("p1-pick");

          return CONWAY_PICK_SECONDS;

        }

        if (conwayPhase === "p1-pick") {

          setConwayPhase("p2-pick");

          return CONWAY_PICK_SECONDS;

        }

        if (conwayPhase === "p2-pick") {

          survivalRef.current = { p1: 0, p2: 0 };

          setSurvival({ p1: 0, p2: 0 });

          setConwayPhase("evolve");

          return CONWAY_EVOLVE_SECONDS;

        }

        return 0;

      });

    }, 1000);

    return () => window.clearInterval(timer);

  }, [conwayPhase, view]);

  useEffect(() => {

    if (view !== "conway" || conwayPhase !== "evolve") {

      return undefined;

    }

    const timer = window.setInterval(() => {

      const current1 = board1Ref.current;

      const current2 = board2Ref.current;

      if (countAlive(current1) > 0) {

        survivalRef.current.p1 += 1;

      }

      if (countAlive(current2) > 0) {

        survivalRef.current.p2 += 1;

      }

      const next1 = evolve(current1);

      const next2 = evolve(current2);

      setBoardFor("p1", next1);

      setBoardFor("p2", next2);

      setSurvival({ ...survivalRef.current });

      setConwayTime((value) => {

        if (value > 1) {

          return value - 1;

        }

        window.clearInterval(timer);

        const alive1 = countAlive(next1);

        const alive2 = countAlive(next2);

        const points1 = Math.min(

          5,

          Math.floor(survivalRef.current.p1 / 5) + (alive1 >= 3 ? 1 : 0)

        );

        const points2 = Math.min(

          5,

          Math.floor(survivalRef.current.p2 / 5) + (alive2 >= 3 ? 1 : 0)

        );

        setChallengeResult({

          p1: {

            survival: survivalRef.current.p1,

            finalCells: alive1,

            bonus: alive1 >= 3 ? 1 : 0,

            points: points1,

          },

          p2: {

            survival: survivalRef.current.p2,

            finalCells: alive2,

            bonus: alive2 >= 3 ? 1 : 0,

            points: points2,

          },

        });

        setSkillPoints((prev) => ({

          p1: prev.p1 + points1,

          p2: prev.p2 + points2,

        }));

        setConwayPhase("summary");

        return 0;

      });

    }, 1000);

    return () => window.clearInterval(timer);

  }, [conwayPhase, setBoardFor, view]);

  // Triggered by elapsed TABLE play time only (never during Conway stages).
  // Preserve match score, earned skill points and speed-cap upgrades.
  const restartConwayRound = useCallback(() => {
    if (competitionFinalizedRef.current) return;

    runtimeRef.current.rallyActive = false;
    keysRef.current.clear();
    dragRef.current.clear();

    const empty1 = makeBoard();
    const empty2 = makeBoard();
    board1Ref.current = empty1;
    board2Ref.current = empty2;
    setBoard1(empty1);
    setBoard2(empty2);
    survivalRef.current = { p1: 0, p2: 0 };
    setSurvival({ p1: 0, p2: 0 });
    setChallengeResult(null);
    setConwayTime(CONWAY_READY_SECONDS);
    setConwayPhase("ready");
    setMessage("");
    setView("conway");
  }, []);

  useEffect(() => {
    if (view !== "table" || showRules || showLeave || winner) return undefined;

    let lastTick = performance.now();
    let active = true;
    // A hidden browser tab must not count the suspended time on resume.
    const syncVisibleClock = () => { lastTick = performance.now(); };
    document.addEventListener("visibilitychange", syncVisibleClock);
    const intervalId = window.setInterval(() => {
      if (!active || competitionFinalizedRef.current) return;
      // Do not consume the clock while the page is in a background tab.
      const now = performance.now();
      const elapsed = now - lastTick;
      lastTick = now;
      if (document.visibilityState === "hidden") return;

      tableTimeLeftRef.current = Math.max(0, tableTimeLeftRef.current - elapsed);
      const seconds = Math.ceil(tableTimeLeftRef.current / 1000);
      setNextConwayIn((old) => (old === seconds ? old : seconds));

      if (tableTimeLeftRef.current <= 0) {
        active = false;
        window.clearInterval(intervalId);
        restartConwayRound();
      }
    }, 100);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", syncVisibleClock);
    };
  }, [view, showRules, showLeave, winner, restartConwayRound]);

  const resumeTable = useCallback(() => {

    const rt = runtimeRef.current;

    rt.rallyActive = false;

    rt.p1 = makePaddle("p1");

    rt.p2 = makePaddle("p2");

    rt.ball = {

      x: 50,

      y: 50,

      vx: 0,

      vy: 0,

      lastHitter: null,

      hitLockUntil: 0,

    };

    setForce("p1", 0);

    setForce("p2", 0);

    snapshotCourt();

    setMessage("");

    tableTimeLeftRef.current = CONWAY_REENTRY_SECONDS * 1000;
    setNextConwayIn(CONWAY_REENTRY_SECONDS);
    setView("table");

  }, [setForce, snapshotCourt]);

  const renderBoard = (player, board) => {

    const active =

      (conwayPhase === "p1-pick" && player === "p1") ||

      (conwayPhase === "p2-pick" && player === "p2");

    return (

      <div

        className={[

          "cw-board",

          player === "p1" ? "cw-board-blue" : "cw-board-pink",

          active ? "is-active" : "",

        ]

          .filter(Boolean)

          .join(" ")}

      >

        {board.map((alive, index) => (

          <button

            key={index}

            type="button"

            className={`cw-cell ${alive ? "alive" : ""}`}

            onClick={() => toggleCell(player, index)}

            disabled={!active}

            aria-label={`cell-${index}`}

          >

            {alive && <span />}

          </button>

        ))}

      </div>

    );

  };

  const renderPowerPanel = (player) => {

    const level = capLevels[player];

    const force = forceLevel[player];

    return (

      <section

        className={`cw-power-panel ${

          player === "p1" ? "cw-power-left" : "cw-power-right"

        }`}

      >

        <header>

          <span>{player === "p1" ? t.p1 : t.p2}</span>

          <strong>

  ✦ {skillPoints[player]} · {t.capLevel} {level}

</strong>

        </header>

        <div className="cw-force-row">

          <span>{t.force}</span>

          <div className="cw-force-track">

            <i style={{ width: `${force * 100}%` }} />

          </div>

          <strong>{Math.round(force * 100)}%</strong>

        </div>

        <div className="cw-force-labels">

          <span>{t.forceLow}</span>

          <span>{t.forceHigh}</span>

        </div>

        <button

          type="button"

          className="cw-power-upgrade"

          onClick={() => upgradePower(player)}

        >

          <i>✦</i>

          <div>

            <span>{t.onlySkill}</span>

            <strong>{t.upgradeCap}</strong>

          </div>

          <b>{POWER_SKILL_COST}✦</b>

        </button>

      </section>

    );

  };

  const activePicker =

    conwayPhase === "p1-pick"

      ? "p1"

      : conwayPhase === "p2-pick"

        ? "p2"

        : null;

  return (

    <main className="conway-page">

      <section className="cw-frame">

        {view === "entry" && (

          <section className="cw-entry">

            <img

              src={homeBackground}

              className="cw-entry-bg"

              alt=""

              draggable="false"

            />

            <div className="cw-entry-shade" />

            <header className="cw-entry-topbar">

              <div>

                <span>{t.eyebrow}</span>

                <strong>Conway Table Tennis Arena</strong>

              </div>

              <nav>

                <button

                  type="button"

                  onClick={() =>

                    setLanguage((value) => (value === "zh" ? "en" : "zh"))

                  }

                >

                  {t.language}

                </button>

                <button type="button" onClick={() => setShowRules(true)}>

                  ? {t.guide}

                </button>

              </nav>

            </header>

            <div className="cw-entry-layout">

              <section className="cw-entry-copy">

                <span className="cw-entry-badge">{t.badge}</span>

                <h1>{t.title}</h1>

                <h2>{t.englishTitle}</h2>

                <p className="cw-entry-one-liner">{t.intro}</p>

                <div className="cw-quick-flow" aria-label={t.englishTitle}>

                  <div className="cw-quick-step"><b aria-hidden="true">▦</b><span>{t.flowPick}</span></div>

                  <i aria-hidden="true">→</i>

                  <div className="cw-quick-step"><b aria-hidden="true">✦</b><span>{t.flowEarn}</span></div>

                  <i aria-hidden="true">→</i>

                  <div className="cw-quick-step"><b aria-hidden="true">◉</b><span>{t.flowPlay}</span></div>

                </div>

                <p className="cw-entry-win-rule">{t.intro2}</p>

                <button

                  type="button"

                  className="cw-entry-start"

                  onClick={startMatch}

                >

                  <span>{t.start}</span>

                  <b>✦</b>

                </button>

              </section>

              <section className="cw-entry-island" aria-hidden="true">

                <div className="cw-island-glow" />

                <img src={conwayIsland} alt="" draggable="false" />

                <div className="cw-entry-orbit orbit-a" />

                <div className="cw-entry-orbit orbit-b" />

              </section>

            </div>

          </section>

        )}

        {view === "table" && (

          <section className="cw-match cw-layout-v5 cw-layout-v6">

            <header className="cw-match-hud">

             <button
                type="button"
                className="cw-back-button"
                onClick={() => setView("entry")}
                title="Back"
              >
                ←
              </button>

              <div className="cw-score-box cw-score-left">

                <div className="cw-score-player">

                  <span>{t.p1}</span>

                  <small

                    className="cw-competition-live"

                    aria-label={`${t.p1} competition score ${competitionScores.p1}`}

                    aria-live="polite"

                  >

                    P1 SCORE <b>{competitionScores.p1}</b>

                  </small>

                </div>

                <strong>{scores.p1}</strong>

                <small>✦ {skillPoints.p1}</small>

              </div>

              <div className="cw-score-center">

                <span>{t.score}</span>

                <strong>

                  {scores.p1} <i>:</i> {scores.p2}

                </strong>
                <small className="cw-next-conway">{language === "zh" ? "距下次 CONWAY" : "NEXT CONWAY"} · {nextConwayIn}s</small>

              </div>

              <div className="cw-score-box cw-score-right">

                <div className="cw-score-player">

                  <span>{t.p2}</span>

                  <small

                    className="cw-competition-live"

                    aria-label={`${t.p2} competition score ${competitionScores.p2}`}

                    aria-live="polite"

                  >

                    P2 SCORE <b>{competitionScores.p2}</b>

                  </small>

                </div>

                <strong>{scores.p2}</strong>

                <small>✦ {skillPoints.p2}</small>

              </div>

            </header>

            <div className="cw-table-shell">

              <div className="cw-table-glow" />

              <div

                className="cw-table"

                onPointerDown={handlePointerDown}

                onPointerMove={handlePointerMove}

                onPointerUp={handlePointerUp}

                onPointerCancel={handlePointerUp}

              >

                <div className="cw-half cw-half-left">

                  <span>P1</span>

                </div>

                <div className="cw-half cw-half-right">

                  <span>P2</span>

                </div>

                <div className="cw-center-net">

                  <i />

                </div>

                <div className="cw-horizontal-line" />

                <div className="cw-quarter-line left" />

                <div className="cw-quarter-line right" />

                <div

                  className="cw-paddle cw-paddle-one"

                  style={{

                    left: `${court.p1.x}%`,

                    top: `${court.p1.y}%`,

                    "--angle": `${court.p1.angle}deg`,

                  }}

                >

                  <div className="cw-paddle-face" />

                  <div className="cw-paddle-handle" />

                  <span>P1</span>

                </div>

                <div

                  className="cw-paddle cw-paddle-two"

                  style={{

                    left: `${court.p2.x}%`,

                    top: `${court.p2.y}%`,

                    "--angle": `${court.p2.angle}deg`,

                  }}

                >

                  <div className="cw-paddle-face" />

                  <div className="cw-paddle-handle" />

                  <span>P2</span>

                </div>

                <div

                  className="cw-ball"

                  style={{

                    left: `${court.ball.x}%`,

                    top: `${court.ball.y}%`,

                  }}

                />

                {!court.rallyActive && !message && (

                  <button

                    type="button"

                    className="cw-serve-button"

                    onPointerDown={(event) => event.stopPropagation()}

                    onClick={startRally}

                  >

                    <span>{court.server === "p1" ? t.p1 : t.p2}</span>

                    <strong>{t.serve}</strong>

                    <small>TAP / SPACE</small>

                  </button>

                )}

                {message && <div className="cw-match-message">{message}</div>}

              </div>
            </div>
            <div className="cw-match-bottom cw-controls-v6" role="group" aria-label="Movement guide and player power panels">
              <div className="cw-drag-tip cw-play-instructions-v6">
                <b aria-hidden="true">↔ ↕</b>
                <div>
                  <strong>{t.dragTitle}</strong>
                  <small>{t.dragText}</small>
                </div>
                <div className="cw-keyboard-hint">
                  <span>{t.keyboard1}</span>
                  <span>{t.keyboard2}</span>
                </div>
              </div>
              {renderPowerPanel("p1")}
              {renderPowerPanel("p2")}
            </div>

          </section>

        )}

        {view === "conway" && (

          <section className={`cw-conway cw-layout-v5 cw-layout-v6 is-${conwayPhase}`}>

            <div className="cw-conway-bg" />

            <div className="cw-stage-heading-v6">
            <header className="cw-conway-top">

              <div>

                <span>CONWAY · GAME OF LIFE</span>

                <strong>

                  {conwayPhase === "ready"

                    ? t.readyTitle

                    : conwayPhase === "p1-pick"

                      ? t.p1PickTitle

                      : conwayPhase === "p2-pick"

                        ? t.p2PickTitle

                        : conwayPhase === "evolve"

                          ? t.evolveTitle

                          : t.challengeDone}

                </strong>

                <small>

                  {conwayPhase === "ready"

                    ? t.readyText

                    : conwayPhase === "p1-pick" || conwayPhase === "p2-pick"

                      ? t.pickText

                      : conwayPhase === "evolve"

                        ? t.evolveText

                        : ""}

                </small>

              </div>

              {conwayPhase !== "summary" && (

                <div className="cw-conway-clock">

                  <span>

                    {conwayPhase === "ready"

                      ? "READY"

                      : conwayPhase === "evolve"

                        ? "LIVE"

                        : "PICK"}

                  </span>

                  <strong>{conwayTime}</strong>

                  <small>SEC</small>

                </div>

              )}

            </header>

            <div className="cw-draft-flow">

              <div className={`cw-draft-step ${conwayPhase === "ready" ? "active" : "done"}`}>

                <i>01</i>

                <span>READY</span>

              </div>

              <div

                className={`cw-draft-step ${

                  conwayPhase === "p1-pick"

                    ? "active blue"

                    : ["p2-pick", "evolve", "summary"].includes(conwayPhase)

                      ? "done"

                      : ""

                }`}

              >

                <i>02</i>

                <span>P1 PICK</span>

              </div>

              <div

                className={`cw-draft-step ${

                  conwayPhase === "p2-pick"

                    ? "active pink"

                    : ["evolve", "summary"].includes(conwayPhase)

                      ? "done"

                      : ""

                }`}

              >

                <i>03</i>

                <span>P2 PICK</span>

              </div>

              <div

                className={`cw-draft-step ${

                  conwayPhase === "evolve"

                    ? "active gold"

                    : conwayPhase === "summary"

                      ? "done"

                      : ""

                }`}

              >

                <i>04</i>

                <span>EVOLVE</span>

              </div>

            </div>

            </div>

            {conwayPhase === "ready" && (

              <div className="cw-phase-intro" role="status" aria-live="polite">

                <div className="cw-phase-icons" aria-hidden="true">

                  <span>▦</span><i>→</i><span>✦</span><i>→</i><span>◉</span>

                </div>

                <strong>{t.readyTitle}</strong>

                <p>{t.phaseIntro}</p>

                <small>{t.lifeRule}</small>

              </div>

            )}

            <div className="cw-conway-layout">

              <section

                className={[

                  "cw-board-panel",

                  "cw-board-panel-one",

                  activePicker === "p1" ? "is-picking" : "",

                  activePicker === "p2" ? "is-waiting" : "",

                ]

                  .filter(Boolean)

                  .join(" ")}

              >

                <header>

                  <div>

                    <span>{t.p1}</span>

                    <strong>BLUE MATRIX</strong>

                  </div>

                  <div>

                    <small>{t.cells}</small>

                    <b>{countAlive(board1)}</b>

                  </div>

                </header>

                {renderBoard("p1", board1)}

                <footer>

                  <span>

                    {activePicker === "p1"

                      ? `${t.placed} ${countAlive(board1)} / ${MAX_CELLS}`

                      : activePicker === "p2"

                        ? t.waiting

                        : conwayPhase === "evolve"

                          ? `${t.aliveTime} ${survival.p1}s`

                          : ""}

                  </span>

                  {activePicker === "p1" && (

                    <button type="button" onClick={nextDraftPhase}>

                      {t.confirm}

                    </button>

                  )}

                </footer>

              </section>

              <section className="cw-conway-core">

                <div className="cw-life-mark">∞</div>

                <span>✦ CONWAY</span>

                <strong>

                  {conwayPhase === "ready"

                    ? "PREPARE"

                    : conwayPhase === "p1-pick"

                      ? "PLAYER 1"

                      : conwayPhase === "p2-pick"

                        ? "PLAYER 2"

                        : conwayPhase === "evolve"

                          ? `GEN ${CONWAY_EVOLVE_SECONDS - conwayTime + 1}`

                          : "RESULT"}

                </strong>

                {conwayPhase === "evolve" && <small>{t.rule}</small>}

              </section>

              <section

                className={[

                  "cw-board-panel",

                  "cw-board-panel-two",

                  activePicker === "p2" ? "is-picking" : "",

                  activePicker === "p1" ? "is-waiting" : "",

                ]

                  .filter(Boolean)

                  .join(" ")}

              >

                <header>

                  <div>

                    <span>{t.p2}</span>

                    <strong>MAGENTA MATRIX</strong>

                  </div>

                  <div>

                    <small>{t.cells}</small>

                    <b>{countAlive(board2)}</b>

                  </div>

                </header>

                {renderBoard("p2", board2)}

                <footer>

                  <span>

                    {activePicker === "p2"

                      ? `${t.placed} ${countAlive(board2)} / ${MAX_CELLS}`

                      : activePicker === "p1"

                        ? t.waiting

                        : conwayPhase === "evolve"

                          ? `${t.aliveTime} ${survival.p2}s`

                          : ""}

                  </span>

                  {activePicker === "p2" && (

                    <button type="button" onClick={nextDraftPhase}>

                      {t.confirm}

                    </button>

                  )}

                </footer>

              </section>

            </div>

            {conwayPhase === "summary" && challengeResult && (

              <div className="cw-summary-overlay">

                <section className="cw-summary-card">

                  <span className="cw-summary-kicker">CONWAY COMPLETE</span>

                  <h2>{t.challengeDone}</h2>

                  <div className="cw-summary-grid">

                    {["p1", "p2"].map((player) => {

                      const result = challengeResult[player];

                      return (

                        <article

                          key={player}

                          className={

                            player === "p1"

                              ? "cw-summary-blue"

                              : "cw-summary-pink"

                          }

                        >

                          <span>{player === "p1" ? t.p1 : t.p2}</span>

                          <div className="cw-summary-numbers" aria-label={`${t.survival} ${result.survival}s; ${t.finalCells} ${result.finalCells}`}>

                            <span>◷ {result.survival}s</span>

                            <span>● {result.finalCells}</span>

                          </div>

                          <footer>

                            <strong>+{result.points} ✦</strong>

                          </footer>

                        </article>

                      );

                    })}

                  </div>

                  <button

                    type="button"

                    className="cw-primary-button"

                    onClick={resumeTable}

                  >

                    {t.resume}

                  </button>

                </section>

              </div>

            )}

          </section>

        )}

        {view === "end" && (

          <section className="cw-end-screen">

            <div className="cw-end-card">

              <span className="cw-summary-kicker">{t.matchOver}</span>

              <div className="cw-trophy">♔</div>

              <h1>

                {winner === "p1" ? t.p1 : t.p2} {t.wins}

              </h1>

              <div className="cw-final-score">

                <strong>{scores.p1}</strong>

                <span>:</span>

                <strong>{scores.p2}</strong>

              </div>

              <section

                className="cw-final-competition"

                aria-label="Final competition scores"

              >

                <span>FINAL SCORE</span>

                <div>

                  <article className="cw-final-competition-p1">

                    <small>P1 SCORE</small>

                    <strong>

                      {finalCompetitionScores?.p1 ?? competitionScores.p1}

                    </strong>

                  </article>

                  <i aria-hidden="true" />

                  <article className="cw-final-competition-p2">

                    <small>P2 SCORE</small>

                    <strong>

                      {finalCompetitionScores?.p2 ?? competitionScores.p2}

                    </strong>

                  </article>

                </div>

              </section>

              <div className="cw-end-actions">

                <button type="button" className="cw-primary-button" onClick={returnToLobby}>

                  {t.backEntrance}

                </button>

              </div>

            </div>

          </section>

        )}

        {showRules && (

          <div className="cw-overlay" onMouseDown={() => setShowRules(false)}>

            <section

              className="cw-rules-modal"

              onMouseDown={(event) => event.stopPropagation()}

            >

              <button

                type="button"

                className="cw-close-button"

                onClick={() => setShowRules(false)}

              >

                ×

              </button>

              <span className="cw-summary-kicker">{t.howTo}</span>

              <h2>{t.title}</h2>

              <div className="cw-rules-grid">

                {[

                  ["01", t.step1, t.step1Text],

                  ["02", t.step2, t.step2Text],

                  ["03", t.step3, t.step3Text],

                  ["04", t.step4, t.step4Text],

                ].map(([number, title, text]) => (

                  <article key={number}>

                    <b>{number}</b>

                    <div>

                      <strong>{title}</strong>

                      <p>{text}</p>

                    </div>

                  </article>

                ))}

              </div>

            </section>

          </div>

        )}

        {showLeave && (

          <div className="cw-overlay" onMouseDown={() => setShowLeave(false)}>

            <section

              className="cw-leave-modal"

              onMouseDown={(event) => event.stopPropagation()}

            >

              <span className="cw-summary-kicker">{t.backEntrance}</span>

              <h2>{t.pauseTitle}</h2>

              <p>{t.pauseText}</p>

              <div className="cw-modal-actions">

                <button

                  type="button"

                  className="cw-secondary-button"

                  onClick={() => setShowLeave(false)}

                >

                  {t.stay}

                </button>

                <button

                  type="button"

                  className="cw-primary-button"

                  onClick={() => {

                    setShowLeave(false);

                    setView("entry");

                  }}

                >

                  {t.leave}

                </button>

              </div>

            </section>

          </div>

        )}

      </section>

    </main>

  );

}
