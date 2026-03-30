import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { media as mediaTable } from '@/db/schema'
import { eq, lt, and, desc } from 'drizzle-orm'

const PAGE_SIZE = 24

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get('cursor')

  const conditions = cursor
    ? and(eq(mediaTable.eventId, id), lt(mediaTable.createdAt, new Date(cursor)))
    : eq(mediaTable.eventId, id)

  const items = await db
    .select({
      id: mediaTable.id,
      filename: mediaTable.filename,
      webFilename: mediaTable.webFilename,
      thumbnailFilename: mediaTable.thumbnailFilename,
      originalName: mediaTable.originalName,
      blurDataUrl: mediaTable.blurDataUrl,
      caption: mediaTable.caption,
      uploadedBy: mediaTable.uploadedBy,
      mediaType: mediaTable.mediaType,
      width: mediaTable.width,
      height: mediaTable.height,
      createdAt: mediaTable.createdAt,
    })
    .from(mediaTable)
    .where(conditions)
    .orderBy(desc(mediaTable.createdAt))
    .limit(PAGE_SIZE + 1)

  const hasMore = items.length > PAGE_SIZE
  const media = hasMore ? items.slice(0, PAGE_SIZE) : items

  return NextResponse.json({
    media,
    hasMore,
    nextCursor: hasMore ? media[media.length - 1].createdAt.toISOString() : null,
  })
}