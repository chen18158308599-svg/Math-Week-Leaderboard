"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type NicknameFormState = { error?: string };

export async function setNicknameAction(
  next: string,
  _prevState: NicknameFormState,
  formData: FormData
): Promise<NicknameFormState> {
  const nickname = String(formData.get("nickname") ?? "").trim();

  if (nickname.length < 3 || nickname.length > 20) {
    return { error: "Nickname must be 3-20 characters." };
  }

  const supabase = await createClient();
  // @ts-expect-error — @supabase/supabase-js's RPC arg-narrowing generics don't resolve
  // correctly through @supabase/ssr's client wrapper as of ssr@0.12.4 / supabase-js@2.112.
  // Runtime call is correct (matches supabase/migrations/0001_init.sql's set_my_nickname);
  // remove this once an upstream release fixes the type inference.
  const { error } = await supabase.rpc("set_my_nickname", { new_nickname: nickname });

  if (error) {
    // Most likely the unique constraint on profiles.nickname.
    const message = error.message.includes("duplicate")
      ? "That nickname is taken — try another."
      : error.message;
    return { error: message };
  }

  redirect(next || "/");
}
