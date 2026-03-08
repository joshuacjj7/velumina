import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users, invites } from '@/db/schema'
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
  const { token, name, password } = await req.json()

  if (!token || !name || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const [invite] = await db
    .select()
    .from(invites)
    .where(eq(invites.token, token))
    .limit(1)

  if (!invite || invite.usedAt || new Date() > invite.expiresAt) {
    return NextResponse.json({ error: 'Invite is invalid or expired' }, { status: 400 })
  }

    if (!isStrongPassword(password)) {
        return NextResponse.json(
        { error: 'Password must be at least 8 characters and include an uppercase letter, a number, and a special character.' },
        { status: 400 }
        )
    }

  const hashedPassword = await bcrypt.hash(password, 12)

  await db.insert(users).values({
    name,
    email: invite.email,
    password: hashedPassword,
    isAdmin: true,
  })

  await db
    .update(invites)
    .set({ usedAt: new Date() })
    .where(eq(invites.token, token))

  return NextResponse.json({ success: true })
}