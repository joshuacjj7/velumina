import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { media } from '@/db/schema'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { exec } from 'child_process'
import { promisify } from 'util'
import sharp from 'sharp'

const execAsync = promisify(exec)
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads')

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif']
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/mov']
const MAX_IMAGE_SIZE = 20 * 1024 * 1024
const MAX_VIDEO_SIZE = 500 * 1024 * 1024

export const maxDuration = 60

async function generateVideoThumbnail(videoFilename: string): Promise<string | null> {
  try {
    const thumbnailFilename = `thumb_${uuidv4()}.jpg`
    const videoPath = path.join(UPLOAD_DIR, videoFilename)
    const thumbPath = path.join(UPLOAD_DIR, thumbnailFilename)

    await execAsync(
      `ffmpeg -i "${videoPath}" -ss 00:00:01 -vframes 1 -vf "scale=800:-1" -q:v 2 "${thumbPath}"`
    )

    return thumbnailFilename
  } catch (err) {
    console.error('Thumbnail generation failed:', err)
    return null
  }
}
async function generateBlurDataUrl(buffer: Buffer): Promise<string | null> {
  try {
    const tiny = await sharp(buffer)
      .resize(20, 20, { fit: 'inside' })
      .jpeg({ quality: 60 })
      .toBuffer()
    return `data:image/jpeg;base64,${tiny.toString('base64')}`
  } catch {
    return null
  }
}
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const eventId = formData.get('eventId') as string
    const caption = formData.get('caption') as string
    const uploadedBy = formData.get('uploadedBy') as string

    if (!file || !eventId) {
      return NextResponse.json({ error: 'Missing file or eventId' }, { status: 400 })
    }

    const isImage = IMAGE_TYPES.includes(file.type)
    const isVideo = VIDEO_TYPES.includes(file.type)

    if (!isImage && !isVideo) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
    if (file.size > maxSize) {
      return NextResponse.json({
        error: `File too large. Max size is ${isVideo ? '500MB' : '20MB'}.`
      }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const ext = file.name.split('.').pop()
    const filename = `${uuidv4()}.${ext}`

    await mkdir(UPLOAD_DIR, { recursive: true })
    await writeFile(path.join(UPLOAD_DIR, filename), buffer)

    // Generate thumbnail for videos
    let thumbnailFilename: string | null = null
    if (isVideo) {
      thumbnailFilename = await generateVideoThumbnail(filename)
    }
let blurDataUrl: string | null = null
if (isImage) {
  blurDataUrl = await generateBlurDataUrl(buffer)
}
    const [mediaItem] = await db.insert(media).values({
      eventId,
      filename,
      thumbnailFilename,
      originalName: file.name,
      mimeType: file.type,
      blurDataUrl,
      size: file.size,
      caption: caption || null,
      uploadedBy: uploadedBy || null,
      mediaType: isVideo ? 'video' : 'photo',
    }).returning()

    return NextResponse.json({ mediaItem })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}