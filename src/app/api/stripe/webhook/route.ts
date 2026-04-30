import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2025-04-30.basil",
});

const PLAN_LIMITS: Record<string, number> = {
  free: 5,
  pro: 200,
  business: 999,
};

const FREE_PLAN = { plan: "free", clipsLimit: PLAN_LIMITS.free } as const;

export async function POST(request: Request) {
  // 1. Read the raw body as text (required for signature verification)
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    console.error("Stripe webhook: Missing stripe-signature header");
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  // 2. Verify the Stripe webhook signature
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown signature verification error";
    console.error("Stripe webhook signature verification failed:", message);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  // 3. Process the event
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutSessionCompleted(event);
        break;
      }

      case "customer.subscription.updated": {
        await handleSubscriptionUpdated(event);
        break;
      }

      case "customer.subscription.deleted": {
        await handleSubscriptionDeleted(event);
        break;
      }

      case "invoice.payment_failed": {
        await handleInvoicePaymentFailed(event);
        break;
      }

      default: {
        console.log(`Stripe webhook: Unhandled event type: ${event.type}`);
        // Always return 200 for unhandled event types (Stripe requirement)
        break;
      }
    }
  } catch (error) {
    console.error(`Stripe webhook error processing event ${event.type}:`, error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  // Return 200 to acknowledge receipt of the event
  return NextResponse.json({ received: true });
}

/**
 * Handle checkout.session.completed
 * Fires when a customer completes the checkout flow for a subscription.
 * Update the user's plan and clipsLimit based on the session metadata.
 */
async function handleCheckoutSessionCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;

  const userId = session.metadata?.userId;
  const plan = session.metadata?.plan;

  if (!userId || !plan) {
    console.error(
      "Stripe webhook (checkout.session.completed): Missing userId or plan in session metadata",
      { sessionId: session.id, metadata: session.metadata }
    );
    return;
  }

  const clipsLimit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;

  await db.user.update({
    where: { id: userId },
    data: { plan, clipsLimit },
  });

  console.log(
    `Stripe webhook: Upgraded user ${userId} to ${plan} plan (clipsLimit: ${clipsLimit})`
  );
}

/**
 * Handle customer.subscription.updated
 * Fires when a subscription is modified (plan change, etc.).
 * Sync the user's plan based on the subscription's price and metadata.
 */
async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error(
      "Stripe webhook (customer.subscription.updated): Missing userId in subscription metadata",
      { subscriptionId: subscription.id }
    );
    return;
  }

  // If the subscription is no longer active, downgrade to free
  if (subscription.status !== "active") {
    await db.user.update({
      where: { id: userId },
      data: FREE_PLAN,
    });
    console.log(
      `Stripe webhook: Subscription inactive (${subscription.status}), downgraded user ${userId} to free`
    );
    return;
  }

  // Determine the plan from metadata or from the price ID
  const plan = subscription.metadata?.plan;

  if (plan && PLAN_LIMITS[plan]) {
    await db.user.update({
      where: { id: userId },
      data: { plan, clipsLimit: PLAN_LIMITS[plan] },
    });
    console.log(
      `Stripe webhook: Updated user ${userId} to ${plan} plan (clipsLimit: ${PLAN_LIMITS[plan]})`
    );
  } else {
    console.log(
      `Stripe webhook (customer.subscription.updated): No recognized plan in metadata for subscription ${subscription.id}, skipping update`
    );
  }
}

/**
 * Handle customer.subscription.deleted
 * Fires when a subscription is cancelled and the billing period ends.
 * Downgrade the user to the free plan.
 */
async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error(
      "Stripe webhook (customer.subscription.deleted): Missing userId in subscription metadata",
      { subscriptionId: subscription.id }
    );
    return;
  }

  await db.user.update({
    where: { id: userId },
    data: FREE_PLAN,
  });

  console.log(
    `Stripe webhook: Subscription deleted, downgraded user ${userId} to free plan`
  );
}

/**
 * Handle invoice.payment_failed
 * Fires when a payment attempt fails (e.g., expired card).
 * Log the failure for monitoring; the user keeps their current plan
 * until the subscription is explicitly cancelled/deleted.
 */
async function handleInvoicePaymentFailed(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;

  const userId = (invoice as Record<string, unknown>).metadata
    ? ((invoice as Record<string, unknown>).metadata as Record<string, unknown>).userId
    : invoice.subscription_details?.metadata?.userId;

  console.warn(
    `Stripe webhook: Payment failed for invoice ${invoice.id}`,
    {
      userId: userId || "unknown",
      customerId: invoice.customer,
      attemptCount: invoice.attempt_count,
      amountDue: invoice.amount_due,
      currency: invoice.currency,
    }
  );

  // Note: We intentionally do NOT downgrade the user immediately on payment failure.
  // Stripe will retry the payment according to its retry schedule. The user will be
  // downgraded only when the subscription is deleted (customer.subscription.deleted).
}
