'use server'

import { db } from '@/db'
import { events, media } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { unlink } from 'fs/promises'
import path from 'path'

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads')

export async function createEvent(formData: FormData) {
  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const description = formData.get('description') as string
  const date = formData.get('date') as string

  await db.insert(events).values({
    name,
    slug,
    description: description || null,
    date: date ? new Date(date) : null,
  })

  redirect('/admin/events')
}

export async function deleteEvent(formData: FormData) {
  const id = formData.get('id') as string

  // Delete all upload files before cascade removes DB records
  const mediaItems = await db.select().from(media).where(eq(media.eventId, id))
  const filesToDelete = mediaItems.flatMap(m =>
    [m.filename, m.thumbnailFilename, m.webFilename].filter(Boolean) as string[]
  )
  await Promise.allSettled(
    filesToDelete.map(f => unlink(path.join(UPLOAD_DIR, path.basename(f))))
  )

  await db.delete(events).where(eq(events.id, id))
  redirect('/admin/events')
}