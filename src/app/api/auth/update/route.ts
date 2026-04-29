import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { userId, name, plan, clipsUsed } = body

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

    // Verify user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Build update data object with only provided fields
    const updateData: Record<string, unknown> = {}

    if (name !== undefined) {
      updateData.name = name
    }

    if (plan !== undefined) {
      const validPlans = ['free', 'pro', 'business']
      if (!validPlans.includes(plan)) {
        return NextResponse.json(
          { error: 'Invalid plan. Must be one of: free, pro, business' },
          { status: 400 }
        )
      }
      updateData.plan = plan

      // Update clips limit based on plan
      const planLimits: Record<string, number> = {
        free: 5,
        pro: 200,
        business: 999,
      }
      updateData.clipsLimit = planLimits[plan] ?? 5
    }

    if (clipsUsed !== undefined) {
      if (typeof clipsUsed !== 'number' || clipsUsed < 0) {
        return NextResponse.json(
          { error: 'clipsUsed must be a non-negative number' },
          { status: 400 }
        )
      }
      updateData.clipsUsed = clipsUsed
    }

    // Ensure at least one field to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields provided to update' },
        { status: 400 }
      )
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
    })

    // Return updated user without password
    const { password: _, ...userWithoutPassword } = updatedUser

    return NextResponse.json(
      {
        user: userWithoutPassword,
        message: 'User updated successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
