import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, SESSION_COOKIE } from '@/lib/auth'

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Verify auth and ownership
    const auth = await requireAuth(userId)
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    // Delete user - cascade will handle videos, clips, templates
    await db.user.delete({
      where: { id: userId },
    })

    // Clear session cookie
    const response = NextResponse.json(
      { message: 'Account deleted successfully' },
      { status: 200 }
    )
    response.cookies.set(SESSION_COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
