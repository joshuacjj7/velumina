import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { events } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { password } = await req.json()

  const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1)
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  if (event.password !== password) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set(`event_unlocked_${event.id}`, '1', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    // session cookie — no maxAge means it expires when browser closes
  })

  return response
}