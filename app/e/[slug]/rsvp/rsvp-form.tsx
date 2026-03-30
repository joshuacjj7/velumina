'use client'

import { useState } from 'react'

type ExistingRsvp = {
  name: string
  email: string
  attending: boolean
  guestCount: number
  guestNames: string[] | null
  dietaryNotes: string | null
  token: string
}

export default function RsvpForm({
  eventId,
  existing,
}: {
  eventId: string
  existing: ExistingRsvp | null
}) {
  const [name, setName] = useState(existing?.name ?? '')
  const [email, setEmail] = useState(existing?.email ?? '')
  const [attending, setAttending] = useState<boolean | null>(existing?.attending ?? null)
  const [guestNames, setGuestNames] = useState<string[]>(existing?.guestNames ?? [])
  const [dietaryNotes, setDietaryNotes] = useState(existing?.dietaryNotes ?? '')
  const guestCount = 1 + guestNames.length
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !email || attending === null) return

    setSubmitting(true)
    setError('')

    try {
      const method = existing ? 'PUT' : 'POST'
      const filteredGuestNames = guestNames.filter(n => n.trim())
      const body: any = { name, email, attending, guestCount, guestNames: filteredGuestNames, dietaryNotes }
      if (existing) body.token = existing.token

      const res = await fetch(`/api/events/${eventId}/rsvps`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const text = await res.text()
        let message = 'Something went wrong'
        try { message = JSON.parse(text).error || message } catch {}
        throw new Error(message)
      }

      setDone(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">{attending ? '🎉' : '💌'}</div>
        <h2 className="font-display text-2xl font-light mb-2" style={{ color: 'var(--charcoal)' }}>
          {attending ? 'See you there!' : 'Thanks for letting us know'}
        </h2>
        <p className="font-sans text-sm" style={{ color: 'var(--muted)' }}>
          {attending
            ? 'Your RSVP has been confirmed. A confirmation email is on its way.'
            : "We're sorry you can't make it. We'll miss you!"}
        </p>
      </div>
    )
  }

  const inputClass =
    'w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 transition'

  return (
    <form onSubmit={handleSubmit} className="text-left flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="font-sans text-sm font-medium" style={{ color: 'var(--charcoal)' }}>
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          placeholder="Your full name"
          className={inputClass}
          style={{ borderColor: 'rgba(28,28,28,0.15)', color: 'var(--charcoal)' }}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-sans text-sm font-medium" style={{ color: 'var(--charcoal)' }}>
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          placeholder="you@example.com"
          className={inputClass}
          style={{ borderColor: 'rgba(28,28,28,0.15)', color: 'var(--charcoal)' }}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-sans text-sm font-medium" style={{ color: 'var(--charcoal)' }}>
          Will you attend?
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setAttending(true)}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium transition"
            style={{
              backgroundColor: attending === true ? 'var(--charcoal)' : 'transparent',
              color: attending === true ? 'var(--ivory)' : 'var(--charcoal)',
              border: `1px solid ${attending === true ? 'var(--charcoal)' : 'rgba(28,28,28,0.15)'}`,
            }}
          >
            Yes, I'll be there
          </button>
          <button
            type="button"
            onClick={() => setAttending(false)}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium transition"
            style={{
              backgroundColor: attending === false ? 'var(--charcoal)' : 'transparent',
              color: attending === false ? 'var(--ivory)' : 'var(--charcoal)',
              border: `1px solid ${attending === false ? 'var(--charcoal)' : 'rgba(28,28,28,0.15)'}`,
            }}
          >
            Can't make it
          </button>
        </div>
      </div>

      {attending && (
        <>
          <div className="flex flex-col gap-1">
            <label className="font-sans text-sm font-medium" style={{ color: 'var(--charcoal)' }}>
              Additional guests
              <span className="font-normal ml-1" style={{ color: 'var(--muted)' }}>(optional)</span>
            </label>
            {guestNames.map((gn, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={gn}
                  onChange={e => {
                    const updated = [...guestNames]
                    updated[i] = e.target.value
                    setGuestNames(updated)
                  }}
                  placeholder={`Guest ${i + 1} name`}
                  className={inputClass}
                  style={{ borderColor: 'rgba(28,28,28,0.15)', color: 'var(--charcoal)' }}
                />
                <button
                  type="button"
                  onClick={() => setGuestNames(guestNames.filter((_, j) => j !== i))}
                  className="px-3 text-sm rounded-lg transition"
                  style={{ border: '1px solid rgba(28,28,28,0.15)', color: 'var(--muted)' }}
                >
                  &times;
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setGuestNames([...guestNames, ''])}
              className="text-sm py-2 rounded-lg transition"
              style={{ border: '1px solid rgba(28,28,28,0.15)', color: 'var(--muted)' }}
            >
              + Add a guest
            </button>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Total attending: {guestCount} (including you)
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-sans text-sm font-medium" style={{ color: 'var(--charcoal)' }}>
              Dietary requirements
              <span className="font-normal ml-1" style={{ color: 'var(--muted)' }}>(optional)</span>
            </label>
            <textarea
              value={dietaryNotes}
              onChange={e => setDietaryNotes(e.target.value)}
              rows={2}
              placeholder="Any allergies or dietary preferences"
              className={inputClass + ' resize-none'}
              style={{ borderColor: 'rgba(28,28,28,0.15)', color: 'var(--charcoal)' }}
            />
          </div>
        </>
      )}

      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting || attending === null || !name || !email}
        className="w-full py-3 rounded-lg text-sm font-medium transition disabled:opacity-40"
        style={{ backgroundColor: 'var(--charcoal)', color: 'var(--ivory)' }}
      >
        {submitting ? 'Submitting...' : existing ? 'Update RSVP' : 'Send RSVP'}
      </button>
    </form>
  )
}
