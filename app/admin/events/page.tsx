import { db } from '@/db'
import { events } from '@/db/schema'
import { desc } from 'drizzle-orm'
import Link from 'next/link'
import { createEvent, deleteEvent } from './actions'

export default async function EventsPage() {
  const allEvents = await db.select().from(events).orderBy(desc(events.createdAt))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl text-gray-600 font-semibold">Events</h1>
        <Link
          href="/admin/events/new"
          className="bg-neutral-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-neutral-700 transition"
        >
          New event
        </Link>
      </div>

      {allEvents.length === 0 ? (
        <p className="text-neutral-400 text-sm">No events yet. Create your first one.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {allEvents.map(event => (
            <div key={event.id} className="bg-white border border-neutral-100 rounded-xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-neutral-800">{event.name}</p>
                <p className="text-sm text-neutral-400 mt-0.5">
                  /{event.slug} · {event.date ? new Date(event.date).toLocaleDateString() : 'No date set'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/admin/events/${event.id}`}
                  className="text-sm text-neutral-600 hover:underline"
                >
                  Manage
                </Link>
                <form action={deleteEvent}>
                  <input type="hidden" name="id" value={event.id} />
                  <button type="submit" className="text-sm text-red-500 hover:underline">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}