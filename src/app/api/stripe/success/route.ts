import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const PLAN_LIMITS: Record<string, number> = {
  pro: 200,
  business: 999,
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const plan = searchParams.get("plan");
    const sessionId = searchParams.get("session_id");

    if (!userId || !plan) {
      return NextResponse.redirect(new URL("/?error=invalid_checkout", request.url));
    }

    // Update user plan
    const clipsLimit = PLAN_LIMITS[plan] || 5;
    await db.user.update({
      where: { id: userId },
      data: { plan, clipsLimit },
    });

    // Redirect to dashboard with success message
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    return NextResponse.redirect(new URL(`${baseUrl}/?upgrade=success&plan=${plan}`, request.url));
  } catch (error) {
    console.error("Stripe success handler error:", error);
    return NextResponse.redirect(new URL("/?error=upgrade_failed", request.url));
  }
}
