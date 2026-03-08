import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { photos, events } from '@/db/schema'
import { eq } from 'drizzle-orm'
import archiver from 'archiver'
import { createReadStream, existsSync } from 'fs'
import path from 'path'
import { Readable } from 'stream'

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads')

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Auth check
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params

  const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1)
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  const eventPhotos = await db.select().from(photos).where(eq(photos.eventId, id))
  if (eventPhotos.length === 0) {
    return NextResponse.json({ error: 'No photos to download' }, { status: 404 })
  }

  // Create zip archive
  const archive = archiver('zip', { zlib: { level: 6 } })

  // Group photos by uploader
  for (const photo of eventPhotos) {
    const filePath = path.join(UPLOAD_DIR, photo.filename)
    if (!existsSync(filePath)) continue

    const folder = photo.uploadedBy
      ? photo.uploadedBy.replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || 'Unknown'
      : 'Unknown'

    const ext = photo.filename.split('.').pop()
    const baseName = photo.caption
      ? photo.caption.replace(/[^a-zA-Z0-9_\- ]/g, '').trim().slice(0, 40)
      : photo.originalName.replace(/\.[^/.]+$/, '')
    const filename = `${baseName}.${ext}`

    archive.append(createReadStream(filePath), {
      name: `${folder}/${filename}`,
    })
  }

  archive.finalize()

  // Stream the zip to the response
  const nodeStream = Readable.from(archive)
  const webStream = new ReadableStream({
    start(controller) {
      nodeStream.on('data', chunk => controller.enqueue(chunk))
      nodeStream.on('end', () => controller.close())
      nodeStream.on('error', err => controller.error(err))
    },
  })

  const zipName = `${event.name.replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || 'event'}-photos.zip`

  return new NextResponse(webStream, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${zipName}"`,
    },
  })
}