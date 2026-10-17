import { GameGuide, QuickBrief } from "../../components/GameGuide.jsx";
import { uniqueSequenceDeck, sequenceQuestionKey } from "../../scoring/shortGameRules.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./NumberSequence.css";
import hubBackground from "../../assets/home-layers/background.png";
import sequenceIsland from "../../assets/home-layers/sequence.webp";
import {
  calculateNumberSequenceScore,
  createCompetitionAttempt,
} from "../../scoring/competitionScoring.js";

const GAME_ID = "REPLACE_WITH_GAME_ID";
const MAX_HEARTS = 3;

const MUSIC_TRACKS = {
  home: `${import.meta.env.BASE_URL}audio/home.mp3`,
  battle: `${import.meta.env.BASE_URL}audio/battle.mp3`,
  boss: `${import.meta.env.BASE_URL}audio/boss.mp3`,
  victory: `${import.meta.env.BASE_URL}audio/victory.wav`,
  defeat: `${import.meta.env.BASE_URL}audio/defeat.wav`,
};

const ONE_SHOT_AUDIO = {
  enemyAttack: `${import.meta.env.BASE_URL}audio/enemy_attack.wav`,
};

const MUSIC_VOLUME = {
  home: 0.24,
  battle: 0.22,
  boss: 0.27,
  victory: 0.34,
  defeat: 0.32,
};

const SKILL_COOLDOWN = {
  insight: 3,
  blessing: 4,
};

const I18N = {
  zh: {
    brand: "MATH WEEK 2026 · 数序远征",
    title: "Number Sequence Rush",
    encounter: "关卡",
    combo: "连击",
    life: "生命",
    enemyLife: "敌人生命",
    challenge: "数序挑战",
    tapRune: "选择正确符石发动攻击",
    correct: "破防成功！",
    wrong: "判断失误 · 敌人反击",
    victory: "讨伐成功",
    victoryTitle: "封印解除",
    victoryDesc: "你击败了序列守卫，完成数序远征。",
    defeat: "挑战结束",
    defeatTitle: "符石崩落",
    defeatDesc: "三颗生命全部耗尽。",
    restart: "重新挑战",
    playAgain: "再战一次",
    boss: "最终守卫",
    guardian: "区域守卫",
    moving: "正在前进",
    firstMove: "远征开始",
    arriving: "前方出现强大气息",
    footer1: "触控挑战",
    footer2: "无需登入",
    insight: "洞察",
    insightDesc: "封印两个错误符石",
    insightRule: "仅对当前数序生效 · 冷却 3 回合",
    blessing: "加护",
    blessingDesc: "回复 1 颗生命",
    blessingRule: "满生命时不可使用 · 冷却 4 回合",
    ready: "可使用",
    used: "冷却中",
    cd: "CD",
    fullLife: "生命已满",
    sealed: "已封印",
    skillInsightCast: "洞察发动：虚假的符石正在失去光芒。",
    skillBlessingCast: "加护发动：破碎的生命重新凝聚。",
    nextBattle: "继续前进",
    clearEnemy: "敌人被击破",
    maxCombo: "最高连击",
    activeEffects: "当前增益",
    noEffects: "暂无持续效果",
    powerBuff: "破甲充能",
    powerBuffDesc: "下一次正确攻击造成 2 点伤害",
    guardBuff: "守护羽",
    guardBuffDesc: "下一次答错不会失去生命",
    journey: "远征记录",
    stageClear: "区域净化完成",
    select: "点击一个符石",
    encounterOf: "关卡",
    enemyAppears: "敌人出现",
    bossWarning: "王座震动",
    bossWarningDesc: "有什么东西……正在苏醒。",
    clearLabel: "远征完成",
    failLabel: "远征中断",
    resultTurns: "战斗回合",
    resultCombo: "最高连击",
    resultStage: "抵达区域",
    startJourney: "进入魔穴",
    homeSubtitle: "数列 · 符石 · 远征",
    homeStory: "封印松动，数序魔穴重新开启。沿着符文之路前进，在生命耗尽前击破最后的守卫。",
    enteringCave: "正在进入魔穴",
    returnEntrance: "返回入口",
    exitShort: "入口",
    exitTitle: "返回魔穴入口？",
    exitDesc: "当前远征进度会结束，战利品与技能状态将重置。",
    confirmExit: "确定返回",
    cancel: "继续战斗",
    lootSelected: "已装备 · 再点取消",
    lootCancel: "已取消装备",
  },
  en: {
    brand: "MATH WEEK 2026 · SEQUENCE EXPEDITION",
    title: "Number Sequence Rush",
    encounter: "Encounter",
    combo: "Combo",
    life: "Life",
    enemyLife: "Enemy Life",
    challenge: "Sequence Challenge",
    tapRune: "Choose the correct rune to attack",
    correct: "Armor Break!",
    wrong: "Wrong read · Enemy counterattacks",
    victory: "Victory",
    victoryTitle: "Seal Broken",
    victoryDesc: "You defeated the Sequence Warden and completed the expedition.",
    defeat: "Challenge Ended",
    defeatTitle: "Runes Collapsed",
    defeatDesc: "All three hearts are gone.",
    restart: "Restart",
    playAgain: "Play Again",
    boss: "Final Warden",
    guardian: "Area Guardian",
    moving: "Advancing",
    firstMove: "Expedition Begins",
    arriving: "A powerful presence is ahead",
    footer1: "Touchscreen challenge",
    footer2: "No login required",
    insight: "Insight",
    insightDesc: "Seal two wrong runes",
    insightRule: "Current sequence only · 3-turn cooldown",
    blessing: "Blessing",
    blessingDesc: "Restore 1 heart",
    blessingRule: "Cannot use at full life · 4-turn cooldown",
    ready: "Ready",
    used: "Cooling",
    cd: "CD",
    fullLife: "Full life",
    sealed: "Sealed",
    skillInsightCast: "Insight awakened: false runes are losing their light.",
    skillBlessingCast: "Blessing awakened: a shattered heart reforms.",
    nextBattle: "Keep moving",
    clearEnemy: "Enemy defeated",
    maxCombo: "Max combo",
    activeEffects: "Active Effects",
    noEffects: "No active effects",
    powerBuff: "Armor Charge",
    powerBuffDesc: "Next correct hit deals 2 damage",
    guardBuff: "Guard Feather",
    guardBuffDesc: "Next mistake costs no heart",
    journey: "Expedition Log",
    stageClear: "Area Cleared",
    select: "Tap a rune",
    encounterOf: "Encounter",
    enemyAppears: "Enemy Appears",
    bossWarning: "THE THRONE TREMBLES",
    bossWarningDesc: "Something ancient is waking up…",
    clearLabel: "EXPEDITION CLEARED",
    failLabel: "EXPEDITION ENDED",
    resultTurns: "Turns",
    resultCombo: "Max Combo",
    resultStage: "Reached",
    startJourney: "Enter the Cavern",
    homeSubtitle: "SEQUENCE · RUNES · EXPEDITION",
    homeStory: "The seal has weakened and the Sequence Cavern has opened again. Follow the rune path and defeat the final warden before your life runs out.",
    enteringCave: "Entering the Cavern",
    returnEntrance: "Back to Entrance",
    exitShort: "Exit",
    exitTitle: "Return to the entrance?",
    exitDesc: "Your current expedition will end and loot / skill states will reset.",
    confirmExit: "Return",
    cancel: "Keep Fighting",
    lootSelected: "Equipped · tap again to cancel",
    lootCancel: "Equipment cancelled",
  },
};

