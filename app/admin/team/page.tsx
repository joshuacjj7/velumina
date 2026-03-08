import { db } from '@/db'
import { users, invites } from '@/db/schema'
import { desc } from 'drizzle-orm'
import { inviteAdmin, removeAdmin,resendInvite } from './actions'
import { isNull } from 'drizzle-orm'

export default async function TeamPage() {
  const allAdmins = await db.select().from(users).orderBy(desc(users.createdAt))
  const pendingInvites = await db
    .select()
    .from(invites)
    .where(isNull(invites.usedAt))
    .orderBy(desc(invites.createdAt))

  return (
    <div className="max-w-2xl">
      <h1 className="font-semibold text-neutral-800 text-xl mb-6">Team</h1>

      {/* Invite form */}
      <div className="bg-white border border-neutral-100 rounded-xl p-5 mb-6">
        <h2 className="font-semibold text-neutral-700 mb-4">Invite admin</h2>
        <form action={inviteAdmin} className="flex gap-2">
          <input
            name="email"
            type="email"
            required
            placeholder="colleague@example.com"
            className="flex-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
          />
          <button
            type="submit"
            className="bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-700 transition"
          >
            Send invite
          </button>
        </form>
      </div>

      {/* Current admins */}
      <div className="bg-white border border-neutral-100 rounded-xl p-5 mb-4">
        <h2 className="font-semibold text-neutral-700 mb-4">Admins</h2>
        <div className="flex flex-col gap-3">
          {allAdmins.map(admin => (
            <div key={admin.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-800">{admin.name}</p>
                <p className="text-xs text-neutral-400">{admin.email}</p>
              </div>
              <form action={removeAdmin}>
                <input type="hidden" name="id" value={admin.id} />
                <button
                  type="submit"
                  className="text-xs text-red-400 hover:text-red-600 transition"
                >
                  Remove
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>

      {/* Pending invites */}
      {pendingInvites.map(invite => (
        <div key={invite.id} className="flex items-center justify-between">
            <div>
            <p className="text-sm text-neutral-700">{invite.email}</p>
            <p className="text-xs text-neutral-400">
                Expires {new Date(invite.expiresAt).toLocaleDateString()}
            </p>
            </div>
            <div className="flex items-center gap-2">
            <form action={resendInvite}>
                <input type="hidden" name="id" value={invite.id} />
                <button
                type="submit"
                className="text-xs px-3 py-1 rounded-full transition hover:bg-amber-100"
                style={{ border: '1px solid rgba(180,120,0,0.2)', color: '#92650a' }}
                >
                Resend
                </button>
            </form>
            <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
                Pending
            </span>
            </div>
        </div>
        ))}
    </div>
  )
}