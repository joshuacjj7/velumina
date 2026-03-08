'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { signOutAction } from './actions'

export default function UserMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="hidden sm:block relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 font-sans text-xs px-3 py-1.5 rounded-full transition hover:border-neutral-400 hover:text-neutral-700"
        style={{ border: '1px solid rgba(28,28,28,0.15)', color: 'var(--muted)' }}
      >
        {email}
        <svg
          width="10" height="6" viewBox="0 0 10 6" fill="none"
          style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}
        >
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-48 rounded-xl py-1.5 z-30"
          style={{
            backgroundColor: 'var(--ivory)',
            border: '1px solid rgba(28,28,28,0.08)',
            boxShadow: '0 8px 24px rgba(28,28,28,0.10)',
          }}
        >
          <Link
            href="/admin"
            onClick={() => setOpen(false)}
            className="block font-sans text-sm px-4 py-2 transition hover:bg-black/5"
            style={{ color: 'var(--charcoal)' }}
          >
            Dashboard
          </Link>
          <Link
            href="/admin/team"
            onClick={() => setOpen(false)}
            className="block font-sans text-sm px-4 py-2 transition hover:bg-black/5"
            style={{ color: 'var(--charcoal)' }}
          >
            Team
          </Link>
          <Link
            href="/admin/settings"
            onClick={() => setOpen(false)}
            className="block font-sans text-sm px-4 py-2 transition hover:bg-black/5"
            style={{ color: 'var(--charcoal)' }}
          >
            Settings
          </Link>
          <div style={{ borderTop: '1px solid rgba(28,28,28,0.08)', margin: '4px 0' }} />
            <form action={signOutAction}>
            <button
                type="submit"
                className="w-full text-left font-sans text-sm px-4 py-2 transition hover:bg-black/5"
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