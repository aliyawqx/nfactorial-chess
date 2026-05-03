import { NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe/server";
import { PRODUCTS, PRO_PRODUCT } from "@/lib/stripe/products";
import { getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface CheckoutBody {
  productId?: string;
}

/**
 * Создание Stripe Checkout Session.
 * Требует залогиненного пользователя — user.id попадает в metadata,
 * webhook потом по нему отметит is_pro = true.
 */
export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 503 },
    );
  }

  let body: CheckoutBody = {};
  try {
    body = await request.json();
  } catch {
    /* empty body OK */
  }

  const productId = body.productId ?? PRO_PRODUCT.id;
  const product = PRODUCTS[productId];
  if (!product) {
    return NextResponse.json({ error: "Unknown product" }, { status: 400 });
  }

  const supabase = await getSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user || user.is_anonymous) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const stripe = getStripe();
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: product.currency,
          unit_amount: product.priceCents,
          product_data: {
            name: product.name,
            description: product.description,
          },
        },
        quantity: 1,
      },
    ],
    client_reference_id: user.id,
    customer_email: user.email ?? undefined,
    metadata: {
      user_id: user.id,
      product_id: product.id,
    },
    success_url: `${origin}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/shop?canceled=1`,
  });

  return NextResponse.json({ url: session.url });
}
