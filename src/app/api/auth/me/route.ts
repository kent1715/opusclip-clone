import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    // Try session cookie first (more secure)
    const authUser = await getAuthUser()

    if (authUser) {
      // Get full user data with relations
      const fullUser = await db.user.findUnique({
        where: { id: authUser.id },
        include: {
          videos: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          templates: {
            where: { isDefault: true },
            take: 3,
          },
        },
      })

      if (fullUser) {
        const { password: _, ...userWithoutPassword } = fullUser
        return NextResponse.json({ user: userWithoutPassword }, { status: 200 })
      }
    }

    // Fallback: check query params (for backward compatibility with localStorage)
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const email = searchParams.get('email')

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const user = await db.user.findUnique({
      where: userId ? { id: userId } : { email: email! },
      include: {
        videos: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        templates: {
          where: { isDefault: true },
          take: 3,
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(
      { user: userWithoutPassword },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
