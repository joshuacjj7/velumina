import { db } from '@/db'
import { events, media, users } from '@/db/schema'
import { desc, count, sum } from 'drizzle-orm'
import Link from 'next/link'
import { statfs } from 'fs/promises'
import path from 'path'

async function getDiskInfo() {
  try {
    const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads')
    const stats = await statfs(UPLOAD_DIR)
    const total = stats.blocks * stats.bsize
    const free = stats.bfree * stats.bsize
    const used = total - free
    return { total, used, free }
  } catch {
    return null
  }
}

export default async function AdminDashboard() {
  const [eventCount] = await db.select({ count: count() }).from(events)
  const [mediaCount] = await db.select({ count: count() }).from(media)
  const [storageResult] = await db.select({ total: sum(media.size) }).from(media)
  const [adminCount] = await db.select({ count: count() }).from(users)

  const recentEvents = await db
    .select()
    .from(events)
    .orderBy(desc(events.createdAt))
    .limit(5)

  const recentEventIds = recentEvents.map(e => e.id)

  // Photo counts per event
  const photoCounts = recentEventIds.length > 0
    ? await db
        .select({ eventId: media.eventId, count: count() })
        .from(media)
        .groupBy(media.eventId)
    : []

  const photoCountMap = Object.fromEntries(photoCounts.map(p => [p.eventId, p.count]))

  const recentUploads = await db
    .select()
    .from(media)
    .orderBy(desc(media.createdAt))
    .limit(8)

  const storageBytes = Number(storageResult.total ?? 0)
  function formatStorage(bytes: number) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    if (bytes < 1024 * 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
    return `${(bytes / (1024 * 1024 * 1024 * 1024)).toFixed(2)} TB`
  }
const disk = await getDiskInfo()
  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl font-light" style={{ color: 'var(--charcoal)' }}>
          Dashboard
        </h1>
      </div>

      {/* Stats */}
     <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
      <div className="bg-white border border-neutral-100 rounded-xl p-4">
        <p className="font-sans text-2xl font-medium" style={{ color: 'var(--charcoal)' }}>{eventCount.count}</p>
        <p className="font-sans text-xs mt-1" style={{ color: 'var(--muted)' }}>Events</p>
      </div>
      <div className="bg-white border border-neutral-100 rounded-xl p-4">
        <p className="font-sans text-2xl font-medium" style={{ color: 'var(--charcoal)' }}>{mediaCount.count}</p>
        <p className="font-sans text-xs mt-1" style={{ color: 'var(--muted)' }}>Media items</p>
      </div>

      {/* Storage card */}
      <div className="bg-white border border-neutral-100 rounded-xl p-4">
        <p className="font-sans text-2xl font-medium" style={{ color: 'var(--charcoal)' }}>
          {formatStorage(storageBytes)}
        </p>
        <p className="font-sans text-xs mt-1" style={{ color: 'var(--muted)' }}>
          Storage used
        </p>
        {disk && (
          <>
            <div className="mt-3 rounded-full overflow-hidden h-1.5" style={{ backgroundColor: 'rgba(28,28,28,0.08)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min((disk.used / disk.total) * 100, 100).toFixed(1)}%`,
                  backgroundColor: disk.used / disk.total > 0.85 ? '#C0392B' : 'var(--rose)',
                }}
              />
            </div>
            <p className="font-sans text-xs mt-1.5" style={{ color: 'var(--muted)' }}>
              {formatStorage(disk.used)} / {formatStorage(disk.total)}
            </p>
          </>
        )}
      </div>

  <div className="bg-white border border-neutral-100 rounded-xl p-4">
    <p className="font-sans text-2xl font-medium" style={{ color: 'var(--charcoal)' }}>{adminCount.count}</p>
    <p className="font-sans text-xs mt-1" style={{ color: 'var(--muted)' }}>Admins</p>
  </div>
</div>

      {/* Quick actions */}
      <div className="bg-white border border-neutral-100 rounded-xl p-5 mb-6">
        <h2 className="font-semibold text-neutral-700 text-sm mb-3">Quick actions</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/events/new"
            className="font-sans text-sm px-4 py-2 rounded-full transition"
            style={{ backgroundColor: 'var(--charcoal)', color: 'var(--ivory)' }}
          >
            + New event
          </Link>
          <Link
            href="/admin/team"
            className="font-sans text-sm px-4 py-2 rounded-full transition hover:border-neutral-400"
            style={{ border: '1px solid rgba(28,28,28,0.15)', color: 'var(--muted)' }}
          >
            Invite admin
          </Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Recent events */}
        <div className="bg-white border border-neutral-100 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-neutral-700 text-sm">Recent events</h2>
            <Link
              href="/admin/events"
              className="font-sans text-xs hover:underline"
              style={{ color: 'var(--muted)' }}
            >
              View all →
            </Link>
          </div>
          {recentEvents.length === 0 ? (
            <p className="text-sm text-neutral-400">No events yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {recentEvents.map(event => (
                <Link
                  key={event.id}
                  href={`/admin/events/${event.id}`}
                  className="flex items-center justify-between group"
                >
                  <div className="min-w-0">
                    <p className="font-sans text-sm truncate group-hover:underline" style={{ color: 'var(--charcoal)' }}>
                      {event.name}
                    </p>
                    <p className="font-sans text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                      {event.date ? new Date(event.date).toLocaleDateString() : 'No date'}
                      {event.password ? ' · 🔒' : ''}
                    </p>
                  </div>
                  <span
                    className="font-sans text-xs ml-3 shrink-0 px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'rgba(28,28,28,0.05)', color: 'var(--muted)' }}
                  >
                    {photoCountMap[event.id] ?? 0} items
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent uploads */}
        <div className="bg-white border border-neutral-100 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-neutral-700 text-sm">Recent uploads</h2>
          </div>
          {recentUploads.length === 0 ? (
            <p className="text-sm text-neutral-400">No uploads yet.</p>
          ) : (
            <div className="grid grid-cols-4 gap-1.5">
              {recentUploads.map(item => (
                <div
                  key={item.id}
                  className="aspect-square rounded-lg overflow-hidden bg-neutral-100 relative"
                >
                  {item.mediaType === 'video' ? (
                    <>
                      {item.thumbnailFilename ? (
                        <img
                          src={`/api/photo/${item.thumbnailFilename}`}
                          alt={item.originalName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-lg">🎬</span>
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                          <span className="text-white text-xs ml-0.5" style={{ fontSize: 8 }}>▶</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <img
                      src={`/api/photo/${item.filename}`}
                      alt={item.originalName}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}