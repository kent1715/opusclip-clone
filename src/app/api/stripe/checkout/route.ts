import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2025-04-30.basil",
});

const PLAN_CONFIG: Record<string, { priceId: string; amount: number; clipsLimit: number }> = {
  pro: {
    priceId: process.env.STRIPE_PRO_PRICE_ID || "price_pro_placeholder",
    amount: 1900, // $19.00
    clipsLimit: 200,
  },
  business: {
    priceId: process.env.STRIPE_BUSINESS_PRICE_ID || "price_business_placeholder",
    amount: 4900, // $49.00
    clipsLimit: 999,
  },
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { plan, userId } = body;

    if (!plan || !userId) {
      return NextResponse.json(
        { error: "plan and userId are required" },
        { status: 400 }
      );
    }

    if (plan === "free") {
      return NextResponse.json(
        { error: "Cannot checkout for free plan" },
        { status: 400 }
      );
    }

    const planConfig = PLAN_CONFIG[plan];
    if (!planConfig) {
      return NextResponse.json(
        { error: "Invalid plan. Must be 'pro' or 'business'" },
        { status: 400 }
      );
    }

    const auth = await requireAuth(userId);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "sk_test_placeholder") {
      // Demo mode: directly upgrade the plan without Stripe
      const updatedUser = await db.user.update({
        where: { id: userId },
        data: {
          plan,
          clipsLimit: planConfig.clipsLimit,
        },
      });

      const { password: _, ...userWithoutPassword } = updatedUser;

      return NextResponse.json({
        success: true,
        demo: true,
        message: "Demo mode: Plan upgraded without payment",
        user: userWithoutPassword,
      });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `OpusClip ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
              description: `${planConfig.clipsLimit} clips per month with all ${plan} features`,
            },
            unit_amount: planConfig.amount,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      subscription_data: {
        metadata: {
          userId,
          plan,
        },
      },
      success_url: `${baseUrl}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}&userId=${userId}&plan=${plan}`,
      cancel_url: `${baseUrl}/api/stripe/cancel?userId=${userId}`,
      metadata: {
        userId,
        plan,
      },
    });

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
