'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AcceptInviteForm({
  token,
  email,
}: {
  token: string
  email: string
}) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'One uppercase letter' },
  { test: (p: string) => /[0-9]/.test(p), label: 'One number' },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: 'One special character' },
]
function validatePassword(p: string) {
  return PASSWORD_RULES.every(r => r.test(p))
}
  async function handleSubmit() {
    if (!name || !password) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/invite/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, name, password }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
      setLoading(false)
      return
    }

    router.push('/login')
  }
const isValid = !!name && validatePassword(password)

  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        placeholder="Your name"
        value={name}
        onChange={e => setName(e.target.value)}
        className="w-full px-4 py-3 rounded-xl text-sm font-sans focus:outline-none"
        style={{
          backgroundColor: 'white',
          border: '1px solid rgba(28,28,28,0.12)',
          color: 'var(--charcoal)',
        }}
      />
      <input
        type="password"
        placeholder="Choose a password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="w-full px-4 py-3 rounded-xl text-sm font-sans focus:outline-none"
        style={{
          backgroundColor: 'white',
          border: '1px solid rgba(28,28,28,0.12)',
          color: 'var(--charcoal)',
        }}
      />
      {password && (
        <ul className="flex flex-col gap-1 px-1">
            {PASSWORD_RULES.map(rule => (
            <li key={rule.label} className="flex items-center gap-1.5 text-xs font-sans">
                <span>{rule.test(password) ? '✓' : '○'}</span>
                <span style={{ color: rule.test(password) ? 'var(--charcoal)' : 'var(--muted)' }}>
                {rule.label}
                </span>
            </li>
            ))}
        </ul>
        )}
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={loading || !isValid}
        className="w-full py-3 rounded-xl text-sm font-sans font-medium transition"
        style={{
          backgroundColor: name && password ? 'var(--charcoal)' : 'rgba(28,28,28,0.2)',
          color: 'var(--ivory)',
        }}
      >
        {loading ? 'Creating account…' : 'Create account'}
      </button>
    </div>
  )
}