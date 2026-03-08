import { db } from '@/db'
import { events, media as mediaTable } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import PhotoBook from '../photo-book'

export default async function PhotoBookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const [event] = await db.select().from(events).where(eq(events.slug, slug)).limit(1)
  if (!event) notFound()

  const media = await db
    .select()
    .from(mediaTable)
    .where(eq(mediaTable.eventId, event.id))
    .orderBy(asc(mediaTable.createdAt))

  return (
    <PhotoBook
      media={media}
      eventName={event.name}
      backUrl={`/e/${slug}`}
    />
  )
}