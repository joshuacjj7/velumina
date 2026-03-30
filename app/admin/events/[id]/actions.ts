'use server'

import { db } from '@/db'
import { events, media } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { unlink } from 'fs/promises'
import path from 'path'

export async function updateEvent(formData: FormData) {
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const description = formData.get('description') as string
  const date = formData.get('date') as string
  const password = formData.get('password') as string
  const uploadsEnabled = formData.getAll('uploadsEnabled').includes('true')
  const rsvpEnabled = formData.getAll('rsvpEnabled').includes('true')

  await db.update(events).set({
    name,
    slug,
    description: description || null,
    date: date ? new Date(date) : null,
    password: password || null,
    uploadsEnabled,
    rsvpEnabled,
    updatedAt: new Date(),
  }).where(eq(events.id, id))

  redirect(`/admin/events/${id}`)
}

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads')

export async function deletePhoto(formData: FormData) {
  const id = formData.get('id') as string
  const eventId = formData.get('eventId') as string

  const [mediaItem] = await db.select().from(media).where(eq(media.id, id)).limit(1)

  if (mediaItem) {
    const filesToDelete = [mediaItem.filename, mediaItem.thumbnailFilename, mediaItem.webFilename].filter(Boolean) as string[]
    await Promise.allSettled(
      filesToDelete.map(f => unlink(path.join(UPLOAD_DIR, path.basename(f))))
    )
    await db.delete(media).where(eq(media.id, id))
  }

  redirect(`/admin/events/${eventId}`)
}