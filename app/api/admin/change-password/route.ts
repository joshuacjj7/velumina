import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

function isStrongPassword(p: string) {
  return (
    p.length >= 8 &&
    /[A-Z]/.test(p) &&
    /[0-9]/.test(p) &&
    /[^A-Za-z0-9]/.test(p)
  )
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { current, newPassword } = await req.json()

  if (!current || !newPassword) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  if (!isStrongPassword(newPassword)) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters and include an uppercase letter, a number, and a special character.' },
      { status: 400 }
    )
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1)

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const currentMatches = await bcrypt.compare(current, user.password)
  if (!currentMatches) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
  }

  if (await bcrypt.compare(newPassword, user.password)) {
    return NextResponse.json({ error: 'New password must be different from current password' }, { status: 400 })
  }

  const hashed = await bcrypt.hash(newPassword, 12)
  await db.update(users).set({ password: hashed }).where(eq(users.id, user.id))

  return NextResponse.json({ success: true })
}