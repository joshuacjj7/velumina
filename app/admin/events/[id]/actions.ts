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

  await db.update(events).set({
    name,
    slug,
    description: description || null,
    date: date ? new Date(date) : null,
    password: password || null,
    updatedAt: new Date(),
  }).where(eq(events.id, id))

  redirect(`/admin/events/${id}`)
}

export async function deletePhoto(formData: FormData) {
  const id = formData.get('id') as string
  const eventId = formData.get('eventId') as string

  const [mediaItem] = await db.select().from(media).where(eq(media.id, id)).limit(1)

  if (mediaItem) {
    await db.delete(media).where(eq(media.id, id))
    try {
      await unlink(path.join(process.cwd(), 'public', 'uploads', mediaItem.filename))
    } catch {}
  }

  redirect(`/admin/events/${eventId}`)
}