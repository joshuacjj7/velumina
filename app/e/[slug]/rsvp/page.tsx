import { db } from '@/db'
import { events, rsvps } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import RsvpForm from './rsvp-form'

export default async function RsvpPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { slug } = await params
  const { token } = await searchParams

  const [event] = await db.select().from(events).where(eq(events.slug, slug)).limit(1)
  if (!event || !event.rsvpEnabled) notFound()

  let existingRsvp = null
  if (token) {
    const [rsvp] = await db.select().from(rsvps).where(eq(rsvps.token, token)).limit(1)
    if (rsvp && rsvp.eventId === event.id) {
      let parsedGuestNames: string[] | null = null
      if (rsvp.guestNames) {
        try { parsedGuestNames = JSON.parse(rsvp.guestNames) } catch {}
      }
      existingRsvp = {
        name: rsvp.name,
        email: rsvp.email,
        attending: rsvp.attending,
        guestCount: rsvp.guestCount,
        guestNames: parsedGuestNames,
        dietaryNotes: rsvp.dietaryNotes,
        token: rsvp.token,
      }
    }
  }

  const dateStr = event.date
    ? new Date(event.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16" style={{ backgroundColor: 'var(--ivory)' }}>
      <div className="relative w-full max-w-md text-center">
        {/* Decorative rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
          <div className="w-[500px] h-[500px] rounded-full border border-rose-100 opacity-40" />
          <div className="absolute w-[340px] h-[340px] rounded-full border border-rose-100 opacity-30" />
        </div>

        <p className="font-display text-sm tracking-[0.3em] uppercase mb-3" style={{ color: 'var(--rose)' }}>
          {existingRsvp ? 'Edit your response' : "You're invited"}
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-light leading-tight mb-2" style={{ color: 'var(--charcoal)' }}>
          {event.name}
        </h1>
        {dateStr && (
          <p className="font-sans text-sm mb-6" style={{ color: 'var(--muted)' }}>
            {dateStr}
          </p>
        )}

        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-px w-12" style={{ backgroundColor: 'var(--rose)', opacity: 0.4 }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--rose)' }} />
          <div className="h-px w-12" style={{ backgroundColor: 'var(--rose)', opacity: 0.4 }} />
        </div>

        <RsvpForm eventId={event.id} existing={existingRsvp} />
      </div>
    </main>
  )
}
