import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { SESSION_COOKIE } from '@/lib/auth'
import {
  checkLoginRateLimit,
  recordLoginAttempt,
  getLoginIdentifier,
  getClientIp,
  formatRetryTime,
  sanitizeEmail,
} from '@/lib/auth-security'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const rawEmail = body.email
    const rawPassword = body.password

    // Validate required fields
    if (!rawEmail || !rawPassword) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Sanitize email
    const email = sanitizeEmail(rawEmail)
    const ip = getClientIp(request)
    const identifier = getLoginIdentifier(email, ip)

    // Check rate limit
    const rateLimit = checkLoginRateLimit(identifier)
    if (!rateLimit.allowed) {
      const retryTime = formatRetryTime(rateLimit.retryAfterMs || 0)
      return NextResponse.json(
        {
          error: `Too many login attempts. Please try again in ${retryTime}.`,
          retryAfter: rateLimit.retryAfterMs,
        },
        { status: 429 }
      )
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
    })

    if (!user) {
      recordLoginAttempt(identifier, false)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Compare password with bcrypt hash
    const isValid = await bcrypt.compare(rawPassword, user.password || '')

    if (!isValid) {
      recordLoginAttempt(identifier, false)
      const remaining = rateLimit.remainingAttempts ?? 0
      return NextResponse.json(
        {
          error: 'Invalid email or password',
          ...(remaining <= 3 && remaining > 0
            ? { warning: `${remaining} attempt${remaining === 1 ? '' : 's'} remaining before temporary lockout` }
            : {}),
        },
        { status: 401 }
      )
    }

    // Record successful login
    recordLoginAttempt(identifier, true)

    // Return user object without password
    const { password: _, ...userWithoutPassword } = user

    // Create response with user data
    const response = NextResponse.json(
      {
        user: userWithoutPassword,
        message: 'Login successful',
      },
      { status: 200 }
    )

    // Set session cookie (httpOnly for security, 30 day expiry)
    response.cookies.set(SESSION_COOKIE, user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
