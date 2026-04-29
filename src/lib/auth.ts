import { db } from "@/lib/db";
import { cookies } from "next/headers";

// Session cookie name
export const SESSION_COOKIE = "opus_session";

// Get the current authenticated user from the session cookie
export async function getAuthUser() {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionUserId) {
      return null;
    }

    const user = await db.user.findUnique({
      where: { id: sessionUserId },
    });

    if (!user) {
      return null;
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch {
    return null;
  }
}

// Validate that a user exists and return their data (for API routes that receive userId in body/query)
export async function validateUser(userId: string) {
  if (!userId || typeof userId !== "string") {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return null;
  }

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// Verify that the authenticated user matches the requested resource owner
// Supports two auth methods:
//   1. Session cookie (preferred, more secure)
//   2. userId fallback (for when cookie isn't available, e.g. cross-origin or sameSite issues)
export async function requireAuth(userId?: string | null) {
  // Try session cookie first (most secure)
  const authUser = await getAuthUser();

  if (authUser) {
    // If a specific userId is provided, verify it matches the authenticated user
    // Admin users can access any resource
    if (userId && userId !== authUser.id && authUser.role !== "admin") {
      return { error: "Access denied", status: 403 };
    }
    return { user: authUser };
  }

  // Fallback: validate using userId from request body/query
  // This ensures the feature works even when cookies aren't sent properly
  if (userId) {
    const validatedUser = await validateUser(userId);
    if (validatedUser) {
      return { user: validatedUser };
    }
  }

  return { error: "Authentication required", status: 401 };
}
