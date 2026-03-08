'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  event: {
    id: string
    name: string
    date: Date | null
  }
}

export default function EventUnlock({ event }: Props) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch(`/api/events/${event.id}/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.refresh()
    } else {
      setError('Incorrect password. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--ivory)' }}>
      <div className="w-full max-w-sm text-center">
        {/* Decorative rings */}
        <div className="relative flex items-center justify-center mb-8">
          <div className="w-24 h-24 rounded-full border" style={{ borderColor: 'rgba(196,144,122,0.2)' }} />
          <div className="absolute w-16 h-16 rounded-full border" style={{ borderColor: 'rgba(196,144,122,0.3)' }} />
          <span className="absolute font-display text-2xl" style={{ color: 'var(--rose)' }}>✦</span>
        </div>

        <p className="font-sans text-xs tracking-[0.3em] uppercase mb-2" style={{ color: 'var(--rose)' }}>
          Private event
        </p>
        <h1 className="font-display text-3xl font-light mb-2" style={{ color: 'var(--charcoal)' }}>
          {event.name}
        </h1>
        {event.date && (
          <p className="font-sans text-sm mb-8" style={{ color: 'var(--muted)' }}>
            {new Date(event.date).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            placeholder="Enter event password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoFocus
            className="w-full px-4 py-3 rounded-xl text-sm font-sans text-gray-600 placeholder:text-gray-400 focus:outline-none text-center tracking-widest"
            style={{
              backgroundColor: 'white',
              border: '1px solid rgba(28,28,28,0.12)',
              boxShadow: '0 1px 4px rgba(28,28,28,0.04)',
            }}
          />
          {error && (
            <p className="font-sans text-xs" style={{ color: '#C0392B' }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 rounded-xl text-sm font-sans font-medium transition"
            style={{
              backgroundColor: loading || !password ? 'rgba(28,28,28,0.2)' : 'var(--charcoal)',
              color: 'var(--ivory)',
            }}
          >
            {loading ? 'Checking…' : 'View gallery'}
          </button>
        </form>

        <p className="font-sans text-xs mt-6" style={{ color: 'var(--muted)' }}>
          You'll need the password from the event organiser.
        </p>
      </div>
    </main>
  )
}