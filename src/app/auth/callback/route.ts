import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

// OAuth и email confirmation callback.
// Supabase редиректит сюда с ?code=... после подтверждения; мы обмениваем
// code на session и редиректим на ?next= (или на главную).

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/";

  if (code) {
    const supabase = await getSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin),
      );
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
