import { db } from '@/db'
import { events, media, rsvps } from '@/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {  updateEvent } from './actions'
import QRCode from './qr-code'
import AdminMediaGrid from './media-grid'



export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1)
  if (!event) notFound()

  const eventMedia = await db.select().from(media).where(eq(media.eventId, id)).orderBy(desc(media.createdAt))

  const allRsvps = await db.select().from(rsvps).where(eq(rsvps.eventId, id))
  const confirmedRsvps = allRsvps.filter(r => r.attending)
  const totalGuests = confirmedRsvps.reduce((sum, r) => sum + r.guestCount, 0)

  const guestUrl = `${process.env.NEXT_PUBLIC_APP_URL}/e/${event.slug}`

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/events" className="text-sm text-neutral-400 hover:underline">
          Events
        </Link>
        <span className="text-neutral-300">/</span>
        <span className="text-sm text-neutral-600">{event.name}</span>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
        {/* Left — event details */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Edit form */}
          <div className="bg-white border border-neutral-100 rounded-xl p-5">
            <h2 className="font-semibold text-neutral-800 mb-4">Event details</h2>
            <form action={updateEvent} className="flex flex-col gap-4">
              <input type="hidden" name="id" value={event.id} />

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-neutral-700">Event name</label>
                <input
                  name="name"
                  defaultValue={event.name}
                  className="border border-neutral-200 rounded-lg px-3 py-2 text-sm text-gray-600 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-neutral-300"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-neutral-700">Slug</label>
                <input
                  name="slug"
                  defaultValue={event.slug}
                  className="border border-neutral-200 rounded-lg px-3 py-2 text-sm text-gray-600 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-neutral-300"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-neutral-700">Date</label>
                <input
                  name="date"
                  type="date"
                  defaultValue={event.date ? new Date(event.date).toISOString().split('T')[0] : ''}
                  className="border border-neutral-200 rounded-lg px-3 py-2 text-sm text-gray-600 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-neutral-300"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-neutral-700">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={event.description ?? ''}
                  className="border border-neutral-200 rounded-lg px-3 py-2 text-sm text-gray-600 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 resize-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-neutral-700">
                  Password protection
                </label>
                <input
                  name="password"
                  type="text"
                  defaultValue={event.password ?? ''}
                  placeholder="Leave empty for public access"
                  className="border border-neutral-200 rounded-lg px-3 py-2 text-sm text-gray-600 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-neutral-300"
                />
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  {event.password ? '🔒 This event is password protected' : '🌐 This event is public'}
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <input type="hidden" name="uploadsEnabled" value="false" />
                  <input
                    id="uploadsEnabled"
                    name="uploadsEnabled"
                    type="checkbox"
                    defaultChecked={event.uploadsEnabled}
                    value="true"
                    className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-300"
                  />
                  <label htmlFor="uploadsEnabled" className="text-sm font-medium text-neutral-700">
                    Allow guests to upload photos
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input type="hidden" name="rsvpEnabled" value="false" />
                  <input
                    id="rsvpEnabled"
                    name="rsvpEnabled"
                    type="checkbox"
                    defaultChecked={event.rsvpEnabled}
                    value="true"
                    className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-300"
                  />
                  <label htmlFor="rsvpEnabled" className="text-sm font-medium text-neutral-700">
                    Enable guest RSVPs
                  </label>
                </div>
              </div>
              <button
                type="submit"
                className="bg-neutral-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-neutral-700 transition"
              >
                Save changes
              </button>
            </form>
          </div>

          {/* Photos and Videos */}
          <div className="bg-white border border-neutral-100 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-neutral-800">Media ({eventMedia.length})</h2>
              {eventMedia.length > 0 && (
                <a
                  href={`/api/events/${event.id}/download`}
                  className="font-sans text-xs px-3 py-1.5 rounded-full transition"
                  style={{ border: '1px solid rgba(28,28,28,0.15)', color: 'var(--muted)' }}
                >
                  Download all ↓
                </a>
              )}
            </div>
            <AdminMediaGrid eventId={event.id} initialMedia={eventMedia} />
          </div>
          </div>

        {/* Right — QR code */}
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-neutral-100 rounded-xl p-5">
            <h2 className="font-semibold text-neutral-800 mb-1">Guest link</h2>
            <p className="text-xs text-neutral-400 mb-4 break-all">{guestUrl}</p>
            <div className="flex justify-center">
              <QRCode url={guestUrl} />
            </div>
            <a
              href={guestUrl}
              target="_blank"
              className="block text-center text-sm text-neutral-600 hover:underline mt-3"
            >
              Open guest page →
            </a>
            {eventMedia.length > 0 && (
              <a
                href={`/e/${event.slug}/book`}
                className="flex items-center gap-2 px-5 py-3 rounded-full text-sm font-sans font-medium transition mt-3"
                style={{ border: '1px solid rgba(28,28,28,0.15)', color: 'var(--muted)' }}
              >
                📖 Photobook
              </a>
            )}
          </div>

          {/* RSVP summary */}
          {event.rsvpEnabled && (
            <div className="bg-white border border-neutral-100 rounded-xl p-5">
              <h2 className="font-semibold text-neutral-800 mb-1">RSVPs</h2>
              <p className="text-xs text-neutral-400 mb-3 break-all">{guestUrl}/rsvp</p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center">
                  <p className="text-lg font-semibold text-neutral-800">{confirmedRsvps.length}</p>
                  <p className="text-xs text-neutral-400">Confirmed</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-neutral-800">{totalGuests}</p>
                  <p className="text-xs text-neutral-400">Guests</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-neutral-800">{allRsvps.length - confirmedRsvps.length}</p>
                  <p className="text-xs text-neutral-400">Declined</p>
                </div>
              </div>
              <Link
                href={`/admin/events/${event.id}/rsvps`}
                className="block text-center text-sm text-neutral-600 hover:underline"
              >
                View all RSVPs →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}