import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { events } from '@/db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'
import { sendRsvpReminders } from '@/lib/email/rsvp-reminder'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find events with RSVP enabled, happening within the next 7 days
  const now = new Date()
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const upcomingEvents = await db.select().from(events).where(
    and(
      eq(events.rsvpEnabled, true),
      gte(events.date, now),
      lte(events.date, sevenDaysFromNow),
    )
  )

  let totalSent = 0
  const results: { eventName: string; sent: number }[] = []

  for (const event of upcomingEvents) {
    const sent = await sendRsvpReminders(event.id)
    totalSent += sent
    results.push({ eventName: event.name, sent })
  }

  return NextResponse.json({
    eventsProcessed: upcomingEvents.length,
    totalRemindersSent: totalSent,
    details: results,
  })
}
