import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { media as mediaTable } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { unlink } from 'fs/promises'
import path from 'path'

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads')

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, eventId } = await req.json()
  if (!id || !eventId) return NextResponse.json({ error: 'Missing id or eventId' }, { status: 400 })

  const [item] = await db.select().from(mediaTable).where(eq(mediaTable.id, id)).limit(1)
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const filesToDelete = [item.filename, item.thumbnailFilename].filter(Boolean) as string[]
  await Promise.allSettled(
    filesToDelete.map(f => unlink(path.join(UPLOAD_DIR, path.basename(f))))
  )

  await db.delete(mediaTable).where(eq(mediaTable.id, id))

  return NextResponse.json({ success: true })
}