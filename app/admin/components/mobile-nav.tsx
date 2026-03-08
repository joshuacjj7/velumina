'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function MobileNav({ email }: { email: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="sm:hidden">
      {/* Hamburger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex flex-col gap-1.5 p-1"
        aria-label="Toggle menu"
      >
        <span
          className="block w-5 h-px transition-all duration-300"
          style={{
            backgroundColor: 'var(--charcoal)',
            transform: open ? 'translateY(4px) rotate(45deg)' : 'none',
          }}
        />
        <span
          className="block w-5 h-px transition-all duration-300"
          style={{
            backgroundColor: 'var(--charcoal)',
            opacity: open ? 0 : 1,
          }}
        />
        <span
          className="block w-5 h-px transition-all duration-300"
          style={{
            backgroundColor: 'var(--charcoal)',
            transform: open ? 'translateY(-4px) rotate(-45deg)' : 'none',
          }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute top-full left-0 right-0 px-4 py-4 flex flex-col gap-1 z-20"
          style={{
            backgroundColor: 'var(--ivory)',
            borderBottom: '1px solid rgba(28,28,28,0.08)',
            boxShadow: '0 8px 24px rgba(28,28,28,0.08)',
          }}
        >
          <p className="font-sans text-xs px-3 py-1 mb-1" style={{ color: 'var(--muted)' }}>
            {email}
          </p>
          <Link
            href="/admin"
            onClick={() => setOpen(false)}
            className="font-sans text-sm px-3 py-2.5 rounded-xl transition"
            style={{ color: 'var(--charcoal)' }}
          >
            Dashboard
          </Link>
          <Link
            href="/admin/events"
            onClick={() => setOpen(false)}
            className="font-sans text-sm px-3 py-2.5 rounded-xl transition"
            style={{ color: 'var(--charcoal)' }}
          >
            Events
          </Link>
          <Link
            href="/admin/team"
            onClick={() => setOpen(false)}
            className="font-sans text-sm px-3 py-2.5 rounded-xl transition"
            style={{ color: 'var(--charcoal)' }}
          >
            Team
          </Link>
          <Link
            href="/admin/settings"
            onClick={() => setOpen(false)}
            className="font-sans text-sm px-3 py-2.5 rounded-xl transition"
            style={{ color: 'var(--charcoal)' }}
          >
            Settings
          </Link>

          <form action="/api/auth/signout" method="POST">
          <button
            onClick={async () => {
              setOpen(false)
              await fetch('/api/auth/signout', { method: 'POST' })
              window.location.href = '/login'
            }}
            className="w-full text-left font-sans text-sm px-3 py-2.5 rounded-xl"
            style={{ color: '#C0392B' }}
          >
            Sign out
          </button>
            </form>
        </div>
      )}
    </div>
  )
}