const WAVES = [
  {
    "scene": "forest",
    "chapter": {
      "zh": "第一关 · 萌芽之森",
      "en": "Encounter I · Grove of Beginnings"
    },
    "travel": {
      "zh": "你踏入符文森林。远处传来粘液滑动的声音……",
      "en": "You enter the rune forest. Something wet is moving ahead…"
    },
    "enemy": {
      "zh": "翠绿史莱姆",
      "en": "Verdant Slime",
      "kind": "slime",
      "el": "wood",
      "hp": 1,
      "intro": {
        "zh": "喂！这里的数字归我管。先解开这一道再说！",
        "en": "Hey! These numbers are mine. Solve this before you pass!"
      },
      "hit": [
        {
          "zh": "什么？你居然看穿了！",
          "en": "What? You saw through it!"
        }
      ],
      "miss": [
        {
          "zh": "嘿嘿，太急了吧？再看清楚一点。",
          "en": "Too fast! Look again."
        },
        {
          "zh": "别乱猜，我可是会反击的！",
          "en": "Stop guessing. I fight back!"
        }
      ],
      "defeat": {
        "zh": "好吧好吧……前面的家伙可比我难缠。",
        "en": "Fine… the next guardian is much worse than me."
      }
    },
    "puzzles": [
      {
        "type": "next",
        "badge": {
          "zh": "基础规律",
          "en": "BASIC PATTERN"
        },
        "prompt": {
          "zh": "找出下一颗符文",
          "en": "Find the next rune"
        },
        "flavor": {
          "zh": "第一击不需要华丽，只需要准确。",
          "en": "The first strike needs no flair—only precision."
        },
        "sequence": [
          "2",
          "4",
          "6",
          "8",
          "?"
        ],
        "options": [
          "9",
          "10",
          "12",
          "16"
        ],
        "answer": "10"
      }
    ]
  },
  {
    "scene": "cave",
    "chapter": {
      "zh": "第二关 · 幽蓝洞窟",
      "en": "Encounter II · Azure Cavern"
    },
    "travel": {
      "zh": "你穿过森林，脚步声在蓝色洞窟中不断回响……",
      "en": "You leave the forest. Your footsteps echo through an azure cavern…"
    },
    "enemy": {
      "zh": "幽蓝蝠妖",
      "en": "Azure Bat",
      "kind": "bat",
      "el": "water",
      "hp": 2,
      "intro": {
        "zh": "嘶——这里的规律会骗人。你真的敢继续吗？",
        "en": "Hiss—patterns lie in the dark. Still want to continue?"
      },
      "hit": [
        {
          "zh": "啧，你追上我的节奏了。",
          "en": "Tch. You matched my rhythm."
        },
        {
          "zh": "等等……最后一道护翼也裂了？！",
          "en": "Wait… my last wing-seal cracked?!"
        }
      ],
      "miss": [
        {
          "zh": "听见了吗？那是你错误的回声。",
          "en": "Hear that? Your mistake is echoing."
        },
        {
          "zh": "黑暗最喜欢吞掉没想清楚的答案。",
          "en": "The dark loves careless answers."
        }
      ],
      "defeat": {
        "zh": "回声停了……去吧，石像正在等你。",
        "en": "The echoes are silent… go. The stone guardian waits."
      }
    },
    "puzzles": [
      {
        "type": "missing",
        "badge": {
          "zh": "缺失符文",
          "en": "MISSING RUNE"
        },
        "prompt": {
          "zh": "补上被黑暗吞掉的数字",
          "en": "Restore the missing number"
        },
        "flavor": {
          "zh": "有时候答案不在终点，而藏在中间。",
          "en": "Sometimes the answer is hidden in the middle."
        },
        "sequence": [
          "3",
          "6",
          "?",
          "24",
          "48"
        ],
        "options": [
          "9",
          "10",
          "12",
          "18"
        ],
        "answer": "12"
      },
      {
        "type": "next",
        "badge": {
          "zh": "回声数列",
          "en": "ECHO SEQUENCE"
        },
        "prompt": {
          "zh": "让回声继续下去",
          "en": "Continue the echo"
        },
        "flavor": {
          "zh": "前两颗符文，会共同唤醒下一颗。",
          "en": "Two runes awaken the one that follows."
        },
        "sequence": [
          "1",
          "1",
          "2",
          "3",
          "5",
          "?"
        ],
        "options": [
          "6",
          "7",
          "8",
          "10"
        ],
        "answer": "8"
      },
      {
        "type": "doubling",
        "badge": {
          "zh": "回声倍增",
          "en": "ECHO DOUBLING"
        },
        "prompt": {
          "zh": "延续回声倍增",
          "en": "Continue the doubling echo"
        },
        "flavor": {
          "zh": "每一次回声，都比上一次更强。",
          "en": "Each echo returns twice as strong."
        },
        "sequence": [
          "2",
          "4",
          "8",
          "16",
          "?"
        ],
        "options": [
          "24",
          "28",
          "32",
          "36"
        ],
        "answer": "32"
      },
      {
        "type": "descending",
        "badge": {
          "zh": "逆向回声",
          "en": "DESCENDING ECHO"
        },
        "prompt": {
          "zh": "找出下一次回声",
          "en": "Find the next echo"
        },
        "flavor": {
          "zh": "声音正在以固定步伐远去。",
          "en": "The echo is fading at a constant step."
        },
        "sequence": [
          "20",
          "17",
          "14",
          "11",
          "?"
        ],
        "options": [
          "6",
          "7",
          "8",
          "9"
        ],
        "answer": "8"
      }
    ]
  },
  {
    "scene": "ruins",
    "chapter": {
      "zh": "第三关 · 黄金遗迹",
      "en": "Encounter III · Golden Ruins"
    },
    "travel": {
      "zh": "洞窟尽头出现古老阶梯。你向上走，金色符文逐渐亮起……",
      "en": "Ancient stairs rise beyond the cavern. Golden runes awaken as you climb…"
    },
    "enemy": {
      "zh": "圣光石像",
      "en": "Radiant Golem",
      "kind": "golem",
      "el": "light",
      "hp": 2,
      "intro": {
        "zh": "规则刻在石上。看不懂的人，没有资格通过。",
        "en": "The law is carved in stone. Those who cannot read it shall not pass."
      },
      "hit": [
        {
          "zh": "石核……出现裂痕。",
          "en": "A fracture… in the stone core."
        },
        {
          "zh": "你理解了古代刻纹……",
          "en": "You understood the ancient inscription…"
        }
      ],
      "miss": [
        {
          "zh": "错误答案，无法撼动千年的石壁。",
          "en": "A false answer cannot move thousand-year stone."
        },
        {
          "zh": "再观察。规律比蛮力更锋利。",
          "en": "Observe again. Pattern is sharper than force."
        }
      ],
      "defeat": {
        "zh": "法则已被理解……道路为你打开。",
        "en": "The law has been understood… the path is open."
      }
    },
    "puzzles": [
      {
        "type": "difference",
        "badge": {
          "zh": "差值阶梯",
          "en": "DIFFERENCE STEP"
        },
        "prompt": {
          "zh": "找出下一层阶梯",
          "en": "Find the next step"
        },
        "flavor": {
          "zh": "每一步都比上一步更远。",
          "en": "Each step grows farther than the last."
        },
        "sequence": [
          "2",
          "5",
          "10",
          "17",
          "?"
        ],
        "options": [
          "24",
          "26",
          "28",
          "30"
        ],
        "answer": "26"
      },
      {
        "type": "squares",
        "badge": {
          "zh": "石刻矩阵",
          "en": "STONE MATRIX"
        },
        "prompt": {
          "zh": "完成古代方阵",
          "en": "Complete the ancient matrix"
        },
        "flavor": {
          "zh": "看似不同的数字，其实来自同一种形状。",
          "en": "Different numbers can be born from the same shape."
        },
        "sequence": [
          "1",
          "4",
          "9",
          "16",
          "25",
          "?"
        ],
        "options": [
          "30",
          "32",
          "36",
          "49"
        ],
        "answer": "36"
      },
      {
        "type": "odd-step",
        "badge": {
          "zh": "奇数阶差",
          "en": "ODD DIFFERENCES"
        },
        "prompt": {
          "zh": "延续石阵阶差",
          "en": "Continue the stone-step pattern"
        },
        "flavor": {
          "zh": "阶差正在依次增加两个单位。",
          "en": "The difference grows by two each step."
        },
        "sequence": [
          "3",
          "6",
          "11",
          "18",
          "27",
          "?"
        ],
        "options": [
          "36",
          "37",
          "38",
          "40"
        ],
        "answer": "38"
      },
      {
        "type": "division",
        "badge": {
          "zh": "遗迹递减",
          "en": "RUIN DESCENT"
        },
        "prompt": {
          "zh": "完成递减符阵",
          "en": "Complete the descending rune chain"
        },
        "flavor": {
          "zh": "每一层都只留下上一层的三分之一。",
          "en": "Each layer keeps one third of the previous value."
        },
        "sequence": [
          "81",
          "27",
          "9",
          "3",
          "?"
        ],
        "options": [
          "0",
          "1",
          "2",
          "6"
        ],
        "answer": "1"
      }
    ]
  },
  {
    "scene": "volcano",
    "chapter": {
      "zh": "第四关 · 赤炎断层",
      "en": "Encounter IV · Ember Rift"
    },
    "travel": {
      "zh": "遗迹之后，大地开始发热。你跨过熔岩裂缝，继续向王座前进……",
      "en": "The earth burns beyond the ruins. You cross the lava rift and press on…"
    },
    "enemy": {
      "zh": "赤炎小魔",
      "en": "Flame Imp",
      "kind": "imp",
      "el": "fire",
      "hp": 3,
      "intro": {
        "zh": "嘿嘿嘿！三重护焰。你能打破几层？",
        "en": "Hehehe! Three flame wards. How many can you break?"
      },
      "hit": [
        {
          "zh": "喂！第一层护焰碎了！",
          "en": "Hey! My first flame ward!"
        },
        {
          "zh": "你还没完？第二层也没了！",
          "en": "Still going? There goes the second one!"
        },
        {
          "zh": "不可能……最后一层也……",
          "en": "No way… even the last one…"
        }
      ],
      "miss": [
        {
          "zh": "哈哈！交错的规律把你绕晕了吧。",
          "en": "Ha! The alternating pattern got you."
        },
        {
          "zh": "火焰不会等你慢慢想哦！",
          "en": "The flames won't wait for you!"
        }
      ],
      "defeat": {
        "zh": "王座就在前面……你最好别后悔。",
        "en": "The throne is ahead… don't say I didn't warn you."
      }
    },
    "puzzles": [
      {
        "type": "alternating",
        "badge": {
          "zh": "交错轨迹",
          "en": "ALTERNATING PATH"
        },
        "prompt": {
          "zh": "追踪交错的脚步",
          "en": "Track the alternating steps"
        },
        "flavor": {
          "zh": "两种动作交替出现，别只盯着相邻数字。",
          "en": "Two motions alternate. Don't stare only at neighbors."
        },
        "sequence": [
          "2",
          "5",
          "4",
          "7",
          "6",
          "?"
        ],
        "options": [
          "7",
          "8",
          "9",
          "10"
        ],
        "answer": "9"
      },
      {
        "type": "surge",
        "badge": {
          "zh": "倍增爆发",
          "en": "RUNE SURGE"
        },
        "prompt": {
          "zh": "在爆发前找到下一颗",
          "en": "Find the next rune before the surge"
        },
        "flavor": {
          "zh": "每一次成长，都比上一轮更猛烈。",
          "en": "Every growth is more violent than the last."
        },
        "sequence": [
          "3",
          "7",
          "16",
          "35",
          "?"
        ],
        "options": [
          "70",
          "72",
          "74",
          "76"
        ],
        "answer": "74"
      },
      {
        "type": "zigzag",
        "badge": {
          "zh": "逆焰折返",
          "en": "ZIGZAG FLAME"
        },
        "prompt": {
          "zh": "读懂来回摆动的火焰",
          "en": "Read the zigzag flame"
        },
        "flavor": {
          "zh": "方向会改变，但变化的幅度有自己的规律。",
          "en": "Direction changes, but the size of each step has a pattern."
        },
        "sequence": [
          "10",
          "9",
          "11",
          "8",
          "12",
          "?"
        ],
        "options": [
          "6",
          "7",
          "8",
          "9"
        ],
        "answer": "7"
      },
      {
        "type": "alternating-double",
        "badge": {
          "zh": "炎脉交替",
          "en": "FLAME ALTERNATION"
        },
        "prompt": {
          "zh": "追踪交替火脉",
          "en": "Track the alternating flame"
        },
        "flavor": {
          "zh": "倍增与回落交替出现。",
          "en": "Doubling and retreat alternate."
        },
        "sequence": [
          "5",
          "10",
          "8",
          "16",
          "14",
          "?"
        ],
        "options": [
          "24",
          "26",
          "28",
          "30"
        ],
        "answer": "28"
      },
      {
        "type": "recursive",
        "badge": {
          "zh": "焰核递推",
          "en": "EMBER RECURSION"
        },
        "prompt": {
          "zh": "完成焰核递推",
          "en": "Complete the ember recursion"
        },
        "flavor": {
          "zh": "每一步都在前一项的基础上倍增再加二。",
          "en": "Each step doubles the previous value, then adds two."
        },
        "sequence": [
          "1",
          "4",
          "10",
          "22",
          "46",
          "?"
        ],
        "options": [
          "90",
          "92",
          "94",
          "96"
        ],
        "answer": "94"
      }
    ]
  },
  {
    "scene": "throne",
    "chapter": {
      "zh": "终关 · 无尽王座",
      "en": "Final Encounter · Throne of Infinity"
    },
    "travel": {
      "zh": "火焰渐远，前方只剩紫色王座。六道封印在黑暗中依次亮起……",
      "en": "The flames fade. A violet throne waits ahead, guarded by six seals…"
    },
    "enemy": {
      "zh": "序列守卫",
      "en": "Sequence Warden",
      "kind": "boss",
      "el": "violet",
      "hp": 6,
      "intro": {
        "zh": "你终于来了。理解规律，与驾驭规律，是两回事。",
        "en": "You finally arrived. Understanding patterns and mastering them are not the same."
      },
      "hit": [
        {
          "zh": "第一道封印……被你击碎了。",
          "en": "The first seal… shattered."
        },
        {
          "zh": "第二道封印也在崩解。你比我预想得更快。",
          "en": "The second seal is collapsing. You are faster than I expected."
        },
        {
          "zh": "第三道封印已破。王座开始回应你的力量。",
          "en": "The third seal is gone. The throne is answering your power."
        },
        {
          "zh": "第四道封印……连空间都开始震动了。",
          "en": "The fourth seal… even space itself is trembling."
        },
        {
          "zh": "只剩最后一道外层封印。别在这里失手。",
          "en": "Only the last outer seal remains. Do not fail here."
        },
        {
          "zh": "……最后的封印，也碎了。",
          "en": "…The final seal is broken."
        }
      ],
      "miss": [
        {
          "zh": "王座不接受猜测。",
          "en": "The throne does not accept guesses."
        },
        {
          "zh": "你走了这么远，不该在这里失去冷静。",
          "en": "You came too far to lose focus here."
        }
      ],
      "defeat": {
        "zh": "……远征者，封印解除。你赢了。",
        "en": "…Challenger, the seal is broken. You win."
      }
    },
    "puzzles": [
      {
        "type": "factorial",
        "badge": {
          "zh": "阶乘封印",
          "en": "FACTORIAL SEAL"
        },
        "prompt": {
          "zh": "击碎第一道封印",
          "en": "Break the first seal"
        },
        "flavor": {
          "zh": "每一步，都乘上一个新的力量。",
          "en": "Each step multiplies by a new force."
        },
        "sequence": [
          "1",
          "2",
          "6",
          "24",
          "120",
          "?"
        ],
        "options": [
          "240",
          "360",
          "600",
          "720"
        ],
        "answer": "720"
      },
      {
        "type": "prime",
        "badge": {
          "zh": "质数封印",
          "en": "PRIME SEAL"
        },
        "prompt": {
          "zh": "找出下一颗孤独的符文",
          "en": "Find the next solitary rune"
        },
        "flavor": {
          "zh": "它们只愿意被 1 与自己整除。",
          "en": "They answer only to one and themselves."
        },
        "sequence": [
          "2",
          "3",
          "5",
          "7",
          "11",
          "?"
        ],
        "options": [
          "12",
          "13",
          "15",
          "17"
        ],
        "answer": "13"
      },
      {
        "type": "double",
        "badge": {
          "zh": "双轨封印",
          "en": "TWIN PATH SEAL"
        },
        "prompt": {
          "zh": "识破两条交织的数路",
          "en": "Read the two interwoven paths"
        },
        "flavor": {
          "zh": "奇数位与偶数位，各自前进。",
          "en": "Odd and even positions follow their own paths."
        },
        "sequence": [
          "2",
          "10",
          "4",
          "12",
          "6",
          "14",
          "?"
        ],
        "options": [
          "7",
          "8",
          "16",
          "18"
        ],
        "answer": "8"
      },
      {
        "type": "cube",
        "badge": {
          "zh": "立方封印",
          "en": "CUBE SEAL"
        },
        "prompt": {
          "zh": "击碎第五道封印",
          "en": "Break the fifth seal"
        },
        "flavor": {
          "zh": "立体的规律，藏在看似普通的数字里。",
          "en": "A three-dimensional pattern hides inside ordinary numbers."
        },
        "sequence": [
          "1",
          "8",
          "27",
          "64",
          "125",
          "?"
        ],
        "options": [
          "180",
          "196",
          "216",
          "225"
        ],
        "answer": "216"
      },
      {
        "type": "boss",
        "badge": {
          "zh": "无尽封印",
          "en": "INFINITY SEAL"
        },
        "prompt": {
          "zh": "完成最终数序",
          "en": "Complete the final sequence"
        },
        "flavor": {
          "zh": "最后一击。不要看答案，看变化本身。",
          "en": "Final strike. Don't watch the answers—watch the change."
        },
        "sequence": [
          "3",
          "8",
          "15",
          "24",
          "35",
          "?"
        ],
        "options": [
          "44",
          "46",
          "48",
          "50"
        ],
        "answer": "48"
      },
      {
        "type": "geometric",
        "badge": {
          "zh": "倍增封印",
          "en": "DOUBLING SEAL"
        },
        "prompt": {
          "zh": "击碎第六道封印",
          "en": "Break the sixth seal"
        },
        "flavor": {
          "zh": "封印正在成倍扩张。",
          "en": "The seal is multiplying itself."
        },
        "sequence": [
          "7",
          "14",
          "28",
          "56",
          "?"
        ],
        "options": [
          "96",
          "104",
          "112",
          "120"
        ],
        "answer": "112"
      },
      {
        "type": "shifted-square",
        "badge": {
          "zh": "平方封印",
          "en": "SQUARE SEAL"
        },
        "prompt": {
          "zh": "识破平方轨迹",
          "en": "Read the square trajectory"
        },
        "flavor": {
          "zh": "王座将连续平方隐藏在光环中。",
          "en": "The throne hides consecutive squares in its halo."
        },
        "sequence": [
          "4",
          "9",
          "16",
          "25",
          "36",
          "?"
        ],
        "options": [
          "42",
          "45",
          "49",
          "54"
        ],
        "answer": "49"
      },
      {
        "type": "double-plus-one",
        "badge": {
          "zh": "裂变封印",
          "en": "FISSION SEAL"
        },
        "prompt": {
          "zh": "追踪裂变数序",
          "en": "Track the fission sequence"
        },
        "flavor": {
          "zh": "每一道裂痕都会复制自身并再生一个单位。",
          "en": "Each fracture doubles itself and creates one more."
        },
        "sequence": [
          "5",
          "11",
          "23",
          "47",
          "?"
        ],
        "options": [
          "91",
          "93",
          "95",
          "97"
        ],
        "answer": "95"
      },
      {
        "type": "shrinking-difference",
        "badge": {
          "zh": "衰减封印",
          "en": "DECAY SEAL"
        },
        "prompt": {
          "zh": "完成衰减阶差",
          "en": "Complete the decaying differences"
        },
        "flavor": {
          "zh": "阶差逐次缩小，直到王座失去节奏。",
          "en": "The negative step shrinks one by one."
        },
        "sequence": [
          "30",
          "25",
          "21",
          "18",
          "16",
          "?"
        ],
        "options": [
          "14",
          "15",
          "16",
          "17"
        ],
        "answer": "15"
      },
      {
        "type": "interwoven",
        "badge": {
          "zh": "双轨封印",
          "en": "TWIN-PATH SEAL"
        },
        "prompt": {
          "zh": "读取交织双轨",
          "en": "Read the interwoven paths"
        },
        "flavor": {
          "zh": "两条数列在同一条轨道上交错前进。",
          "en": "Two sequences advance on one interwoven path."
        },
        "sequence": [
          "1",
          "10",
          "2",
          "20",
          "3",
          "30",
          "?"
        ],
        "options": [
          "4",
          "5",
          "40",
          "60"
        ],
        "answer": "4"
      }
    ]
  }
];

