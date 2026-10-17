"use server";
import { requireRole } from "@/lib/auth";
import { marketError, marketRpc } from "@/lib/stock-market/server";
import { revalidatePath } from "next/cache";

export async function controlMarket(command: string) {
  const user = await requireRole("admin");
  if (!["advance", "pause", "resume", "live"].includes(command)) return { error: "Invalid command" };
  try {
    await marketRpc("control", { command, actor: user.id });
    revalidatePath("/admin/stock-market");
    return { error: "" };
  } catch (error) { return { error: marketError(error) }; }
}
