import { db } from '@/db'
import { events, rsvps } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function RsvpListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1)
  if (!event) notFound()

  const allRsvps = await db.select().from(rsvps)
    .where(eq(rsvps.eventId, id))
    .orderBy(desc(rsvps.createdAt))

  const confirmed = allRsvps.filter(r => r.attending)
  const declined = allRsvps.filter(r => !r.attending)
  const totalGuests = confirmed.reduce((sum, r) => sum + r.guestCount, 0)

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/events" className="text-sm text-neutral-400 hover:underline">Events</Link>
        <span className="text-neutral-300">/</span>
        <Link href={`/admin/events/${id}`} className="text-sm text-neutral-400 hover:underline">{event.name}</Link>
        <span className="text-neutral-300">/</span>
        <span className="text-sm text-neutral-600">RSVPs</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-neutral-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-semibold text-neutral-800">{confirmed.length}</p>
          <p className="text-xs text-neutral-400 mt-1">Confirmed</p>
        </div>
        <div className="bg-white border border-neutral-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-semibold text-neutral-800">{totalGuests}</p>
          <p className="text-xs text-neutral-400 mt-1">Total guests</p>
        </div>
        <div className="bg-white border border-neutral-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-semibold text-neutral-800">{declined.length}</p>
          <p className="text-xs text-neutral-400 mt-1">Declined</p>
        </div>
      </div>

      {/* RSVP table */}
      <div className="bg-white border border-neutral-100 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-neutral-800">All RSVPs ({allRsvps.length})</h2>
          {allRsvps.length > 0 && (
            <a
              href={`/api/events/${id}/rsvps/export`}
              className="font-sans text-xs px-3 py-1.5 rounded-full transition"
              style={{ border: '1px solid rgba(28,28,28,0.15)', color: 'var(--muted)' }}
            >
              Export CSV
            </a>
          )}
        </div>

        {allRsvps.length === 0 ? (
          <p className="text-sm text-neutral-400 py-4 text-center">No RSVPs yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className="text-left py-2 pr-4 font-medium text-neutral-500">Name</th>
                  <th className="text-left py-2 pr-4 font-medium text-neutral-500">Email</th>
                  <th className="text-left py-2 pr-4 font-medium text-neutral-500">Status</th>
                  <th className="text-left py-2 pr-4 font-medium text-neutral-500">Guests</th>
                  <th className="text-left py-2 pr-4 font-medium text-neutral-500">Guest names</th>
                  <th className="text-left py-2 pr-4 font-medium text-neutral-500">Dietary</th>
                  <th className="text-left py-2 font-medium text-neutral-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {allRsvps.map(rsvp => (
                  <tr key={rsvp.id} className="border-b border-neutral-50">
                    <td className="py-2.5 pr-4 text-neutral-800">{rsvp.name}</td>
                    <td className="py-2.5 pr-4 text-neutral-500">{rsvp.email}</td>
                    <td className="py-2.5 pr-4">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: rsvp.attending ? '#dcfce7' : '#fee2e2',
                          color: rsvp.attending ? '#166534' : '#991b1b',
                        }}
                      >
                        {rsvp.attending ? 'Attending' : 'Declined'}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-neutral-600">{rsvp.attending ? rsvp.guestCount : '—'}</td>
                    <td className="py-2.5 pr-4 text-neutral-500 max-w-[200px] truncate">
                      {rsvp.guestNames ? (() => { try { return (JSON.parse(rsvp.guestNames) as string[]).join(', ') } catch { return '—' } })() : '—'}
                    </td>
                    <td className="py-2.5 pr-4 text-neutral-500 max-w-[200px] truncate">{rsvp.dietaryNotes || '—'}</td>
                    <td className="py-2.5 text-neutral-400 text-xs">
                      {new Date(rsvp.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
