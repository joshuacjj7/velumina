'use server'

import { db } from '@/db'
import { users, invites } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function inviteAdmin(formData: FormData) {
  const email = formData.get('email') as string
  if (!email) return

  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours

  await db.insert(invites).values({ email, token, expiresAt })

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`

  await resend.emails.send({
    from: 'Velumina <' + (process.env.RESEND_FROM_EMAIL) + '>',
    to: email,
    subject: "You've been invited to Velumina",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h1 style="font-size: 24px; font-weight: 600; color: #1C1C1C; margin-bottom: 8px;">
          You're invited to Velumina
        </h1>
        <p style="color: #8C8279; font-size: 15px; margin-bottom: 24px;">
          You've been invited to join as an admin. Click the link below to set up your account.
          This link expires in 48 hours.
        </p>
        <a href="${inviteUrl}"
          style="display: inline-block; background: #1C1C1C; color: white;
                 padding: 12px 24px; border-radius: 8px; text-decoration: none;
                 font-size: 14px; font-weight: 500;">
          Accept invite
        </a>
        <p style="color: #8C8279; font-size: 12px; margin-top: 24px;">
          Or copy this link: ${inviteUrl}
        </p>
      </div>
    `,
  })

  revalidatePath('/admin/team')
}
export async function resendInvite(formData: FormData) {
  const id = formData.get('id') as string
  if (!id) return

  const [invite] = await db.select().from(invites).where(eq(invites.id, id)).limit(1)
  if (!invite || invite.usedAt) return

  // Refresh the token and expiry
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000)

  await db.update(invites).set({ token, expiresAt }).where(eq(invites.id, id))

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`

  await resend.emails.send({
    from: 'Velumina <' + (process.env.RESEND_FROM_EMAIL) + '>',
    to: invite.email,
    subject: "You've been invited to Velumina",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h1 style="font-size: 24px; font-weight: 600; color: #1C1C1C; margin-bottom: 8px;">
          You're invited to Velumina
        </h1>
        <p style="color: #8C8279; font-size: 15px; margin-bottom: 24px;">
          You've been invited to join as an admin. Click the link below to set up your account.
          This link expires in 48 hours.
        </p>
        <a href="${inviteUrl}"
          style="display: inline-block; background: #1C1C1C; color: white;
                 padding: 12px 24px; border-radius: 8px; text-decoration: none;
                 font-size: 14px; font-weight: 500;">
          Accept invite
        </a>
        <p style="color: #8C8279; font-size: 12px; margin-top: 24px;">
          Or copy this link: ${inviteUrl}
        </p>
      </div>
    `,
  })

  revalidatePath('/admin/team')
}
export async function removeAdmin(formData: FormData) {
  const id = formData.get('id') as string
  if (!id) return
  await db.delete(users).where(eq(users.id, id))
  revalidatePath('/admin/team')
}