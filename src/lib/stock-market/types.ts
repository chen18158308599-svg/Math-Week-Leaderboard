export type Code = "LIB" | "BOOK" | "DONA";
export type MarketTrade = { id: string; day: number; code: Code; side: "buy" | "sell"; quantity: number; price: number; amount: number; created_at: string; cash_after: number; units_after: number };
export type MarketState = {
  day: number; settledDay: number; phase: "open" | "closed" | "ended" | "upcoming" | "paused";
  close: string; serverTime: string; lastSettlement: string | null;
  stocks: { code: Code; price: number; change: number; prices: number[]; clue_en: string; clue_zh: string }[];
  portfolio: { nickname: string; sessionId: string; cash: number; assets: number; holdings: Record<Code, number>; expiresAt: string; trades: MarketTrade[] } | null;
  leaderboard: { rank: number; nickname: string; assets: number }[];
  pairing: "waiting" | "none";
};
