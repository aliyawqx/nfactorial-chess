import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, isStripeConfigured } from "@/lib/stripe/server";
import { getSupabaseService } from "@/lib/supabase/service";
import { PRODUCTS } from "@/lib/stripe/products";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET missing" },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "no signature" }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (e) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${e instanceof Error ? e.message : ""}` },
      { status: 400 },
    );
  }

  const supabase = getSupabaseService();

  // idempotent: skip уже обработанные события
  const { data: existing } = await supabase
    .from("stripe_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ ok: true, deduplicated: true });
  }

  // пишем событие до обработки — повтор от stripe не запустит логику дважды
  await supabase.from("stripe_events").insert({
    id: event.id,
    type: event.type,
    payload: JSON.parse(JSON.stringify(event)),
  });

  console.log(`[stripe-webhook] received event ${event.type} (${event.id})`);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id ?? session.client_reference_id;
    const productId = session.metadata?.product_id ?? "voicechess_pro";

    console.log(
      `[stripe-webhook] checkout.session.completed user_id=${userId} product=${productId}`,
    );

    if (!userId) {
      console.warn("[stripe-webhook] skipping — no user_id in metadata");
      return NextResponse.json({ ok: true, skipped: "no user_id" });
    }

    const product = PRODUCTS[productId];
    const amountCents = session.amount_total ?? product?.priceCents ?? 0;
    const currency = session.currency ?? product?.currency ?? "usd";
    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : (session.payment_intent?.id ?? null);

    const { error: updErr } = await supabase
      .from("profiles")
      .update({
        is_pro: true,
        pro_purchased_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updErr) {
      console.error("[stripe-webhook] profiles update FAILED:", updErr);
      return NextResponse.json(
        { error: `profiles update failed: ${updErr.message}` },
        { status: 500 },
      );
    }
    console.log(`[stripe-webhook] profiles.is_pro=true for user ${userId}`);

    // best-effort
    const { error: insErr } = await supabase.from("purchases").insert({
      user_id: userId,
      product_id: productId,
      amount_cents: amountCents,
      currency,
      stripe_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
    });
    if (insErr) {
      console.warn("[stripe-webhook] purchases insert failed:", insErr.message);
    }
  }

  return NextResponse.json({ ok: true });
}