const WAVE_META = [
  {
    "tutorial": {
      "zh": [
        "观察数列变化",
        "选中正确符石即可攻击",
        "答错会失去 1 颗生命"
      ],
      "en": [
        "Read the pattern",
        "Tap the correct rune to attack",
        "A wrong answer costs 1 heart"
      ]
    },
    "lore": {
      "zh": "翠绿史莱姆原本只是森林里的数字精灵。长期吸收失控符文后，它开始把所有偶数当成自己的收藏品。",
      "en": "The Verdant Slime was once a harmless number spirit. After absorbing unstable runes, it began hoarding every even number it could find."
    },
    "drop": {
      "type": "power",
      "icon": "◆",
      "zh": "破甲晶核",
      "en": "Armor Core"
    },
    "minions": []
  },
  {
    "tutorial": {
      "zh": [
        "这一关出现多个敌人",
        "点击敌人可指定攻击目标",
        "不选择时会自动攻击最前方目标"
      ],
      "en": [
        "Multiple enemies appear here",
        "Tap an enemy to choose a target",
        "Without a target, the front enemy is attacked"
      ]
    },
    "lore": {
      "zh": "幽蓝蝠妖并不独自狩猎。它会用洞窟回声召集幼蝠，从不同方向干扰挑战者的判断。",
      "en": "Azure Bats never hunt alone. Their echoes call lesser bats from the cavern walls to disrupt a challenger's focus."
    },
    "drop": {
      "type": "guard",
      "icon": "◇",
      "zh": "守护羽",
      "en": "Guard Feather"
    },
    "minions": [
      {
        "id": "batling-l",
        "zh": "回声幼蝠",
        "en": "Echo Batling",
        "hp": 1,
        "el": "water",
        "icon": "◢",
        "slot": "left"
      },
      {
        "id": "batling-r",
        "zh": "幽鸣幼蝠",
        "en": "Cave Batling",
        "hp": 1,
        "el": "water",
        "icon": "◣",
        "slot": "right"
      }
    ]
  },
  {
    "tutorial": {
      "zh": [
        "先观察敌人的生命",
        "弱小敌人可以优先清除",
        "洞察只影响当前一道数序"
      ],
      "en": [
        "Watch enemy HP",
        "Small enemies can be cleared first",
        "Insight affects only the current sequence"
      ]
    },
    "lore": {
      "zh": "黄金遗迹的石像由古代数学祭司制造。两枚碎石核心负责维持它的防御阵列，因此战斗不会只有一个目标。",
      "en": "The Radiant Golem was built by ancient mathematical priests. Two shard-cores maintain its defensive formation."
    },
    "drop": {
      "type": "heal",
      "icon": "♥",
      "zh": "回春露",
      "en": "Renewal Drop"
    },
    "minions": [
      {
        "id": "shard-a",
        "zh": "左侧石核",
        "en": "Left Shard",
        "hp": 1,
        "el": "light",
        "icon": "◇",
        "slot": "left"
      },
      {
        "id": "shard-b",
        "zh": "右侧石核",
        "en": "Right Shard",
        "hp": 1,
        "el": "light",
        "icon": "◇",
        "slot": "right"
      }
    ]
  },
  {
    "tutorial": {
      "zh": [
        "敌人数量增加",
        "点击目标后会出现锁定标记",
        "战利品可留到王关再使用"
      ],
      "en": [
        "More enemies join the fight",
        "Selected targets show a lock marker",
        "Loot can be saved for the boss"
      ]
    },
    "lore": {
      "zh": "赤炎小魔负责看守王座入口。它们会把火焰分裂成小型炎灵，以数量压制闯入者。",
      "en": "Flame Imps guard the road to the throne. They split their fire into lesser spirits and overwhelm intruders by numbers."
    },
    "drop": {
      "type": "haste",
      "icon": "⌛",
      "zh": "时序沙",
      "en": "Chrono Sand"
    },
    "minions": [
      {
        "id": "ember-a",
        "zh": "炎灵",
        "en": "Emberling",
        "hp": 1,
        "el": "fire",
        "icon": "▲",
        "slot": "left"
      },
      {
        "id": "ember-b",
        "zh": "炎灵",
        "en": "Emberling",
        "hp": 1,
        "el": "fire",
        "icon": "▲",
        "slot": "right"
      }
    ]
  },
  {
    "tutorial": {
      "zh": [
        "左右护卫存活时，魔王免疫伤害",
        "先击败两名护卫；护卫不会复活",
        "必须掌握攻击顺序与技能 CD"
      ],
      "en": [
        "The boss is immune while either guard lives",
        "Defeat both guards first; they do not revive",
        "Manage target order and skill cooldowns"
      ]
    },
    "lore": {
      "zh": "两名封印护卫保护着序列守卫。先击败护卫，再攻击首领；护卫不会复活。",
      "en": "Two Seal Guards protect the Sequence Warden. Defeat them first, then attack the boss. Guards stay defeated."
    },
    "drop": null,
    "minions": [
      {
        "id": "seal-l",
        "zh": "左封印妖",
        "en": "Left Seal Imp",
        "hp": 2,
        "el": "violet",
        "icon": "◀",
        "revive": 3,
        "slot": "left"
      },
      {
        "id": "seal-r",
        "zh": "右封印妖",
        "en": "Right Seal Imp",
        "hp": 2,
        "el": "violet",
        "icon": "▶",
        "revive": 3,
        "slot": "right"
      }
    ]
  }
];

// Two encounters; guards stay defeated. The run-wide deck never cycles.
WAVES[0].enemy.hp = 3;
WAVE_META[0].minions = [
  { id:"grove-l", zh:"符文幼芽", en:"Rune Sprout", hp:1, el:"wood", icon:"◆", slot:"left" },
  { id:"grove-r", zh:"符文幼芽", en:"Rune Sprout", hp:1, el:"wood", icon:"◆", slot:"right" },
];
WAVES[WAVES.length - 1].enemy.hp = 2;
WAVE_META[WAVES.length - 1].minions.forEach(unit => { unit.hp = 1; unit.revive = null; });
const RUN_PUZZLES = uniqueSequenceDeck(WAVES);
const ACTIVE_WAVE_INDICES = [0, WAVES.length - 1];
const ACTIVE_WAVE_COUNT = ACTIVE_WAVE_INDICES.length;
const FINAL_WAVE_INDEX = ACTIVE_WAVE_INDICES[ACTIVE_WAVE_COUNT - 1];

const LOOT_TEXT = {
  power: {
    zh: "下一次正确攻击造成 2 点伤害",
    en: "Your next correct attack deals 2 damage",
  },
  guard: {
    zh: "抵挡下一次答错造成的生命损失",
    en: "Block the next heart loss from a wrong answer",
  },
  heal: {
    zh: "回复 1 颗生命；满生命时无法使用",
    en: "Restore 1 heart; unavailable at full life",
  },
  haste: {
    zh: "洞察与加护的冷却各减少 2 回合",
    en: "Reduce both skill cooldowns by 2 turns",
  },
};

const ELEMENTS = ["fire", "water", "wood", "light"];
const ELEMENT_RGB = {
  fire: "255 105 79",
  water: "77 173 255",
  wood: "94 219 137",
  light: "255 210 92",
};

const ENEMY_RGB = {
  wood: "94 219 137",
  water: "77 173 255",
  light: "255 210 92",
  fire: "255 105 79",
  violet: "178 108 255",
};

const RUNE_SIGILS = ["◆", "◈", "▲", "✦"];

