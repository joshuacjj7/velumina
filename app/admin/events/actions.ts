'use server'

import { db } from '@/db'
import { events } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'

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
  await db.delete(events).where(eq(events.id, id))
  redirect('/admin/events')
}