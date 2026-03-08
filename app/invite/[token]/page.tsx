import { db } from '@/db'
import { invites } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import AcceptInviteForm from './accept-form'

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const [invite] = await db
    .select()
    .from(invites)
    .where(eq(invites.token, token))
    .limit(1)

  if (!invite || invite.usedAt || new Date() > invite.expiresAt) {
    notFound()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--ivory)' }}>
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl font-light italic mb-2"
          style={{ color: 'var(--charcoal)' }}>
          Welcome to Velumina
        </h1>
        <p className="font-sans text-sm mb-8" style={{ color: 'var(--muted)' }}>
          Set up your admin account for {invite.email}
        </p>
        <AcceptInviteForm token={token} email={invite.email} />
      </div>
    </div>
  )
}