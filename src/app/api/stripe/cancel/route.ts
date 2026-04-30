import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  return NextResponse.redirect(new URL(`${baseUrl}/?upgrade=cancelled`, request.url));
}
