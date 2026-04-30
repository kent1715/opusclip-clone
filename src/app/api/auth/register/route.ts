import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { SESSION_COOKIE } from '@/lib/auth'
import {
  checkRegisterRateLimit,
  recordRegisterAttempt,
  getClientIp,
  validatePasswordStrength,
  sanitizeEmail,
  sanitizeInput,
} from '@/lib/auth-security'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const rawEmail = body.email
    const rawName = body.name
    const rawPassword = body.password

    // Rate limit check
    const ip = getClientIp(request)
    const rateLimit = checkRegisterRateLimit(ip)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Validate required fields
    if (!rawEmail || !rawPassword) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const email = sanitizeEmail(rawEmail)
    const name = rawName ? sanitizeInput(rawName, 100) : null

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordCheck = validatePasswordStrength(rawPassword)
    if (!passwordCheck.valid) {
      return NextResponse.json(
        {
          error: passwordCheck.errors.join('. '),
          strength: passwordCheck.strength,
        },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password with bcrypt (salt rounds: 12)
    const hashedPassword = await bcrypt.hash(rawPassword, 12)

    // Create user in database
    const user = await db.user.create({
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

    // Record registration attempt
    recordRegisterAttempt(ip)

    // Return user object without password
    const { password: _, ...userWithoutPassword } = user

    // Create response with user data
    const response = NextResponse.json(
      {
        user: userWithoutPassword,
        message: 'Account created successfully',
      },
      { status: 201 }
    )

    // Set session cookie (httpOnly for security, 30 day expiry)
    // Note: secure=false when no HTTPS (e.g. EC2 with HTTP only)
    const isSecure = process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_BASE_URL?.startsWith('https')
    response.cookies.set(SESSION_COOKIE, user.id, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
