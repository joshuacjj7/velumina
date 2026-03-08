import { NextRequest, NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import path from 'path'

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads')

const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  gif: 'image/gif',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params
  const safeName = path.basename(filename)
  const filePath = path.join(UPLOAD_DIR, safeName)
  const ext = safeName.split('.').pop()?.toLowerCase() ?? ''
  const contentType = MIME_TYPES[ext] ?? 'application/octet-stream'

  // Handle range requests for video streaming
  const range = req.headers.get('range')

  try {
    if (range && contentType.startsWith('video/')) {
      const fileStat = await stat(filePath)
      const fileSize = fileStat.size
      const parts = range.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + 1024 * 1024, fileSize - 1)
      const chunkSize = end - start + 1

      const { createReadStream } = await import('fs')
      const stream = createReadStream(filePath, { start, end })
      const webStream = new ReadableStream({
        start(controller) {
          stream.on('data', chunk => controller.enqueue(chunk))
          stream.on('end', () => controller.close())
          stream.on('error', err => controller.error(err))
        },
      })

      return new NextResponse(webStream, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize.toString(),
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000',
        },
      })
    }

    const file = await readFile(filePath)
    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}