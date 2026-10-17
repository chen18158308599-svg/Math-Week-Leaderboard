"use server";
import { requireUser } from "@/lib/auth";
import { marketError, marketRpc } from "@/lib/stock-market/server";

export async function confirmMarketPair(code: string) {
  const user = await requireUser(`/market-pair/${code}`);
  if (!/^[A-Za-z0-9_-]{43}$/.test(code)) return { success: false, message: "Invalid pairing code." };
  try {
    await marketRpc("pair_confirm", { code, user_id: user.id });
    return { success: true, message: "Connected! Continue on the library trading screen. Your phone does not have trading access." };
  } catch (error) { return { success: false, message: marketError(error) }; }
}
