import { db } from '@/db'
import { events, media } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import GuestGallery from './guest-gallery'
import EventUnlock from './event-unlock'
import { cookies } from 'next/headers'

export default async function GuestEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const [event] = await db.select().from(events).where(eq(events.slug, slug)).limit(1)
  if (!event) notFound()

  // Check if event is password protected
  if (event.password) {
    const cookieStore = await cookies()
    const unlocked = cookieStore.get(`event_unlocked_${event.id}`)
    if (!unlocked) {
      return <EventUnlock event={{ id: event.id, name: event.name, date: event.date }} />
    }
  }
  const rows = await db
    .select({
      id: media.id,
      filename: media.filename,
      webFilename: media.webFilename,
      thumbnailFilename: media.thumbnailFilename,
      originalName: media.originalName,
      blurDataUrl: media.blurDataUrl,
      caption: media.caption,
      uploadedBy: media.uploadedBy,
      mediaType: media.mediaType,
      width: media.width,
      height: media.height,
      createdAt: media.createdAt,
    })
    .from(media)
    .where(eq(media.eventId, event.id))
    .orderBy(desc(media.createdAt))
    .limit(25)

  const hasMore = rows.length > 24
  const initialMedia = hasMore ? rows.slice(0, 24) : rows


  return (
    <main className="min-h-screen" style={{ backgroundColor: 'var(--ivory)' }}>
      {/* Hero header */}
      <div className="relative px-6 py-16 sm:py-24 text-center overflow-hidden">
        {/* Decorative background rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full border border-rose-100 opacity-40" />
          <div className="absolute w-[400px] h-[400px] rounded-full border border-rose-100 opacity-30" />
        </div>

        <p className="font-display text-sm tracking-[0.3em] uppercase mb-3" style={{ color: 'var(--rose)' }}>
          You're invited to view
        </p>
        <h1 className="font-display text-5xl sm:text-7xl font-light leading-tight" style={{ color: 'var(--charcoal)' }}>
          {event.name}
        </h1>
        {event.date && (
          <p className="font-sans text-sm mt-4" style={{ color: 'var(--muted)' }}>
            {new Date(event.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        )}
        {event.description && (
          <p className="font-display text-xl font-light mt-4 max-w-lg mx-auto italic" style={{ color: 'var(--muted)' }}>
            {event.description}
          </p>
        )}

        {/* Divider */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <div className="h-px w-16" style={{ backgroundColor: 'var(--rose)', opacity: 0.4 }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--rose)' }} />
          <div className="h-px w-16" style={{ backgroundColor: 'var(--rose)', opacity: 0.4 }} />
        </div>

        {event.rsvpEnabled && (
          <a
            href={`/e/${slug}/rsvp`}
            className="inline-block px-8 py-3 rounded-full text-sm font-sans font-medium mt-8 transition hover:opacity-80"
            style={{ backgroundColor: 'var(--charcoal)', color: 'var(--ivory)' }}
          >
            RSVP to this event
          </a>
        )}
      </div>

      <GuestGallery
          event={event}
          initialMedia={initialMedia}
          initialHasMore={hasMore}
        />

      {/* Footer */}
      <footer className="text-center py-10 mt-8">
        <p className="font-display text-sm italic" style={{ color: 'var(--muted)' }}>
          Powered by Velumina
        </p>
      </footer>
    </main>
  )
}