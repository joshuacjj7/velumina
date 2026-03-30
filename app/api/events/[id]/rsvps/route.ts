import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { rsvps, events } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { randomBytes } from 'crypto'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const rows = await db.select().from(rsvps).where(eq(rsvps.eventId, id))
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { name, email, attending, guestCount, guestNames, dietaryNotes } = body

  if (!name || !email || attending === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1)
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  if (!event.rsvpEnabled) return NextResponse.json({ error: 'RSVPs are not enabled' }, { status: 403 })

  // Check for existing RSVP with same email — update instead of duplicating
  const [existingByEmail] = await db.select().from(rsvps)
    .where(and(eq(rsvps.eventId, id), eq(rsvps.email, email.toLowerCase())))
    .limit(1)

  let rsvp
  let rsvpToken: string

  if (existingByEmail) {
    rsvpToken = existingByEmail.token
    ;[rsvp] = await db.update(rsvps).set({
      name,
      attending,
      guestCount: attending ? (guestCount ?? 1) : 0,
      guestNames: attending && guestNames?.length ? JSON.stringify(guestNames) : null,
      dietaryNotes: attending ? (dietaryNotes || null) : null,
      updatedAt: new Date(),
    }).where(eq(rsvps.id, existingByEmail.id)).returning()
  } else {
    rsvpToken = randomBytes(32).toString('hex')
    ;[rsvp] = await db.insert(rsvps).values({
      eventId: id,
      name,
      email: email.toLowerCase(),
      attending,
      guestCount: attending ? (guestCount ?? 1) : 0,
      guestNames: attending && guestNames?.length ? JSON.stringify(guestNames) : null,
      dietaryNotes: attending ? (dietaryNotes || null) : null,
      token: rsvpToken,
    }).returning()
  }

  // Send confirmation email
  const editUrl = `${process.env.NEXT_PUBLIC_APP_URL}/e/${event.slug}/rsvp?token=${rsvpToken}`
  const dateStr = event.date
    ? new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : null

  try {
    await resend.emails.send({
      from: 'Velumina <' + (process.env.RESEND_FROM_EMAIL) + '>',
      to: email,
      subject: `RSVP Confirmation — ${event.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h1 style="font-size: 24px; font-weight: 600; color: #1C1C1C; margin-bottom: 8px;">
            RSVP Confirmed
          </h1>
          <p style="color: #8C8279; font-size: 15px; margin-bottom: 16px;">
            Thank you, ${name}! Your RSVP for <strong>${event.name}</strong> has been recorded.
          </p>
          <div style="background: #f9f7f4; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0 0 4px 0; font-size: 14px; color: #1C1C1C;"><strong>Status:</strong> ${attending ? 'Attending' : 'Not attending'}</p>
            ${attending ? `<p style="margin: 0 0 4px 0; font-size: 14px; color: #1C1C1C;"><strong>Guests:</strong> ${guestCount ?? 1}</p>` : ''}
            ${dateStr ? `<p style="margin: 0; font-size: 14px; color: #1C1C1C;"><strong>Date:</strong> ${dateStr}</p>` : ''}
          </div>
          <a href="${editUrl}"
            style="display: inline-block; background: #1C1C1C; color: white;
                   padding: 12px 24px; border-radius: 8px; text-decoration: none;
                   font-size: 14px; font-weight: 500;">
            Edit your RSVP
          </a>
          <p style="color: #8C8279; font-size: 12px; margin-top: 24px;">
            Or copy this link: ${editUrl}
          </p>
        </div>
      `,
    })
  } catch (err) {
    console.error('Failed to send RSVP confirmation email:', err)
  }

  return NextResponse.json(rsvp, { status: 201 })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { token, name, email, attending, guestCount, guestNames, dietaryNotes } = body

  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

  const [existing] = await db.select().from(rsvps)
    .where(and(eq(rsvps.token, token), eq(rsvps.eventId, id)))
    .limit(1)

  if (!existing) return NextResponse.json({ error: 'RSVP not found' }, { status: 404 })

  const [updated] = await db.update(rsvps).set({
    name: name ?? existing.name,
    email: email ? email.toLowerCase() : existing.email,
    attending: attending ?? existing.attending,
    guestCount: attending ? (guestCount ?? existing.guestCount) : 0,
    guestNames: attending && guestNames?.length ? JSON.stringify(guestNames) : null,
    dietaryNotes: attending ? (dietaryNotes ?? existing.dietaryNotes) : null,
    updatedAt: new Date(),
  }).where(eq(rsvps.id, existing.id)).returning()

  return NextResponse.json(updated)
}
