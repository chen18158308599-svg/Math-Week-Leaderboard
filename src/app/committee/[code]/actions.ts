"use server";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function claimCommittee(code: string): Promise<{ message: string; success: boolean }> {
  await requireUser(`/committee/${code}`);
  const supabase = await createClient();
  // @ts-expect-error Supabase's inferred RPC input is never with the handwritten schema.
  const result = await supabase.rpc("committee_award", { p_code: code, p_claim: true });
  const { data, error } = result as unknown as { data: { points_added: number; total_points: number }[] | null; error: unknown };
  if (error || !data?.[0]) return { success: false, message: "Unable to claim. Please try again or ask the committee." };
  revalidatePath(`/committee/${code}`);
  revalidatePath("/my-score");
  revalidatePath("/leaderboard");
  return { success: true, message: data[0].points_added ? `+${data[0].points_added} points claimed! Activity total: ${data[0].total_points}.` : "You have already claimed these points." };
}
