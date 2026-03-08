import { auth, signOut } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import MobileNav from './components/mobile-nav'
import UserMenu from './components/user-menu'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F2EE' }}>
      <header
        className="sticky top-0 z-10 px-4 sm:px-6 py-4 flex items-center justify-between relative"
        style={{
          backgroundColor: 'var(--ivory)',
          borderBottom: '1px solid rgba(28,28,28,0.08)',
        }}
      >
        {/* Left */}
        <div className="flex items-center gap-6">
          <Link href="/admin" className="font-display text-xl font-light tracking-wide" style={{ color: 'var(--charcoal)' }}>
            Velumina
          </Link>

        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
                    {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-6">
            <Link
              href="/admin/events"
              className="font-sans text-sm transition hover:text-neutral-900"
              style={{ color: 'var(--muted)' }}
            >
              Events
            </Link>

          </nav>
          <UserMenu email={session.user?.email ?? ''} />

          {/* Mobile hamburger */}
          <MobileNav email={session.user?.email ?? ''} />
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-8 max-w-5xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}