export default function NumberSequence({ onHome, onPostGameHome }) {
  const [lang, setLang] = useState("en");
  const [waveIndex, setWaveIndex] = useState(0);
  const [puzzleIndex, setPuzzleIndex] = useState(0);

  const [enemyHp, setEnemyHp] = useState(WAVES[0].enemy.hp);
  const [hearts, setHearts] = useState(MAX_HEARTS);

  const [phase, setPhase] = useState("travel");
  const [status, setStatus] = useState("playing");
  const [selected, setSelected] = useState(null);

  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);

  const [cooldowns, setCooldowns] = useState({
    insight: 0,
    blessing: 0,
  });

  const [bossApproach, setBossApproach] = useState(false);
  const [sealedOptions, setSealedOptions] = useState([]);
  const [dialogue, setDialogue] = useState(null);
  const [toast, setToast] = useState(null);

  const [enemyHit, setEnemyHit] = useState(false);
  const [enemyAttacking, setEnemyAttacking] = useState(false);
  const [enemyDying, setEnemyDying] = useState(false);
  const [shake, setShake] = useState(false);
  const [redFlash, setRedFlash] = useState(false);
  const [deathFx, setDeathFx] = useState(false);

  const [fx, setFx] = useState([]);

  const [turnCount, setTurnCount] = useState(0);
  const [totalTurns, setTotalTurns] = useState(0);
  const [minions, setMinions] = useState([]);
  const [minionHitId, setMinionHitId] = useState(null);
  const [counterSourceId, setCounterSourceId] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState("main");
  const [inventory, setInventory] = useState([]);
  const [powerReady, setPowerReady] = useState(false);
  const [guardReady, setGuardReady] = useState(false);
  const [lootFlash, setLootFlash] = useState(null);
  const [canvasScale, setCanvasScale] = useState({ x: 1, y: 1 });
  const [mainGone, setMainGone] = useState(false);
  const [gameMode, setGameMode] = useState("home");
  const musicOn = true;
  const sfxOn = true;
  const [confirmHome, setConfirmHome] = useState(false);
  const [powerItemUid, setPowerItemUid] = useState(null);
  const [guardItemUid, setGuardItemUid] = useState(null);
  const [competitionStats, setCompetitionStats] = useState({
    uniqueCorrect: 0,
    firstTryCorrect: 0,
    completedEncounters: 0,
  });
  const [competitionResult, setCompetitionResult] = useState(null);
  const [initialCompetitionAttempt] = useState(() =>
    createCompetitionAttempt("number-sequence")
  );

  const shellRef = useRef(null);
  const canvasRef = useRef(null);
  const enemyRef = useRef(null);
  const winReported = useRef(false);
  const timers = useRef(new Set());
  const fxSeq = useRef(0);
  const toastSeq = useRef(0);
  const dialogueSeq = useRef(0);
  const audioRef = useRef({
    ctx: null,
    master: null,
    sfx: null,
    score: null,
    sfxOn: true,
  });

  const musicRef = useRef({
    player: null,
    key: null,
    unlocked: false,
    fadeTimer: null,
    switchTimer: null,
  });

  const resultSoundRef = useRef(null);
  const resultScoreNodesRef = useRef([]);
  const competitionAttemptRef = useRef(initialCompetitionAttempt);
  const competitionStatsRef = useRef({
    uniqueCorrect: 0,
    firstTryCorrect: 0,
    completedEncounters: 0,
  });
  const attemptedQuestionIdsRef = useRef(new Set());
  const rewardedQuestionIdsRef = useRef(new Set());
  const completedEncounterIdsRef = useRef(new Set());

  const t = I18N[lang];
  const wave = WAVES[waveIndex];
  const enemy = wave.enemy;
  const puzzle = RUN_PUZZLES[Math.min(puzzleIndex, RUN_PUZZLES.length - 1)];
  const routeIndex = ACTIVE_WAVE_INDICES.indexOf(waveIndex);
  const isFinalWave = waveIndex === FINAL_WAVE_INDEX;
  const waveMeta = WAVE_META[waveIndex];
  const aliveMinions = minions.filter((unit) => unit.hp > 0);
  const bossShielded = isFinalWave && aliveMinions.length > 0;
  const showMainEnemy = enemyHp > 0 || enemyDying;
  const showMainHud = enemyHp > 0;
  const currentQuestionId = sequenceQuestionKey(puzzle);
  const liveCompetitionScore = calculateNumberSequenceScore({
    ...competitionStats,
    victory: false,
  });
  const displayedCompetitionScore =
    competitionResult?.finalScore ?? liveCompetitionScore;

  const enemyHpPercent = useMemo(
    () => Math.max(0, Math.min(100, (enemyHp / enemy.hp) * 100)),
    [enemyHp, enemy.hp]
  );

  const later = useCallback((fn, ms) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, ms);
    timers.current.add(id);
    return id;
  }, []);

  useEffect(() => {
    const store = timers.current;
    return () => {
      store.forEach((id) => window.clearTimeout(id));
      store.clear();

      stopResultScore();

      const audio = audioRef.current;
      try { audio.ctx?.close?.(); } catch {}

      const music = musicRef.current;
      if (music.fadeTimer) window.clearInterval(music.fadeTimer);
      if (music.switchTimer) window.clearTimeout(music.switchTimer);

      if (music.player) {
        try {
          music.player.pause();
          music.player.src = "";
        } catch {}
      }
    };
  }, []);

  useEffect(() => {
    const DESIGN_WIDTH = 1440;
    const DESIGN_HEIGHT = 960;
    const shell = shellRef.current;

    if (!shell) return;

    // IMPORTANT:
    // Use ONE uniform scale for both axes so circles, text and artwork
    // are never stretched.
    //
    // Keep the complete 1440×960 composition visible at every viewport size.
    const updateCanvasScale = () => {
      const { width, height } = shell.getBoundingClientRect();

      const scaleX = width / DESIGN_WIDTH;
      const scaleY = height / DESIGN_HEIGHT;
      const rawScale = Math.min(scaleX, scaleY);

      const scale =
        Number.isFinite(rawScale) && rawScale > 0 ? rawScale : 1;

      setCanvasScale({
        x: scale,
        y: scale,
      });
    };

    updateCanvasScale();

    window.addEventListener("resize", updateCanvasScale);

    return () => {
      window.removeEventListener("resize", updateCanvasScale);
    };
  }, [gameMode]);

  useEffect(() => {
    if (!musicOn) return;

    const music = musicRef.current;
    const player = ensureMusicPlayer();

    player.src = MUSIC_TRACKS.home;
    player.loop = true;
    player.volume = MUSIC_VOLUME.home;
    music.key = "home";

    player.play()
      .then(() => {
        music.unlocked = true;
      })
      .catch(() => {
        // Browser autoplay policy can block this.
        // The first pointer interaction will unlock and start it.
        player.pause();
        player.currentTime = 0;
        player.volume = 0;
      });
  }, []);

  function ensureAudio() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    const current = audioRef.current;

    if (!current.ctx) {
      const ctx = new AudioContextClass();
      const master = ctx.createGain();
      const sfx = ctx.createGain();
      const score = ctx.createGain();

      master.gain.value = 0.92;
      sfx.gain.value = sfxOn ? 0.96 : 0;
      score.gain.value = musicOn ? 0.34 : 0;

      sfx.connect(master);
      score.connect(master);
      master.connect(ctx.destination);

      current.ctx = ctx;
      current.master = master;
      current.sfx = sfx;
      current.score = score;
      current.sfxOn = sfxOn;
    }

    if (current.ctx.state === "suspended") {
      current.ctx.resume().catch(() => {});
    }

    return current;
  }

  function playTone(frequency, duration = 0.2, options = {}) {
    const audio = ensureAudio();
    if (!audio?.ctx || !audio.sfxOn) return;

    const {
      type = "sine",
      gain = 0.1,
      endFrequency = frequency,
      delay = 0,
      attack = 0.008,
    } = options;

    const now = audio.ctx.currentTime + delay;
    const oscillator = audio.ctx.createOscillator();
    const envelope = audio.ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(20, frequency), now);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(20, endFrequency),
      now + duration
    );

    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(
      Math.max(0.0002, gain),
      now + Math.min(attack, duration * 0.45)
    );
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(envelope);
    envelope.connect(audio.sfx);

    oscillator.start(now);
    oscillator.stop(now + duration + 0.04);
  }

  function playNoise(duration = 0.15, options = {}) {
    const audio = ensureAudio();
    if (!audio?.ctx || !audio.sfxOn) return;

    const {
      gain = 0.08,
      delay = 0,
      filterType = "lowpass",
      frequency = 1200,
      endFrequency = 260,
      attack = 0.004,
    } = options;

    const ctx = audio.ctx;
    const now = ctx.currentTime + delay;

    const frameCount = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < frameCount; i += 1) {
      const fade = 1 - i / frameCount;
      data[i] = (Math.random() * 2 - 1) * fade;
    }

    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const envelope = ctx.createGain();

    source.buffer = buffer;

    filter.type = filterType;
    filter.frequency.setValueAtTime(Math.max(40, frequency), now);
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(40, endFrequency),
      now + duration
    );
    filter.Q.value = filterType === "bandpass" ? 0.9 : 0.4;

    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(
      Math.max(0.0002, gain),
      now + Math.min(attack, duration * 0.35)
    );
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(audio.sfx);

    source.start(now);
    source.stop(now + duration + 0.03);
  }

  function playSfx(kind) {
    const audio = ensureAudio();
    if (!audio?.sfxOn) return;

    if (kind === "click") {
      playTone(150, 0.075, {
        type: "triangle",
        gain: 0.085,
        endFrequency: 96,
        attack: 0.002,
      });
      playNoise(0.065, {
        gain: 0.045,
        filterType: "bandpass",
        frequency: 1850,
        endFrequency: 680,
        attack: 0.002,
      });
      return;
    }

    if (kind === "portal") {
      playTone(62, 1.15, {
        type: "sine",
        gain: 0.16,
        endFrequency: 210,
        attack: 0.04,
      });
      playNoise(1.0, {
        gain: 0.055,
        filterType: "bandpass",
        frequency: 320,
        endFrequency: 2400,
        attack: 0.08,
      });
      playTone(180, 0.8, {
        type: "triangle",
        gain: 0.05,
        endFrequency: 540,
        delay: 0.18,
        attack: 0.04,
      });
      return;
    }

    if (kind === "attack") {
      // Heavy rune release: deep body + sharp air slash.
      playTone(92, 0.30, {
        type: "sine",
        gain: 0.19,
        endFrequency: 44,
        attack: 0.002,
      });
      playNoise(0.26, {
        gain: 0.14,
        filterType: "bandpass",
        frequency: 3200,
        endFrequency: 430,
        attack: 0.002,
      });
      playTone(610, 0.18, {
        type: "triangle",
        gain: 0.07,
        endFrequency: 140,
        attack: 0.002,
      });
      return;
    }

    if (kind === "hit") {
      // Serious impact: sub hit + dense stone / metal transient.
      playTone(72, 0.38, {
        type: "sine",
        gain: 0.26,
        endFrequency: 31,
        attack: 0.002,
      });
      playNoise(0.18, {
        gain: 0.21,
        filterType: "lowpass",
        frequency: 2200,
        endFrequency: 210,
        attack: 0.001,
      });
      playTone(285, 0.14, {
        type: "triangle",
        gain: 0.085,
        endFrequency: 78,
        delay: 0.01,
        attack: 0.001,
      });
      return;
    }

    if (kind === "wrong") {
      playTone(112, 0.44, {
        type: "sine",
        gain: 0.13,
        endFrequency: 48,
      });
      playNoise(0.28, {
        gain: 0.075,
        filterType: "lowpass",
        frequency: 620,
        endFrequency: 100,
        delay: 0.02,
      });
      return;
    }

    if (kind === "skill") {
      [220, 330, 495].forEach((note, index) =>
        playTone(note, 0.52, {
          type: "sine",
          gain: 0.055,
          endFrequency: note * 1.015,
          delay: index * 0.07,
          attack: 0.035,
        })
      );
      playNoise(0.5, {
        gain: 0.025,
        filterType: "bandpass",
        frequency: 700,
        endFrequency: 1800,
      });
      return;
    }

    if (kind === "heal") {
      [293.66, 392, 523.25].forEach((note, index) =>
        playTone(note, 0.56, {
          type: "sine",
          gain: 0.05,
          delay: index * 0.09,
          attack: 0.03,
        })
      );
      return;
    }

    if (kind === "loot") {
      [196, 293.66, 440].forEach((note, index) =>
        playTone(note, 0.62, {
          type: index === 0 ? "triangle" : "sine",
          gain: 0.048,
          delay: index * 0.1,
          attack: 0.025,
        })
      );
      playNoise(0.32, {
        gain: 0.025,
        filterType: "bandpass",
        frequency: 1700,
        endFrequency: 700,
      });
      return;
    }

    if (kind === "revive") {
      playTone(58, 0.82, {
        type: "sine",
        gain: 0.13,
        endFrequency: 170,
        attack: 0.08,
      });
      playNoise(0.75, {
        gain: 0.06,
        filterType: "bandpass",
        frequency: 230,
        endFrequency: 1500,
        attack: 0.07,
      });
      return;
    }

    if (kind === "wave") {
      playTone(58, 0.85, {
        type: "sine",
        gain: 0.13,
        endFrequency: 128,
        attack: 0.06,
      });
      playNoise(0.72, {
        gain: 0.09,
        filterType: "bandpass",
        frequency: 360,
        endFrequency: 2100,
        attack: 0.04,
      });
      playTone(196, 0.55, {
        type: "triangle",
        gain: 0.055,
        endFrequency: 293.66,
        delay: 0.23,
        attack: 0.04,
      });
      return;
    }

    if (kind === "victory") {
      // Solemn clear chord rather than a playful jingle.
      [
        [146.83, 0],
        [220, 0.08],
        [293.66, 0.18],
        [440, 0.38],
      ].forEach(([note, delay], index) =>
        playTone(note, 1.15 - index * 0.08, {
          type: index < 2 ? "triangle" : "sine",
          gain: index === 0 ? 0.085 : 0.06,
          delay,
          endFrequency: note * 1.004,
          attack: 0.07,
        })
      );
      playNoise(0.7, {
        gain: 0.018,
        filterType: "bandpass",
        frequency: 900,
        endFrequency: 2400,
        delay: 0.25,
        attack: 0.12,
      });
      return;
    }

    if (kind === "defeat") {
      playTone(110, 1.15, {
        type: "triangle",
        gain: 0.1,
        endFrequency: 48,
        attack: 0.035,
      });
      playTone(82.41, 1.0, {
        type: "sine",
        gain: 0.085,
        endFrequency: 38,
        delay: 0.16,
        attack: 0.04,
      });
      playNoise(0.72, {
        gain: 0.065,
        filterType: "lowpass",
        frequency: 520,
        endFrequency: 70,
        delay: 0.05,
        attack: 0.025,
      });
    }
  }

  function stopResultScore() {
    resultScoreNodesRef.current.forEach((node) => {
      try { node.stop?.(); } catch {}
      try { node.disconnect?.(); } catch {}
    });
    resultScoreNodesRef.current = [];
  }

  function playScoreTone(frequency, duration, options = {}) {
    const audio = ensureAudio();
    if (!audio?.ctx || !audio.score) return;

    const {
      type = "sine",
      gain = 0.05,
      delay = 0,
      attack = 0.12,
      endFrequency = frequency,
    } = options;

    const now = audio.ctx.currentTime + delay;
    const oscillator = audio.ctx.createOscillator();
    const envelope = audio.ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(1, endFrequency),
      now + duration
    );

    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(
      Math.max(0.0002, gain),
      now + Math.min(attack, duration * 0.35)
    );
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(envelope);
    envelope.connect(audio.score);

    resultScoreNodesRef.current.push(oscillator);
    oscillator.onended = () => {
      resultScoreNodesRef.current =
        resultScoreNodesRef.current.filter((node) => node !== oscillator);
      try { oscillator.disconnect(); } catch {}
      try { envelope.disconnect(); } catch {}
    };

    oscillator.start(now);
    oscillator.stop(now + duration + 0.05);
  }

  function playResultScore(kind) {
    stopResultScore();

    const audio = ensureAudio();
    if (!audio?.score) return;

    audio.score.gain.setTargetAtTime(
      0.34,
      audio.ctx.currentTime,
      0.05
    );

    if (kind === "victory") {
      // Solemn, resolved clear theme — slow and weighty, not a playful jingle.
      [
        [73.42, 0.00, 4.8, 0.070],
        [110.00, 0.00, 4.6, 0.052],
        [146.83, 0.18, 4.2, 0.045],
        [174.61, 1.10, 3.4, 0.036],
        [220.00, 2.05, 2.5, 0.030],
      ].forEach(([note, delay, duration, gain], index) =>
        playScoreTone(note, duration, {
          type: index < 2 ? "triangle" : "sine",
          gain,
          delay,
          attack: 0.18,
          endFrequency: note * 1.002,
        })
      );
      return;
    }

    // Defeat: dark descending drone.
    [
      [92.50, 0.00, 4.6, 0.066],
      [69.30, 0.35, 4.2, 0.052],
      [55.00, 1.00, 3.7, 0.046],
      [46.25, 1.70, 3.0, 0.040],
    ].forEach(([note, delay, duration, gain], index) =>
      playScoreTone(note, duration, {
        type: index === 0 ? "triangle" : "sine",
        gain,
        delay,
        attack: 0.16,
        endFrequency: note * 0.88,
      })
    );
  }

  function playOneShotAudio(src, volume = 0.8) {
    if (!sfxOn || !src) return;

    const player = new Audio(src);
    player.preload = "auto";
    player.volume = Math.max(0, Math.min(1, volume));

    player.play().catch(() => {});
    player.onended = () => {
      player.src = "";
    };
  }

  function ensureMusicPlayer() {
    const music = musicRef.current;

    if (!music.player) {
      const player = new Audio();
      player.loop = true;
      player.preload = "auto";
      player.volume = 0;
      music.player = player;
    }

    return music.player;
  }

  function clearMusicTimers() {
    const music = musicRef.current;

    if (music.fadeTimer) {
      window.clearInterval(music.fadeTimer);
      music.fadeTimer = null;
    }

    if (music.switchTimer) {
      window.clearTimeout(music.switchTimer);
      music.switchTimer = null;
    }
  }

  function fadeMusicTo(targetVolume, duration = 360) {
    const music = musicRef.current;
    const player = ensureMusicPlayer();

    clearMusicTimers();

    const start = player.volume;
    const target = Math.max(0, Math.min(1, targetVolume));
    const steps = 12;
    const stepMs = Math.max(16, Math.floor(duration / steps));
    let step = 0;

    music.fadeTimer = window.setInterval(() => {
      step += 1;
      const progress = Math.min(1, step / steps);
      player.volume = start + (target - start) * progress;

      if (progress >= 1) {
        window.clearInterval(music.fadeTimer);
        music.fadeTimer = null;

        if (target === 0 && !musicOn) {
          player.pause();
        }
      }
    }, stepMs);
  }

  function desiredMusicKey() {
    if (gameMode === "home" || gameMode === "entering") return "home";
    if (gameMode !== "game") return null;
    if (status === "won") return "victory";
    if (status === "lost") return "defeat";
    if (bossApproach || isFinalWave) return "boss";
    return "battle";
  }

  function playMusic(key) {
    if (!key || !musicOn) return;

    const music = musicRef.current;
    const player = ensureMusicPlayer();

    if (!music.unlocked) return;

    const nextSrc = MUSIC_TRACKS[key];
    const nextVolume = MUSIC_VOLUME[key] ?? 0.3;

    if (music.key === key && player.src) {
      player.play().catch(() => {});
      fadeMusicTo(nextVolume, 260);
      return;
    }

    clearMusicTimers();

    const switchTrack = () => {
      music.key = key;
      player.src = nextSrc;
      player.loop = true;
      player.currentTime = 0;
      player.volume = 0;
      player.load();

      player
        .play()
        .then(() => fadeMusicTo(nextVolume, 520))
        .catch(() => {});
    };

    if (!player.paused && player.volume > 0.02) {
      const start = player.volume;
      let step = 0;
      const steps = 8;

      music.fadeTimer = window.setInterval(() => {
        step += 1;
        player.volume = Math.max(0, start * (1 - step / steps));

        if (step >= steps) {
          window.clearInterval(music.fadeTimer);
          music.fadeTimer = null;
          player.pause();
          switchTrack();
        }
      }, 28);
    } else {
      switchTrack();
    }
  }

  function pauseMusic(duration = 320) {
    const music = musicRef.current;
    const player = music.player;
    if (!player) return;

    clearMusicTimers();

    const start = player.volume;
    const steps = 10;
    let step = 0;

    music.fadeTimer = window.setInterval(() => {
      step += 1;
      player.volume = Math.max(0, start * (1 - step / steps));

      if (step >= steps) {
        window.clearInterval(music.fadeTimer);
        music.fadeTimer = null;
        player.pause();
      }
    }, Math.max(18, Math.floor(duration / steps)));
  }

  function unlockAudioExperience() {
    ensureAudio();

    const music = musicRef.current;
    if (music.unlocked) return;

    music.unlocked = true;

    const key = desiredMusicKey();
    if (musicOn && key) playMusic(key);
  }

  useEffect(() => {
    const audio = audioRef.current;
    audio.sfxOn = sfxOn;

    if (audio.ctx && audio.sfx) {
      audio.sfx.gain.setTargetAtTime(
        sfxOn ? 0.96 : 0,
        audio.ctx.currentTime,
        0.025
      );
    }
  }, [sfxOn]);

  useEffect(() => {
    const music = musicRef.current;

    if (!music.unlocked) return;

    const key = desiredMusicKey();

    if (!musicOn || !key) {
      pauseMusic(420);
      return;
    }

    playMusic(key);
  }, [musicOn, gameMode, waveIndex, bossApproach, status]);


  const spawnFx = useCallback(
    (item, ttl = 900) => {
      const id = ++fxSeq.current;
      setFx((prev) => [...prev, { id, ...item }]);
      later(() => {
        setFx((prev) => prev.filter((entry) => entry.id !== id));
      }, ttl);
    },
    [later]
  );

  const showToast = useCallback(
    (text, kind = "info") => {
      const id = ++toastSeq.current;
      setToast({ id, text, kind });

      later(() => {
        setToast((current) => (current?.id === id ? null : current));
      }, 1800);
    },
    [later]
  );

  const showDialogue = useCallback(
    (text, kind = "intro", ttl = 3200, speaker = null) => {
      const id = ++dialogueSeq.current;
      setDialogue({ id, text, kind, speaker });

      later(() => {
        setDialogue((current) => (current?.id === id ? null : current));
      }, ttl);
    },
    [later]
  );

  const reportWin = useCallback(() => {
    if (winReported.current) return;
    winReported.current = true;

    window.parent.postMessage(
      {
        type: "mathweek:report-win",
        gameId: GAME_ID,
      },
      "*"
    );
  }, []);

  function resetCompetitionScoring() {
    const initialStats = {
      uniqueCorrect: 0,
      firstTryCorrect: 0,
      completedEncounters: 0,
    };

    competitionAttemptRef.current = createCompetitionAttempt("number-sequence");
    competitionStatsRef.current = initialStats;
    attemptedQuestionIdsRef.current = new Set();
    rewardedQuestionIdsRef.current = new Set();
    completedEncounterIdsRef.current = new Set();
    setCompetitionStats(initialStats);
    setCompetitionResult(null);
  }

  function recordCompetitionAnswer(isCorrect) {
    const isFirstAttempt = !attemptedQuestionIdsRef.current.has(currentQuestionId);
    attemptedQuestionIdsRef.current.add(currentQuestionId);

    if (!isCorrect || rewardedQuestionIdsRef.current.has(currentQuestionId)) return;

    rewardedQuestionIdsRef.current.add(currentQuestionId);
    const current = competitionStatsRef.current;
    const next = {
      ...current,
      uniqueCorrect: current.uniqueCorrect + 1,
      firstTryCorrect: current.firstTryCorrect + (isFirstAttempt ? 1 : 0),
    };
    competitionStatsRef.current = next;
    setCompetitionStats(next);
  }

  function recordCompletedEncounter() {
    const encounterId = `wave-${waveIndex}`;
    if (completedEncounterIdsRef.current.has(encounterId)) return;

    completedEncounterIdsRef.current.add(encounterId);
    const current = competitionStatsRef.current;
    const next = {
      ...current,
      completedEncounters: Math.min(
        ACTIVE_WAVE_COUNT,
        completedEncounterIdsRef.current.size
      ),
    };
    competitionStatsRef.current = next;
    setCompetitionStats(next);
  }

  function finalizeCompetitionRun(victory) {
    const finalScore = calculateNumberSequenceScore({
      ...competitionStatsRef.current,
      victory,
    });
    const result = competitionAttemptRef.current.finalize({
      playerSlot: "single",
      finalScore,
      outcome: victory ? "win" : "loss",
    });
    setCompetitionResult(result);
    return result;
  }

  const beginBattle = useCallback(
    (index) => {
      const nextWave = WAVES[index];

      setWaveIndex(index);

      setEnemyHp(nextWave.enemy.hp);
      setHearts(MAX_HEARTS);
      setMinions(
        WAVE_META[index].minions.map((unit) => ({
          ...unit,
          hp: unit.hp,
          maxHp: unit.hp,
          reviveAt: null,
        }))
      );
      setSelectedTarget(null);
      setTurnCount(0);
      setMinionHitId(null);
      setCounterSourceId(null);
      setStatus("playing");
      setSelected(null);
      setSealedOptions([]);
      setEnemyHit(false);
      setEnemyAttacking(false);
      setEnemyDying(false);
      setMainGone(false);
      setDeathFx(false);
      setBossApproach(false);
      setPhase("travel");
      setDialogue(null);

      later(() => {
        setPhase("arrival");
      }, 1650);

      later(() => {
        setPhase("battle");
        showDialogue(nextWave.enemy.intro[lang], "intro", 4200);
      }, 2350);
    },
    [lang, later, showDialogue]
  );

  function resetRunState() {
    resetCompetitionScoring();
    setWaveIndex(0);
    setPuzzleIndex(0);
    setEnemyHp(WAVES[0].enemy.hp);
    setHearts(MAX_HEARTS);

    setPhase("travel");
    setStatus("playing");
    setSelected(null);

    setCombo(0);
    setMaxCombo(0);
    setCooldowns({ insight: 0, blessing: 0 });

    setBossApproach(false);
    setSealedOptions([]);
    setDialogue(null);
    setToast(null);

    setEnemyHit(false);
    setEnemyAttacking(false);
    setEnemyDying(false);
    setShake(false);
    setRedFlash(false);
    setDeathFx(false);
    setFx([]);

    setTurnCount(0);
    setTotalTurns(0);
    setMinions([]);
    setMinionHitId(null);
    setCounterSourceId(null);
    setSelectedTarget(null);

    setInventory([]);
    setPowerReady(false);
    setGuardReady(false);
    setPowerItemUid(null);
    setGuardItemUid(null);
    setLootFlash(null);

    setMainGone(false);
    setConfirmHome(false);

    winReported.current = false;
    resultSoundRef.current = null;
    stopResultScore();
  }

  function startGame() {
    unlockAudioExperience();
    resetRunState();
    playSfx("portal");
    setGameMode("entering");

    later(() => {
      setGameMode("game");
      beginBattle(0);
    }, 1750);
  }

  function returnHome() {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current.clear();

    resetRunState();
    setGameMode("home");
  }

  function requestReturnHome() {
    setConfirmHome(true);
  }

  function toggleLang() {
    setDialogue(null);
    setToast(null);
    setLang((value) => (value === "zh" ? "en" : "zh"));
  }

  function handleGlobalPointerDown(event) {
    unlockAudioExperience();

    const button = event.target?.closest?.("button");
    if (!button || button.disabled) return;

    if (sfxOn) playSfx("click");
  }

  function currentEnemyHitLine(newHp) {
    const hitIndex = Math.min(
      enemy.hit.length - 1,
      Math.max(0, enemy.hp - newHp - 1)
    );

    return enemy.hit[hitIndex]?.[lang] ?? enemy.hit[0][lang];
  }

  function currentMissLine() {
    const index = Math.floor(Math.random() * enemy.miss.length);
    return enemy.miss[index][lang];
  }

  function tickSkillCooldowns() {
    setCooldowns((current) => ({
      insight: Math.max(0, current.insight - 1),
      blessing: Math.max(0, current.blessing - 1),
    }));
  }

  function useInsight() {
    if (
      cooldowns.insight > 0 ||
      phase !== "battle" ||
      status !== "playing" ||
      enemyAttacking
    ) {
      return;
    }

    const wrong = puzzle.options.filter((option) => option !== puzzle.answer);

    setCooldowns((current) => ({
      ...current,
      insight: SKILL_COOLDOWN.insight,
    }));

    // Only this current sequence is affected.
    setSealedOptions(wrong.slice(0, 2));

    showToast(t.skillInsightCast, "insight");
    showDialogue(
      lang === "zh"
        ? "两颗虚假的符石失去回应。现在，只看你自己的判断。"
        : "Two false runes have gone silent. The rest is your judgment.",
      "skill",
      3200,
      lang === "zh" ? "符文系统" : "RUNE SYSTEM"
    );

    spawnFx({ type: "insight" }, 1050);
    playSfx("skill");
  }

  function useBlessing() {
    if (
      cooldowns.blessing > 0 ||
      hearts >= MAX_HEARTS ||
      phase !== "battle" ||
      status !== "playing" ||
      enemyAttacking
    ) {
      return;
    }

    setCooldowns((current) => ({
      ...current,
      blessing: SKILL_COOLDOWN.blessing,
    }));

    setHearts((value) => Math.min(MAX_HEARTS, value + 1));

    showToast(t.skillBlessingCast, "blessing");
    showDialogue(
      lang === "zh"
        ? "生命符文重新燃起。别浪费这次机会。"
        : "Your life rune burns again. Make this chance count.",
      "skill",
      3000,
      lang === "zh" ? "符文系统" : "RUNE SYSTEM"
    );

    spawnFx({ type: "heal" }, 1000);
    playSfx("heal");
  }

  function toggleTarget(id) {
    setSelectedTarget((current) => (current === id ? null : id));
  }

  function useLoot(item) {
    if (!item) return;

    if (item.type === "power") {
      if (powerReady && powerItemUid === item.uid) {
        setPowerReady(false);
        setPowerItemUid(null);
        showToast(
          lang === "zh" ? `破甲晶核：${t.lootCancel}` : `Armor Core: ${t.lootCancel}`,
          "info"
        );
        return;
      }

      setPowerReady(true);
      setPowerItemUid(item.uid);
      showToast(
        lang === "zh"
          ? "破甲晶核已装备：下一次正确攻击造成 2 点伤害"
          : "Armor Core equipped: next correct hit deals 2 damage",
        "insight"
      );
      playSfx("skill");
      return;
    }

    if (item.type === "guard") {
      if (guardReady && guardItemUid === item.uid) {
        setGuardReady(false);
        setGuardItemUid(null);
        showToast(
          lang === "zh" ? `守护羽：${t.lootCancel}` : `Guard Feather: ${t.lootCancel}`,
          "info"
        );
        return;
      }

      setGuardReady(true);
      setGuardItemUid(item.uid);
      showToast(
        lang === "zh"
          ? "守护羽已装备：下一次失误不会失去生命"
          : "Guard Feather equipped: next mistake costs no heart",
        "blessing"
      );
      playSfx("skill");
      return;
    }

    if (item.type === "heal" && hearts >= MAX_HEARTS) {
      showToast(
        lang === "zh"
          ? "生命已满，先保留这件战利品。"
          : "Life is full. Save this loot.",
        "info"
      );
      return;
    }

    if (item.type === "heal") {
      setHearts((value) => Math.min(MAX_HEARTS, value + 1));
      spawnFx({ type: "heal" }, 1000);
      showToast(
        lang === "zh" ? "回春露：回复 1 颗生命" : "Renewal Drop: +1 heart",
        "blessing"
      );
      playSfx("heal");
    }

    if (item.type === "haste") {
      setCooldowns((current) => ({
        insight: Math.max(0, current.insight - 2),
        blessing: Math.max(0, current.blessing - 2),
      }));
      showToast(
        lang === "zh"
          ? "时序沙：技能冷却 -2 回合"
          : "Chrono Sand: skill cooldown -2 turns",
        "insight"
      );
      playSfx("skill");
    }

    setInventory((items) => items.filter((entry) => entry.uid !== item.uid));
  }

  function advanceEnemyTurn(nextTurn) {
    if (!isFinalWave) return;

    setMinions((current) =>
      current.map((unit) => {
        if (unit.hp <= 0 && unit.reviveAt != null && nextTurn >= unit.reviveAt) {
          showToast(
            lang === "zh"
              ? `${unit.zh} 被王座重新召回！`
              : `${unit.en} has been reconstructed by the throne!`,
            "info"
          );
          playSfx("revive");
          return { ...unit, hp: unit.maxHp, reviveAt: null };
        }
        return unit;
      })
    );
  }

  function resolveCounterSource() {
    const selectedMinion =
      selectedTarget &&
      selectedTarget !== "main" &&
      minions.find((unit) => unit.id === selectedTarget && unit.hp > 0);

    const fallbackMinion = minions.find((unit) => unit.hp > 0);

    if (selectedMinion) {
      return {
        id: selectedMinion.id,
        speaker: selectedMinion[lang],
        isMain: false,
      };
    }

    if (enemyHp > 0 && !mainGone) {
      return {
        id: "main",
        speaker: enemyName,
        isMain: true,
      };
    }

    if (fallbackMinion) {
      return {
        id: fallbackMinion.id,
        speaker: fallbackMinion[lang],
        isMain: false,
      };
    }

    return { id: null, speaker: enemyName, isMain: true };
  }

  function enemyCounterAttack(onFinish) {
    playSfx("wrong");

    const source = resolveCounterSource();

    setCounterSourceId(source.id);
    setEnemyAttacking(true);
    setShake(true);

    // Wind-up then a heavy impact sound exactly when the screen flashes.
    later(() => {
      playOneShotAudio(ONE_SHOT_AUDIO.enemyAttack, 0.92);
    }, 150);

    later(() => setRedFlash(true), 290);
    later(() => setRedFlash(false), 740);

    later(() => {
      setShake(false);
      setEnemyAttacking(false);
      setCounterSourceId(null);
      onFinish?.();
    }, 940);
  }

  function advancePuzzle() {
    if (puzzleIndex + 1 >= RUN_PUZZLES.length) {
      // A finite deck cannot loop or leave an unanswerable battle.
      finalizeCompetitionRun(false);
      setStatus("lost");
      return false;
    }
    setPuzzleIndex(puzzleIndex + 1);
    return true;
  }

  function finishWave() {
    recordCompletedEncounter();
    if (!isFinalWave && !advancePuzzle()) return;
    setEnemyDying(true);
    showDialogue(enemy.defeat[lang], "defeat", 3600);

    const drop = waveMeta.drop;
    if (drop) {
      const item = { ...drop, uid: `${waveIndex}-${Date.now()}` };
      setInventory((items) => [...items, item]);
      setLootFlash(item);
      playSfx("loot");
      later(() => setLootFlash(null), 2600);
    }

    later(() => {
      if (isFinalWave) {
        setPhase("battle");
        finalizeCompetitionRun(true);
        setStatus("won");
        reportWin();
        return;
      }

      const nextIndex = ACTIVE_WAVE_INDICES[routeIndex + 1];
      const nextWave = WAVES[nextIndex];
      const nextMeta = WAVE_META[nextIndex];
      const goingToBoss = nextIndex === FINAL_WAVE_INDEX;

      playSfx("wave");
      setSelectedTarget(null);
      setMinionHitId(null);
      setCounterSourceId(null);
      setPhase("travel");
      setDialogue(null);
      setBossApproach(goingToBoss);

      later(() => {
        setWaveIndex(nextIndex);

        setEnemyHp(nextWave.enemy.hp);
        // Hearts intentionally persist across every wave.
        setMinions(
          nextMeta.minions.map((unit) => ({
            ...unit,
            hp: unit.hp,
            maxHp: unit.hp,
            reviveAt: null,
          }))
        );
        setSelectedTarget(null);
        setTurnCount(0);
        setMinionHitId(null);
        setCounterSourceId(null);
        setSelected(null);
        setStatus("playing");
        setSealedOptions([]);
        setEnemyHit(false);
        setEnemyAttacking(false);
        setEnemyDying(false);
        setMainGone(false);
        setDeathFx(false);
      }, 320);

      if (goingToBoss) {
        later(() => setPhase("arrival"), 3300);
        later(() => {
          setPhase("battle");
          setBossApproach(false);
          showDialogue(nextWave.enemy.intro[lang], "intro", 4800);
        }, 4550);
      } else {
        later(() => setPhase("arrival"), 1650);
        later(() => {
          setPhase("battle");
          setBossApproach(false);
          showDialogue(nextWave.enemy.intro[lang], "intro", 4300);
        }, 2350);
      }
    }, 3100);
  }

  function chooseAnswer(option, event) {
    if (
      phase !== "battle" ||
      status !== "playing" ||
      enemyAttacking ||
      enemyDying ||
      sealedOptions.includes(option)
    ) {
      return;
    }

    setSelected(option);
    tickSkillCooldowns();
    recordCompetitionAnswer(option === puzzle.answer);

    const nextTurn = turnCount + 1;
    setTurnCount(nextTurn);
    setTotalTurns((value) => value + 1);

    const index = puzzle.options.indexOf(option);
    const element = ELEMENTS[index % ELEMENTS.length];

    const runeRect = event.currentTarget.getBoundingClientRect();
    const canvasRect = canvasRef.current?.getBoundingClientRect();

    const scaleX = canvasRect?.width ? 1440 / canvasRect.width : 1;
    const scaleY = canvasRect?.height ? 960 / canvasRect.height : 1;

    const runeX = canvasRect
      ? (runeRect.left + runeRect.width / 2 - canvasRect.left) * scaleX
      : runeRect.left + runeRect.width / 2;

    const runeY = canvasRect
      ? (runeRect.top + runeRect.height / 2 - canvasRect.top) * scaleY
      : runeRect.top + runeRect.height / 2;

    if (option === puzzle.answer) {
      const damage = powerReady ? 2 : 1;

      if (powerReady) {
        setPowerReady(false);
        if (powerItemUid) {
          setInventory((items) =>
            items.filter((entry) => entry.uid !== powerItemUid)
          );
        }
        setPowerItemUid(null);
      }

      const firstAliveMinion = minions.find((unit) => unit.hp > 0);
      let targetId = selectedTarget;

      // No manual target = automatic priority.
      // If the main enemy is already down, remaining side enemies are always cleared first.
      if (!targetId) {
        targetId = enemyHp <= 0
          ? firstAliveMinion?.id ?? "main"
          : "main";
      }

      if (
        targetId !== "main" &&
        !minions.some((unit) => unit.id === targetId && unit.hp > 0)
      ) {
        targetId = enemyHp > 0 ? "main" : firstAliveMinion?.id ?? "main";
      }

      if (targetId === "main" && enemyHp <= 0 && firstAliveMinion) {
        targetId = firstAliveMinion.id;
      }

      // In the boss fight, living guards intercept attacks aimed at the Warden.
      if (isFinalWave && targetId === "main" && firstAliveMinion) {
        targetId = firstAliveMinion.id;
        showToast(
          lang === "zh" ? "封印护卫挡下攻击！必须先击败左右护卫。" : "A Seal Guard intercepted the attack!",
          "info"
        );
      }

      const targetNode =
        document.querySelector(`[data-target-id="${targetId}"]`) ??
        enemyRef.current;
      const targetRect = targetNode?.getBoundingClientRect();

      const enemyX =
        targetRect && canvasRect
          ? (targetRect.left + targetRect.width / 2 - canvasRect.left) * scaleX
          : 720;

      const enemyY =
        targetRect && canvasRect
          ? (targetRect.top + targetRect.height * 0.48 - canvasRect.top) * scaleY
          : 275;

      const newCombo = combo + 1;
      setStatus("correct");
      setCombo(newCombo);
      setMaxCombo((value) => Math.max(value, newCombo));

      if (targetId === "main") {
        setEnemyHit(true);
        setMinionHitId(null);
      } else {
        setEnemyHit(false);
        setMinionHitId(targetId);
      }

      setShake(true);

      playSfx("attack");
      later(() => playSfx("hit"), 170);

      spawnFx(
        { type: "beam", x1: runeX, y1: runeY, x2: enemyX, y2: enemyY, element },
        600
      );
      spawnFx({ type: "impact", x: enemyX, y: enemyY, element }, 800);

      let mainDefeated = false;

      if (targetId === "main") {
        const newHp = Math.max(0, enemyHp - damage);
        setEnemyHp(newHp);

        const sideEnemiesStillAlive = minions.some((unit) => unit.hp > 0);
        mainDefeated = newHp <= 0 && !sideEnemiesStillAlive;

        if (newHp <= 0 && sideEnemiesStillAlive) {
          showDialogue(
            lang === "zh"
              ? "主体已经倒下……但战斗还没结束。清除剩余敌人！"
              : "The main body is down… but the battle is not over. Clear the remaining enemies!",
            "defeat",
            3600
          );

          setSelectedTarget(null);
          setEnemyDying(true);

          later(() => {
            setMainGone(true);
            setEnemyDying(false);
            setDialogue(null);
          }, 900);
        } else {
          showDialogue(
            currentEnemyHitLine(newHp),
            "hit",
            mainDefeated ? 3000 : 3200
          );
        }
      } else {
        const target = minions.find((unit) => unit.id === targetId);
        if (target) {
          const nextHp = Math.max(0, target.hp - damage);
          const defeated = nextHp <= 0;
          const otherAliveMinions = minions.filter(
            (unit) => unit.id !== targetId && unit.hp > 0
          );
          const clearingLastEnemy =
            defeated &&
            enemyHp <= 0 &&
            otherAliveMinions.length === 0 &&
            !isFinalWave;

          setMinions((current) =>
            current.map((unit) =>
              unit.id === targetId
                ? {
                    ...unit,
                    hp: nextHp,
                    reviveAt:
                      defeated && isFinalWave && unit.revive
                        ? nextTurn + unit.revive
                        : unit.reviveAt,
                  }
                : unit
            )
          );

          if (clearingLastEnemy) {
            mainDefeated = true;
          }

          showDialogue(
            defeated
              ? (lang === "zh"
                  ? `${target.zh} 被击破！${target.revive ? ` ${target.revive} 回合后会复活。` : ""}`
                  : `${target.en} defeated!${target.revive ? ` Revives in ${target.revive} turns.` : ""}`)
              : (lang === "zh" ? `${target.zh} 的防御正在崩解。` : `${target.en}'s defense is breaking.`),
            "hit",
            3300,
            target[lang]
          );

          if (defeated) {
            setSelectedTarget(null);


          }
        }
      }

      later(() => {
        setEnemyHit(false);
        setMinionHitId(null);
        setShake(false);
      }, 520);

      later(() => {
        advanceEnemyTurn(nextTurn);

        if (mainDefeated) {
          finishWave();
          return;
        }

        const hasNext = advancePuzzle();
        setSelected(null);
        if (hasNext) setStatus("playing");
        setSealedOptions([]);
      }, 1080);

      return;
    }

    // Wrong answer: Guard Feather can absorb the life loss once.
    const nextHearts = guardReady ? hearts : hearts - 1;

    if (guardReady) {
      setGuardReady(false);
      if (guardItemUid) {
        setInventory((items) =>
          items.filter((entry) => entry.uid !== guardItemUid)
        );
      }
      setGuardItemUid(null);
      showToast(
        lang === "zh" ? "守护羽替你挡下了这次反击！" : "Guard Feather blocked the counterattack!",
        "blessing"
      );
    } else {
      setHearts(nextHearts);
    }

    setStatus("wrong");
    setCombo(0);

    const counterSource = resolveCounterSource();
    const counterText = counterSource.isMain
      ? currentMissLine()
      : (lang === "zh"
          ? `${counterSource.speaker} 发出低沉尖啸，符文阵开始反噬。`
          : `${counterSource.speaker} shrieks as the rune field turns against you.`);

    showDialogue(
      counterText,
      "taunt",
      3200,
      counterSource.speaker
    );

    spawnFx({ type: "miss", x: runeX, y: runeY }, 650);

    enemyCounterAttack(() => {
      advanceEnemyTurn(nextTurn);

      if (nextHearts <= 0) {
        finalizeCompetitionRun(false);
        setStatus("lost");
        setDeathFx(true);
        later(() => setDeathFx(false), 2400);
        return;
      }

      const hasNext = advancePuzzle();
      setSelected(null);
      if (hasNext) setStatus("playing");
    });
  }

  function restart() {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current.clear();

    resetRunState();
    setGameMode("game");
    beginBattle(0);
  }

  const enemyName = enemy[lang];
  const enemyRole = enemy.kind === "boss" ? t.boss : t.guardian;

  useEffect(() => {
    if (gameMode !== "game") return;

    if (status === "won" && resultSoundRef.current !== "won") {
      resultSoundRef.current = "won";
      stopResultScore();
      playSfx("victory");
    }

    if (status === "lost" && resultSoundRef.current !== "lost") {
      resultSoundRef.current = "lost";
      stopResultScore();
      playSfx("defeat");
    }

    if (status === "playing") {
      resultSoundRef.current = null;
      stopResultScore();
    }
  }, [status, gameMode]);

  return (
    <div className="ns-shell" ref={shellRef}>
            <GameGuide key={`${competitionAttemptRef.current?.attemptId}-${waveIndex}`} corner autoStart={waveIndex === 0} lang={lang} active={gameMode === "game" && phase === "battle" && !["won","lost"].includes(status)} defer={status !== "playing" || enemyDying || enemyHit || !!minionHitId || shake || !!dialogue} steps={waveIndex === 0 ? [
              { target: ".ns-sequence, .ns-runes", highlightAll:true, text: "Find the pattern, then tap one of the four answers below to attack.", zh: "找出数列规律，再点击下方四个答案之一发动攻击。", advanceTarget: ".ns-runes button:not(:disabled)" },
              { target: ".ns-skill--insight:not(:disabled)", text: "Try Insight: tap here to remove two wrong answers.", zh: "试试洞察：点击这里排除两个错误答案。" },
              { target: ".ns-minion:not(.is-down), .ns-enemy", highlightAll:true, text: "Tap an enemy to choose your target, then answer. Clear every enemy to continue.", zh: "点击敌人选择目标，再作答。清除全部敌人后进入下一阶段。", advanceTarget: ".ns-minion:not(.is-down):not(:disabled), .ns-enemy" },
            ] : [
              { target: ".ns-minion:not(.is-down)", text: "Defeat both guards first, then the boss. Guards do not revive.", zh: "先击败两名护卫，再攻击首领。护卫不会复活。", manual:true },
              { target: ".ns-sequence, .ns-runes", highlightAll:true, text: "Read the sequence and tap the correct answer to attack.", zh: "观察数列，点击正确答案攻击。", advanceTarget: ".ns-runes button:not(:disabled)" },
            ]} />
      <div
        className={`ns-canvas ${gameMode === "game" ? "is-game" : "is-cover"}`}
        ref={canvasRef}
        onPointerDownCapture={handleGlobalPointerDown}
        data-lang={lang}
        style={{
          "--ns-canvas-scale": canvasScale.x,
          transform: `scale(${canvasScale.x}, ${canvasScale.y})`,
        }}
      >
        {gameMode === "home" ? (
          <section className="ns-home">
            <img className="ns-home-sky" src={hubBackground} alt="" />
            <div className="ns-home-cave" aria-hidden="true">
              <span className="ns-home-rock ns-home-rock--l1" />
              <span className="ns-home-rock ns-home-rock--l2" />
              <span className="ns-home-rock ns-home-rock--r1" />
              <span className="ns-home-rock ns-home-rock--r2" />
              <span className="ns-home-mist ns-home-mist--1" />
              <span className="ns-home-mist ns-home-mist--2" />
            </div>

            <div className="ns-home-particles" aria-hidden="true">
              {Array.from({ length: 26 }).map((_, index) => (
                <i
                  key={index}
                  style={{
                    "--i": index,
                    "--x": `${8 + ((index * 37) % 84)}%`,
                    "--y": `${10 + ((index * 29) % 76)}%`,
                    "--delay": `${(index % 8) * 120}ms`,
                  }}
                />
              ))}
            </div>

            <header className="ns-home-top">
              <div className="ns-home-brand-group">
                {onHome && (
                  <button
                    type="button"
                    className="ns-hub-return"
                    onClick={onHome}
                    aria-label={lang === "zh" ? "返回 Math Week 主页" : "Return to Math Week home"}
                  >
                    <span>←</span>
                    <b>{lang === "zh" ? "主页" : "MATH WEEK"}</b>
                  </button>
                )}

                <div className="ns-home-brand-copy">
                  <span>{t.brand}</span>
                  <strong>{t.title}</strong>
                </div>
              </div>

              <div className="ns-home-tools">
                <button type="button" onClick={toggleLang} className="ns-home-tool">
                  {lang === "zh" ? "中 / EN" : "EN / 中"}
                </button>
              </div>
            </header>

            <div className="ns-home-content">
              <div className="ns-home-copy">
                <span className="ns-home-kicker">{t.homeSubtitle}</span>
                <h1>Number<br />Sequence Rush</h1>
                <p>{t.homeStory}</p><QuickBrief lang={lang} goal={lang === "zh" ? "击败两场战斗的守卫" : "Defeat the guardians in 2 encounters"} controls={lang === "zh" ? "看数列，点击正确答案发动攻击" : "Read the sequence; tap the correct rune to attack"} finish={lang === "zh" ? "先打护卫再打首领；三颗心耗尽失败" : "Clear the final guards, then the boss; lose all 3 hearts to fail"} />

                <button type="button" className="ns-home-start" onClick={startGame}>
                  <span>{t.startJourney}</span>
                  <i>✦</i>
                </button>

                <small>Math Week 2026 · Digital Challenge</small>
              </div>

              <div className="ns-home-portal" aria-hidden="true">
                <span className="ns-home-portal-glow" />
                <img className="ns-home-island" src={sequenceIsland} alt="" />
                <span className="ns-home-portal-ring ns-home-portal-ring--1" />
                <span className="ns-home-portal-ring ns-home-portal-ring--2" />
                <span className="ns-home-portal-ring ns-home-portal-ring--3" />
                <span className="ns-home-gate">
                  <i>∞</i>
                  <b>SEQUENCE</b>
                </span>
                <span className="ns-home-path" />
              </div>
            </div>
          </section>
        ) : gameMode === "entering" ? (
          <section className="ns-entry">
            <div className="ns-entry-tunnel" aria-hidden="true">
              {Array.from({ length: 12 }).map((_, index) => (
                <i key={index} style={{ "--i": index }} />
              ))}
            </div>
            <div className="ns-entry-portal" aria-hidden="true">∞</div>
            <div className="ns-entry-copy">
              <span>{t.enteringCave}</span>
              <strong>{lang === "zh" ? "符文之路正在开启" : "THE RUNE PATH IS OPENING"}</strong>
            </div>
          </section>
        ) : (
    <main
      className={[
        "ns-game",
        `ns-${status}`,
        `ns-phase-${phase}`,
        shake ? "is-shaking" : "",
        redFlash ? "is-red-flash" : "",
        bossApproach ? "is-boss-approach" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-scene={wave.scene}
    >
      <div className="ns-scene" aria-hidden="true">
        <div className="ns-scene-sky" />
        <div className="ns-scene-moon" />
        <div className="ns-scene-far" />
        <div className="ns-scene-mid" />
        <div className="ns-scene-near" />
        <div className="ns-scene-fog" />
        <div className="ns-scene-fog ns-scene-fog--2" />
        <div className="ns-scene-embers" />
      </div>

      <div className="ns-vignette" />
      <div className="ns-red-overlay" aria-hidden="true" />

      <header className="ns-topbar">
        <div className="ns-brand">
          <div className="ns-eyebrow">{t.brand}</div>
          <h1>{t.title}</h1>
        </div>

        <div className="ns-journey">
          <span className="ns-journey-title">{wave.chapter[lang]}</span>

          <div className="ns-route" aria-label="encounter progress">
            {ACTIVE_WAVE_INDICES.map((waveIndex, index) => {
              const entry = WAVES[waveIndex];
              return (
                <span
                  key={waveIndex}
                  className={[
                    "ns-route-node",
                    index < routeIndex ? "is-cleared" : "",
                    index === routeIndex ? "is-current" : "",
                    entry.enemy.kind === "boss" ? "is-boss" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {index < routeIndex
                    ? "✓"
                    : entry.enemy.kind === "boss"
                    ? "∞"
                    : index + 1}
                </span>
              );
            })}
          </div>
        </div>

        <div className="ns-topbar-right">
          <button
            type="button"
            className="ns-exit-button"
            onClick={requestReturnHome}
          >
            <span>↩</span>
            <b>{t.exitShort}</b>
          </button>

          <button
            type="button"
            className="ns-lang"
            onClick={toggleLang}
            aria-label="Switch language"
          >
            <span className={lang === "zh" ? "is-on" : ""}>中</span>
            <span className="ns-lang-sep" />
            <span className={lang === "en" ? "is-on" : ""}>EN</span>
          </button>

          <div className="ns-competition-score" aria-label="Competition score">
            <span>SCORE</span>
            <strong>{displayedCompetitionScore}</strong>
          </div>

          <div className="ns-encounter-badge">
            <span>{t.encounter}</span>
            <strong>
              {routeIndex + 1}
              <i>/</i>
              {ACTIVE_WAVE_COUNT}
            </strong>
          </div>
        </div>
      </header>

      <section className="ns-arena">
        {phase === "battle" && status === "playing" && (
          <>
            <aside className="ns-side-panel ns-side-panel--left">
              <span>{lang === "zh" ? "战斗指南" : "BATTLE GUIDE"}</span>
              <h3>{wave.chapter[lang]}</h3>
              <ol>
                {waveMeta.tutorial[lang].map((line, index) => (
                  <li key={line}><b>{index + 1}</b>{line}</li>
                ))}
              </ol>
            </aside>

            <aside className="ns-side-panel ns-side-panel--right">
              <span>{lang === "zh" ? "魔物档案" : "ENEMY ARCHIVE"}</span>
              <h3>{enemyName}</h3>
              <p>{waveMeta.lore[lang]}</p>
              {isFinalWave && (
                <div className="ns-archive-warning">
                  {lang === "zh"
                    ? "护卫存活期间，魔王受到封印保护。"
                    : "The Warden is protected while a Seal Guard lives."}
                </div>
              )}
            </aside>
          </>
        )}
        <section
          className={`ns-enemy-zone ${mainGone ? "is-main-gone" : ""}`}
          ref={enemyRef}
        >
          {phase === "battle" && showMainHud && !mainGone && (
            <div className="ns-enemy-rings" aria-hidden="true">
              <span className="ns-ring ns-ring-1" />
              <span className="ns-ring ns-ring-2" />
              <span className="ns-ring ns-ring-3" />
            </div>
          )}

          {phase === "battle" &&
            dialogue &&
            (showMainEnemy || aliveMinions.length > 0) && (
              <div
                key={dialogue.id}
                className={`ns-dialogue ns-dialogue--${dialogue.kind}`}
              >
                <span>{dialogue.speaker ?? enemyName}</span>
                <p>{dialogue.text}</p>
              </div>
            )}

          {phase === "battle" && showMainEnemy && !mainGone && (
            <div className="ns-enemy-float">
              <button
                type="button"
                onClick={() => enemyHp > 0 && toggleTarget("main")}
                className={[
                  "ns-enemy",
                  selectedTarget === "main" ? "is-targeted" : "",
                  bossShielded ? "is-shielded" : "",
                  enemyHit ? "is-hit" : "",
                  enemyAttacking && counterSourceId === "main" ? "is-counter" : "",
                  enemyDying ? "is-dead" : "",
                  phase === "battle" ? "is-arrived" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                data-kind={enemy.kind}
                style={{ "--enemy": ENEMY_RGB[enemy.el] }}
                disabled={enemyHp <= 0}
                aria-label={`${enemyName}${selectedTarget === "main" ? " target" : ""}`}
                data-target-id="main"
              >
                <span className="ns-enemy-aura" />
                <span className="ns-enemy-wing ns-enemy-wing--l" />
                <span className="ns-enemy-wing ns-enemy-wing--r" />
                <span className="ns-enemy-horn ns-enemy-horn--l" />
                <span className="ns-enemy-horn ns-enemy-horn--r" />
                <span className="ns-enemy-shoulder ns-enemy-shoulder--l" />
                <span className="ns-enemy-shoulder ns-enemy-shoulder--r" />

                <span className="ns-enemy-body">
                  <span className="ns-enemy-eye ns-enemy-eye--l" />
                  <span className="ns-enemy-eye ns-enemy-eye--r" />
                  <span className="ns-enemy-eye ns-enemy-eye--c" />
                  <span className="ns-enemy-mouth" />
                  <span className="ns-enemy-mark">
                    {enemy.kind === "boss" ? "∞" : "✦"}
                  </span>
                </span>

                <span className="ns-enemy-shadow" />
                {selectedTarget === "main" && <span className="ns-target-lock">TARGET</span>}
                {bossShielded && <span className="ns-boss-shield">SHIELDED</span>}
              </button>
            </div>
          )}

          {phase === "battle" && minions.length > 0 && (
            <div className="ns-minion-row">
              {minions.map((unit, index) => {
                const alive = unit.hp > 0;
                const slot = unit.slot ?? (index === 0 ? "left" : "right");
                const reviveLeft =
                  unit.reviveAt == null
                    ? null
                    : Math.max(0, unit.reviveAt - turnCount);

                return (
                  <div
                    key={unit.id}
                    className={`ns-minion-slot ns-minion-slot--${slot}`}
                  >
                    <button
                      type="button"
                      className={[
                        "ns-minion",
                        selectedTarget === unit.id ? "is-targeted" : "",
                        minionHitId === unit.id ? "is-hit" : "",
                        enemyAttacking && counterSourceId === unit.id
                          ? "is-counter"
                          : "",
                        !alive ? "is-down" : "",
                        !alive && unit.revive ? "is-reviving" : "",
                        !alive && !unit.revive ? "is-vanishing" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => alive && toggleTarget(unit.id)}
                      disabled={!alive}
                      style={{
                        "--enemy":
                          ENEMY_RGB[unit.el] ?? ENEMY_RGB.violet,
                      }}
                      data-target-id={unit.id}
                      aria-label={`${unit[lang]}${
                        selectedTarget === unit.id ? " target" : ""
                      }`}
                    >
                      <span className="ns-minion-creature" aria-hidden="true">
                        <i className="ns-minion-aura" />
                        <i className="ns-minion-wing ns-minion-wing--l" />
                        <i className="ns-minion-wing ns-minion-wing--r" />
                        <i className="ns-minion-ear ns-minion-ear--l" />
                        <i className="ns-minion-ear ns-minion-ear--r" />
                        <i className="ns-minion-face">
                          <b className="ns-minion-eye ns-minion-eye--l" />
                          <b className="ns-minion-eye ns-minion-eye--r" />
                          <em>{unit.icon}</em>
                        </i>
                      </span>

                      <strong className="ns-minion-name">{unit[lang]}</strong>

                      <span className="ns-mini-hp">
                        {Array.from({ length: unit.maxHp }).map((_, hpIndex) => (
                          <i
                            key={hpIndex}
                            className={hpIndex < unit.hp ? "is-live" : ""}
                          />
                        ))}
                      </span>

                      {!alive && reviveLeft != null && (
                        <em className="ns-minion-revive">
                          {lang === "zh"
                            ? `${reviveLeft} 回合后复活`
                            : `Revives in ${reviveLeft}`}
                        </em>
                      )}

                      {selectedTarget === unit.id && alive && (
                        <b className="ns-minion-target">TARGET</b>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {phase === "battle" && showMainHud && !mainGone && (
            <div className="ns-enemy-info">
              <div className="ns-enemy-row">
                <span className="ns-enemy-kind">{enemyRole}</span>
                <span className="ns-enemy-name">{enemyName}</span>
              </div>

              <div className="ns-hp-wrap">
                <div className="ns-hp-label">
                  <span>{t.enemyLife}</span>
                  <span className="ns-hp-pulse">◆</span>
                </div>

                <div className="ns-hp-track">
                  <div
                    className="ns-hp-fill"
                    style={{ width: `${enemyHpPercent}%` }}
                  />
                  <div className="ns-hp-gloss" />
                </div>
              </div>
            </div>
          )}
        </section>

        {phase === "battle" && status !== "won" && status !== "lost" && (
          <section className="ns-puzzle-card">

            <div className="ns-card-head">
              <div className="ns-head-copy">
                <span className="ns-puzzle-badge">{puzzle.badge[lang]}</span>
                <h2>{puzzle.prompt[lang]}</h2>
                <div className="ns-rune-divider" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
              </div>

              <div className="ns-player-life">
                <span className="ns-life-label">{t.life}</span>
                <div className="ns-hearts" aria-label={`${hearts} hearts`}>
                  {Array.from({ length: MAX_HEARTS }).map((_, index) => (
                    <span
                      key={index}
                      className={`ns-heart ${index < hearts ? "is-full" : "is-empty"}`}
                    >
                      ♥
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="ns-active-effects">
              <span className="ns-active-effects-title">{t.activeEffects}</span>

              {!powerReady && !guardReady && (
                <span className="ns-active-effect-empty">{t.noEffects}</span>
              )}

              {powerReady && (
                <span className="ns-active-effect ns-active-effect--power">
                  <i>◆</i>
                  <b>{t.powerBuff}</b>
                  <small>{t.powerBuffDesc}</small>
                </span>
              )}

              {guardReady && (
                <span className="ns-active-effect ns-active-effect--guard">
                  <i>◇</i>
                  <b>{t.guardBuff}</b>
                  <small>{t.guardBuffDesc}</small>
                </span>
              )}
            </div>

            <div className={`ns-sequence ns-sequence--${puzzle.type}`}>
              {puzzle.sequence.map((value, index) => (
                <div
                  key={`${value}-${index}`}
                  className={`ns-sequence-orb ${
                    value === "?" ? "is-mystery" : ""
                  }`}
                >
                  <span>{value}</span>
                </div>
              ))}
            </div>

            <div className="ns-skills">
              <button
                type="button"
                className={[
                  "ns-skill",
                  "ns-skill--insight",
                  cooldowns.insight > 0 ? "is-cooling" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={useInsight}
                disabled={
                  cooldowns.insight > 0 ||
                  phase !== "battle" ||
                  status !== "playing" ||
                  enemyAttacking
                }
              >
                <span className="ns-skill-icon">◉</span>
                <span className="ns-skill-copy">
                  <strong>{t.insight}</strong>
                  <small>
                    {cooldowns.insight > 0
                      ? `${t.cd} ${cooldowns.insight}`
                      : t.insightDesc}
                  </small>
                  <em>{t.insightRule}</em>
                </span>
                <span className="ns-skill-state">
                  {cooldowns.insight > 0
                    ? `${t.cd} ${cooldowns.insight}`
                    : t.ready}
                </span>

                <span className="ns-skill-orbs" aria-hidden="true">
                  {Array.from({ length: SKILL_COOLDOWN.insight }).map((_, index) => (
                    <i
                      key={index}
                      className={
                        index < cooldowns.insight ? "is-dark" : "is-lit"
                      }
                    />
                  ))}
                </span>
              </button>

              <button
                type="button"
                className={[
                  "ns-skill",
                  "ns-skill--blessing",
                  cooldowns.blessing > 0 ? "is-cooling" : "",
                  hearts >= MAX_HEARTS && cooldowns.blessing === 0
                    ? "is-locked"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={useBlessing}
                disabled={
                  cooldowns.blessing > 0 ||
                  hearts >= MAX_HEARTS ||
                  phase !== "battle" ||
                  status !== "playing" ||
                  enemyAttacking
                }
              >
                <span className="ns-skill-icon">✦</span>
                <span className="ns-skill-copy">
                  <strong>{t.blessing}</strong>
                  <small>
                    {cooldowns.blessing > 0
                      ? `${t.cd} ${cooldowns.blessing}`
                      : hearts >= MAX_HEARTS
                      ? t.fullLife
                      : t.blessingDesc}
                  </small>
                  <em>{t.blessingRule}</em>
                </span>
                <span className="ns-skill-state">
                  {cooldowns.blessing > 0
                    ? `${t.cd} ${cooldowns.blessing}`
                    : hearts >= MAX_HEARTS
                    ? t.fullLife
                    : t.ready}
                </span>

                <span className="ns-skill-orbs" aria-hidden="true">
                  {Array.from({ length: SKILL_COOLDOWN.blessing }).map((_, index) => (
                    <i
                      key={index}
                      className={
                        index < cooldowns.blessing ? "is-dark" : "is-lit"
                      }
                    />
                  ))}
                </span>
              </button>
            </div>

            <div className="ns-loot-belt">
              <div className="ns-loot-title">
                <span>{lang === "zh" ? "远征战利品" : "EXPEDITION LOOT"}</span>
                <small>
                  {inventory.length > 0
                    ? (lang === "zh" ? `${inventory.length} 件可用` : `${inventory.length} ready`)
                    : (lang === "zh" ? "等待掉落" : "Awaiting drop")}
                </small>
              </div>

              <div className="ns-loot-slots">
                {inventory.length === 0 && (
                  <div className="ns-loot-empty">
                    {lang === "zh" ? "击败区域守卫后会掉落特殊道具" : "Defeat guardians to obtain special items"}
                  </div>
                )}

                {inventory.map((item) => (
                  <button
                    key={item.uid}
                    type="button"
                    className={[
                      "ns-loot-item",
                      `ns-loot-item--${item.type}`,
                      item.uid === powerItemUid || item.uid === guardItemUid
                        ? "is-equipped"
                        : "",
                    ].filter(Boolean).join(" ")}
                    onClick={() => useLoot(item)}
                  >
                    <span>{item.icon}</span>
                    <strong>{item[lang]}</strong>
                    <small>
                      {item.uid === powerItemUid || item.uid === guardItemUid
                        ? t.lootSelected
                        : LOOT_TEXT[item.type][lang]}
                    </small>
                  </button>
                ))}
              </div>
            </div>

            <div className="ns-runes">
              {puzzle.options.map((option, index) => {
                const element = ELEMENTS[index % ELEMENTS.length];
                const isSealed = sealedOptions.includes(option);
                const isSelected = selected === option;

                const isCorrect =
                  isSelected &&
                  option === puzzle.answer &&
                  status === "correct";

                const isWrong =
                  isSelected &&
                  option !== puzzle.answer &&
                  status === "wrong";

                return (
                  <button
                    key={option}
                    type="button"
                    className={[
                      "ns-rune",
                      `ns-rune--${element}`,
                      isCorrect ? "is-correct" : "",
                      isWrong ? "is-wrong" : "",
                      isSealed ? "is-sealed" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={(event) => chooseAnswer(option, event)}
                    disabled={
                      phase !== "battle" ||
                      status !== "playing" ||
                      enemyAttacking ||
                      enemyDying ||
                      isSealed
                    }
                  >
                    <span className="ns-rune-core" />
                    <span className="ns-rune-sigil">{RUNE_SIGILS[index]}</span>
                    <span className="ns-rune-value">
                      {isSealed ? "×" : option}
                    </span>
                    <span className="ns-rune-label">
                      {isSealed
                        ? t.sealed
                        : ["FIRE", "WATER", "WOOD", "LIGHT"][index]}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className={`ns-card-foot ns-card-foot--${status}`}>
              <span className="ns-foot-dot" />
              <span className="ns-foot-text">
                {status === "correct" && t.correct}
                {status === "wrong" && t.wrong}
                {status === "playing" && t.tapRune}
              </span>

              <span className="ns-combo">
                {t.combo} <b>×{combo}</b>
              </span>
            </div>
          </section>
        )}

      </section>

      <footer className="ns-footer">
        <span>{t.footer1}</span>
        <i />
        <span>{t.footer2}</span>
      </footer>

      {(status === "won" || status === "lost") && phase === "battle" && (
        <section
          className={[
            "ns-ending",
            status === "won" ? "ns-ending--win" : "ns-ending--lost",
          ].join(" ")}
        >
          <div className="ns-ending-bg" aria-hidden="true">
            <span className="ns-ending-ring ns-ending-ring--1" />
            <span className="ns-ending-ring ns-ending-ring--2" />
            <span className="ns-ending-ring ns-ending-ring--3" />
            <span className="ns-ending-flare" />

            <div className="ns-ending-rune-field">
              {Array.from({ length: 18 }).map((_, index) => (
                <i
                  key={index}
                  style={{
                    "--i": index,
                    "--x": `${8 + ((index * 31) % 84)}%`,
                    "--delay": `${(index % 7) * 90}ms`,
                  }}
                >
                  {RUNE_SIGILS[index % RUNE_SIGILS.length]}
                </i>
              ))}
            </div>
          </div>

          <div className="ns-ending-panel">
            <div className="ns-ending-crest" aria-hidden="true">
              {status === "won" ? "∞" : "◇"}
            </div>

            <span className="ns-ending-kicker">
              {status === "won" ? t.clearLabel : t.failLabel}
            </span>

            <h2>
              {status === "won" ? t.victoryTitle : t.defeatTitle}
            </h2>

            <p className="ns-ending-copy">
              {status === "won" ? t.victoryDesc : t.defeatDesc}
            </p>

            <div className="ns-ending-stats">
              <div>
                <span>{t.resultStage}</span>
                <strong>
                  {status === "won"
                    ? `${ACTIVE_WAVE_COUNT}/${ACTIVE_WAVE_COUNT}`
                    : `${Math.min(routeIndex + 1, ACTIVE_WAVE_COUNT)}/${ACTIVE_WAVE_COUNT}`}
                </strong>
              </div>
              <div>
                <span>{t.resultTurns}</span>
                <strong>{totalTurns}</strong>
              </div>
              <div>
                <span>{t.resultCombo}</span>
                <strong>×{maxCombo}</strong>
              </div>
              <div className="ns-ending-score">
                <span>FINAL SCORE</span>
                <strong>{displayedCompetitionScore}</strong>
              </div>
            </div>

            <div className="ns-ending-actions">
              <button type="button" className="ns-ending-button" onClick={onPostGameHome ?? restart}>
                <span>{status === "won" ? t.playAgain : t.restart}</span>
                <i>✦</i>
              </button>

              <button type="button" className="ns-ending-button ns-ending-button--ghost" onClick={onPostGameHome ?? requestReturnHome}>
                <span>{t.returnEntrance}</span>
              </button>
            </div>

            <small className="ns-ending-note">
              {status === "won"
                ? (lang === "zh"
                    ? "封印已经解除，远征记录已完成。"
                    : "The seal is broken. Your expedition is complete.")
                : (lang === "zh"
                    ? "重新整理符石，再挑战一次。"
                    : "Regroup your runes and challenge the expedition again.")}
            </small>
          </div>
        </section>
      )}

      {confirmHome && (
        <div className="ns-confirm-overlay" role="dialog" aria-modal="true">
          <div className="ns-confirm-card">
            <div className="ns-confirm-icon">↩</div>
            <span>{t.returnEntrance}</span>
            <h2>{t.exitTitle}</h2>
            <p>{t.exitDesc}</p>

            <div className="ns-confirm-actions">
              <button
                type="button"
                className="ns-confirm-button ns-confirm-button--ghost"
                onClick={() => setConfirmHome(false)}
              >
                {t.cancel}
              </button>

              <button
                type="button"
                className="ns-confirm-button ns-confirm-button--danger"
                onClick={returnHome}
              >
                {t.confirmExit}
              </button>
            </div>
          </div>
        </div>
      )}

      {(phase === "travel" || phase === "arrival") && (
        <div className={`ns-travel ns-travel--${phase} ${bossApproach ? "is-boss-omen" : ""}`}>
          <div className="ns-travel-sky" />
          <div className="ns-travel-road">
            <span className="ns-road-line ns-road-line--1" />
            <span className="ns-road-line ns-road-line--2" />
            <span className="ns-road-line ns-road-line--3" />
            <span className="ns-road-line ns-road-line--4" />
            <span className="ns-road-line ns-road-line--5" />
          </div>

          <div className="ns-travel-emblem">
            <span>✦</span>
          </div>

          <div className="ns-travel-copy">
            <span>
              {waveIndex === 0 && phase === "travel"
                ? t.firstMove
                : phase === "arrival"
                ? t.arriving
                : t.moving}
            </span>

            <strong>{wave.chapter[lang]}</strong>
            <p>{wave.travel[lang]}</p>
          </div>

          <div className="ns-travel-speed">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>

          {bossApproach && (
            <>
              <div className="ns-boss-omen-flash" aria-hidden="true" />
              <div className="ns-boss-omen-eye" aria-hidden="true">∞</div>

              <div className="ns-boss-omen-copy">
                <span className="ns-boss-omen-overline">
                  {lang === "zh" ? "最终区域" : "FINAL AREA"}
                </span>

                <div className="ns-boss-omen-title">
                  <b>∞</b>
                  <strong>
                    {lang === "zh" ? "无尽王座" : "INFINITE THRONE"}
                  </strong>
                </div>

                <p>
                  {lang === "zh"
                    ? "王座深处，有某种存在正在苏醒。"
                    : "Something ancient is awakening beyond the throne."}
                </p>
              </div>

              <div className="ns-boss-omen-board" aria-hidden="true">
                {Array.from({ length: 12 }).map((_, index) => (
                  <span key={index} className={`omen-rune omen-rune--${index % 4}`}>
                    {RUNE_SIGILS[index % RUNE_SIGILS.length]}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {lootFlash && (
        <div className="ns-loot-drop">
          <div className="ns-loot-rays" aria-hidden="true" />
          <div className="ns-loot-magic" aria-hidden="true">
            <i /><i /><i />
          </div>
          <div className={`ns-loot-crystal ns-loot-crystal--${lootFlash.type}`}>
            <span>{lootFlash.icon}</span>
          </div>
          <div className="ns-loot-reveal-copy">
            <small>{lang === "zh" ? "稀有战利品掉落" : "RARE DROP"}</small>
            <strong>{lootFlash[lang]}</strong>
            <p>{LOOT_TEXT[lootFlash.type][lang]}</p>
            <em>{lang === "zh" ? "已收入远征战利品" : "Stored in Expedition Loot"}</em>
          </div>
        </div>
      )}

      <div className="ns-fx-layer" aria-hidden="true">
        {fx.map((item) => {
          if (item.type === "beam") {
            const dx = item.x2 - item.x1;
            const dy = item.y2 - item.y1;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);

            return (
              <span
                key={item.id}
                className="ns-fx-beam"
                style={{
                  left: item.x1,
                  top: item.y1,
                  width: length,
                  transform: `rotate(${angle}deg)`,
                  "--fx": ELEMENT_RGB[item.element],
                }}
              />
            );
          }

          if (item.type === "impact") {
            return (
              <span
                key={item.id}
                className="ns-fx-impact"
                style={{
                  left: item.x,
                  top: item.y,
                  "--fx": ELEMENT_RGB[item.element],
                }}
              >
                {Array.from({ length: 8 }).map((_, index) => (
                  <i key={index} style={{ "--i": index }} />
                ))}
              </span>
            );
          }

          if (item.type === "miss") {
            return (
              <span
                key={item.id}
                className="ns-fx-miss"
                style={{ left: item.x, top: item.y }}
              >
                MISS
              </span>
            );
          }

          if (item.type === "insight") {
            return (
              <span key={item.id} className="ns-fx-insight">
                <i />
                <b>◉</b>
              </span>
            );
          }

          if (item.type === "heal") {
            return (
              <span key={item.id} className="ns-fx-heal">
                <i>♥</i>
                <i>♥</i>
                <i>♥</i>
                <i>♥</i>
                <i>♥</i>
              </span>
            );
          }

          return null;
        })}

        {deathFx && (
          <div className="ns-death-runes">
            {Array.from({ length: 24 }).map((_, index) => (
              <span
                key={index}
                style={{
                  "--x": `${5 + ((index * 37) % 90)}%`,
                  "--delay": `${(index % 8) * 80}ms`,
                  "--spin": `${120 + ((index * 73) % 340)}deg`,
                  "--fall": `${65 + ((index * 29) % 45)}vh`,
                }}
              >
                {RUNE_SIGILS[index % RUNE_SIGILS.length]}
              </span>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div key={toast.id} className={`ns-toast ns-toast--${toast.kind}`}>
          {toast.text}
        </div>
      )}
    </main>
        )}
      </div>
    </div>
  );
}
