'use client'

import { useState } from 'react'

const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'One uppercase letter' },
  { test: (p: string) => /[0-9]/.test(p), label: 'One number' },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: 'One special character' },
]

function isStrongPassword(p: string) {
  return PASSWORD_RULES.every(r => r.test(p))
}

export default function ChangePasswordForm() {
  const [current, setCurrent] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const passwordValid = isStrongPassword(newPassword)
  const passwordsMatch = newPassword === confirm
  const canSubmit = current && passwordValid && passwordsMatch && !loading

  async function handleSubmit() {
    setError('')
    setSuccess(false)
    setLoading(true)

    const res = await fetch('/api/admin/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current, newPassword }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
    } else {
      setSuccess(true)
      setCurrent('')
      setNewPassword('')
      setConfirm('')
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-neutral-700">Current password</label>
        <input
          type="password"
          value={current}
          onChange={e => setCurrent(e.target.value)}
          className="border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-neutral-700">New password</label>
        <input
          type="password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          className="border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
        />
        {newPassword && (
          <ul className="flex flex-col gap-1 mt-1 px-1">
            {PASSWORD_RULES.map(rule => (
              <li key={rule.label} className="flex items-center gap-1.5 text-xs">
                <span>{rule.test(newPassword) ? '✓' : '○'}</span>
                <span style={{ color: rule.test(newPassword) ? 'var(--charcoal)' : 'var(--muted)' }}>
                  {rule.label}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-neutral-700">Confirm new password</label>
        <input
          type="password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          className="border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
        />
        {confirm && !passwordsMatch && (
          <p className="text-xs text-red-400 mt-1">Passwords don't match</p>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
      {success && <p className="text-xs text-green-600">Password updated successfully.</p>}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="py-2.5 rounded-lg text-sm font-medium transition"
        style={{
          backgroundColor: canSubmit ? 'var(--charcoal)' : 'rgba(28,28,28,0.2)',
          color: 'var(--ivory)',
        }}
      >
        {loading ? 'Updating…' : 'Update password'}
      </button>
    </div>
  )
}