'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (res?.error) {
      setError('Invalid email or password.')
      setLoading(false)
    } else {
      router.push('/admin')
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--ivory)' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-light" style={{ color: 'var(--charcoal)' }}>
            Velumina
          </h1>
          <p className="font-sans text-sm mt-2" style={{ color: 'var(--muted)' }}>
            Admin access
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-xs font-medium tracking-wide uppercase" style={{ color: 'var(--muted)' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="px-4 py-3 rounded-xl text-sm font-sans text-gray-700 placeholder:text-gray-400 focus:outline-none transition"
              style={{
                backgroundColor: 'white',
                border: '1px solid rgba(28,28,28,0.12)',
                boxShadow: '0 1px 4px rgba(28,28,28,0.04)',
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-xs font-medium tracking-wide uppercase" style={{ color: 'var(--muted)' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="px-4 py-3 rounded-xl text-sm font-sans text-gray-700 placeholder:text-gray-400 focus:outline-none transition"
              style={{
                backgroundColor: 'white',
                border: '1px solid rgba(28,28,28,0.12)',
                boxShadow: '0 1px 4px rgba(28,28,28,0.04)',
              }}
            />
          </div>

          {error && (
            <p className="font-sans text-xs px-1" style={{ color: '#C0392B' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="py-3 rounded-xl text-sm font-sans font-medium mt-2 transition"
            style={{
              backgroundColor: loading ? 'rgba(28,28,28,0.3)' : 'var(--charcoal)',
              color: 'var(--ivory)',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  )
}