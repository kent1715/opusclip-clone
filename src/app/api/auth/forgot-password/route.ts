import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { sendEmail, isSmtpConfigured, generateResetEmailHtml, generateResetEmailText } from "@/lib/email";
import { setResetToken, getResetToken, deleteResetToken } from "@/lib/token-store";

// POST: Request password reset
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email },
    });

    // Always return success for security (don't reveal if email exists)
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If an account with this email exists, a reset link has been sent.",
      });
    }

    // Generate reset token
    const token = randomUUID();
    const expires = Date.now() + 3600000; // 1 hour

    // Store token in persistent file-based store
    setResetToken(token, { email, expires });

    // Build reset URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/?reset=${token}`;

    // Check if SMTP is configured
    const useSmtp = isSmtpConfigured();

    if (useSmtp) {
      // Production mode: send a real email
      const html = generateResetEmailHtml(resetUrl);
      const text = generateResetEmailText(resetUrl);

      await sendEmail({
        to: email,
        subject: "Reset Your Password – OpusClip",
        html,
        text,
      });

      return NextResponse.json({
        success: true,
        message: "If an account with this email exists, a reset link has been sent.",
      });
    } else {
      // Demo / dev mode: return the reset URL in the response
      return NextResponse.json({
        success: true,
        message: "If an account with this email exists, a reset link has been sent.",
        demoResetUrl: resetUrl,
      });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

// PUT: Reset password with token
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Token and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Look up token from persistent store
    const tokenData = getResetToken(token);

    if (!tokenData) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Check if token expired
    if (Date.now() > tokenData.expires) {
      deleteResetToken(token);
      return NextResponse.json(
        { error: "Reset token has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: tokenData.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Delete used token
    deleteResetToken(token);

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully. You can now sign in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
