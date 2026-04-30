import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { SESSION_COOKIE } from '@/lib/auth'

/**
 * @deprecated This route is deprecated. Use the real OAuth flow instead:
 *   - GET /api/auth/oauth/google — initiates Google OAuth
 *   - GET /api/auth/oauth/github — initiates GitHub OAuth
 * This route is kept for backwards compatibility only.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { provider, name, email: providedEmail } = body

    if (!provider || !name) {
      return NextResponse.json(
        { error: 'Provider and name are required' },
        { status: 400 }
      )
    }

    // Generate a unique email based on provider and a unique ID
    // If an email is provided from the OAuth flow, use it; otherwise generate one
    const email = providedEmail || `${provider.toLowerCase()}_${randomUUID().slice(0, 8)}@social.opusclip.app`

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    let user

    if (existingUser) {
      // User exists, log them in
      user = existingUser
    } else {
      // Create a new user with a random secure password
      const randomPassword = randomUUID()
      const hashedPassword = await bcrypt.hash(randomPassword, 12)

      user = await db.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: 'user',
          plan: 'free',
          clipsLimit: 5,
          clipsUsed: 0,
        },
      })
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user

    // Create response with session cookie
    const response = NextResponse.json(
      {
        user: userWithoutPassword,
        message: `${provider} sign-in successful`,
      },
      { status: 200 }
    )

    // Set session cookie
    response.cookies.set(SESSION_COOKIE, user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Social login error:', error)
    return NextResponse.json(
      { error: 'Failed to sign in. Please try again.' },
      { status: 500 }
    )
  }
}
