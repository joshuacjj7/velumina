import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { rsvps } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const rows = await db.select().from(rsvps).where(eq(rsvps.eventId, id))

  const header = 'Name,Email,Attending,Guest Count,Guest Names,Dietary Notes,Submitted'
  const csvRows = rows.map(r => {
    let guestNamesStr = ''
    if (r.guestNames) {
      try { guestNamesStr = (JSON.parse(r.guestNames) as string[]).join('; ') } catch {}
    }
    return [
      `"${r.name.replace(/"/g, '""')}"`,
      r.email,
      r.attending ? 'Yes' : 'No',
      r.guestCount,
      `"${guestNamesStr.replace(/"/g, '""')}"`,
      `"${(r.dietaryNotes || '').replace(/"/g, '""')}"`,
      new Date(r.createdAt).toISOString(),
    ].join(',')
  })

  const csv = [header, ...csvRows].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="rsvps-${id}.csv"`,
    },
  })
}
