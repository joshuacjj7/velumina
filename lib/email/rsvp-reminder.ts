import { db } from '@/db'
import { rsvps, events } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendRsvpReminders(eventId: string) {
  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1)
  if (!event || !event.date) return 0

  // Get confirmed RSVPs that haven't been reminded
  const pendingReminders = await db.select().from(rsvps).where(
    and(
      eq(rsvps.eventId, eventId),
      eq(rsvps.attending, true),
      isNull(rsvps.reminderSentAt),
    )
  )

  if (pendingReminders.length === 0) return 0

  const dateStr = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const daysUntil = Math.ceil((event.date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  let sent = 0
  for (const rsvp of pendingReminders) {
    try {
      await resend.emails.send({
        from: 'Velumina <' + (process.env.RESEND_FROM_EMAIL) + '>',
        to: rsvp.email,
        subject: `Reminder: ${event.name} is in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
            <h1 style="font-size: 24px; font-weight: 600; color: #1C1C1C; margin-bottom: 8px;">
              See you soon, ${rsvp.name}!
            </h1>
            <p style="color: #8C8279; font-size: 15px; margin-bottom: 16px;">
              Just a friendly reminder that <strong>${event.name}</strong> is coming up.
            </p>
            <div style="background: #f9f7f4; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0 0 4px 0; font-size: 14px; color: #1C1C1C;">
                <strong>Date:</strong> ${dateStr}
              </p>
              <p style="margin: 0; font-size: 14px; color: #1C1C1C;">
                <strong>Guests:</strong> ${rsvp.guestCount}
              </p>
            </div>
            <p style="color: #8C8279; font-size: 13px;">
              Need to update your RSVP? Use the link from your confirmation email.
            </p>
          </div>
        `,
      })

      await db.update(rsvps).set({ reminderSentAt: new Date() }).where(eq(rsvps.id, rsvp.id))
      sent++
    } catch (err) {
      console.error(`Failed to send reminder to ${rsvp.email}:`, err)
    }
  }

  return sent
}
