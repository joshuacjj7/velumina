import Link from 'next/link'

const features = [
  {
    icon: '⟡',
    title: 'No downloads required',
    description: 'Guests scan a QR code and immediately view and contribute photos — no app installs, no account creation.',
  },
  {
    icon: '◎',
    title: 'Your server, your data',
    description: 'Self-hosted means your photos never touch a third-party server. Complete privacy, forever.',
  },
  {
    icon: '✦',
    title: 'Beautiful by default',
    description: 'A sentimental, warm gallery experience that honours the occasion — not a generic file dump.',
  },
  {
    icon: '❋',
    title: 'Event-specific galleries',
    description: 'Each event gets its own private gallery and QR code. Clean separation, no cross-contamination.',
  },
]

const steps = [
  {
    n: '01',
    title: 'Create an event',
    description: 'Set up a named gallery for your wedding, birthday, or reunion in seconds from the admin panel.',
  },
  {
    n: '02',
    title: 'Share the QR code',
    description: 'Print it, display it, or send it. Guests scan and land directly on the event gallery.',
  },
  {
    n: '03',
    title: 'Everyone contributes',
    description: 'Guests browse the gallery and upload their own photos with optional captions — no friction.',
  },
  {
    n: '04',
    title: 'Relive it together',
    description: 'All memories in one beautiful place, hosted privately on your own infrastructure.',
  },
]

export default function LandingPage() {
  return (
    <main style={{ backgroundColor: 'var(--ivory)', color: 'var(--charcoal)' }} className="overflow-x-hidden">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 sm:px-12 py-6">
        <span className="font-display text-2xl font-light tracking-wide">Velumina</span>
        <div className="flex items-center gap-6">
          <a href="#how-it-works" className="font-sans text-sm hidden sm:block" style={{ color: 'var(--muted)' }}>
            How it works
          </a>
          <a href="#self-host" className="font-sans text-sm hidden sm:block" style={{ color: 'var(--muted)' }}>
            Self-host
          </a>
          <Link
            href="/admin"
            className="font-sans text-sm px-4 py-2 rounded-full transition"
            style={{ border: '1px solid rgba(28,28,28,0.2)', color: 'var(--charcoal)' }}
          >
            Admin →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 sm:px-12 pt-16 pb-24 sm:pt-24 sm:pb-32 max-w-6xl mx-auto">
        {/* Decorative scattered photo frames */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute w-32 h-40 rounded-xl hidden sm:block"
            style={{
              top: '8%', left: '3%',
              backgroundColor: 'rgba(196,144,122,0.12)',
              border: '1px solid rgba(196,144,122,0.2)',
              transform: 'rotate(-6deg)',
            }}
          />
          <div
            className="absolute w-24 h-32 rounded-xl hidden sm:block"
            style={{
              top: '30%', left: '6%',
              backgroundColor: 'rgba(184,149,90,0.1)',
              border: '1px solid rgba(184,149,90,0.18)',
              transform: 'rotate(4deg)',
            }}
          />
          <div
            className="absolute w-36 h-44 rounded-xl hidden sm:block"
            style={{
              top: '5%', right: '4%',
              backgroundColor: 'rgba(196,144,122,0.1)',
              border: '1px solid rgba(196,144,122,0.18)',
              transform: 'rotate(5deg)',
            }}
          />
          <div
            className="absolute w-28 h-36 rounded-xl hidden sm:block"
            style={{
              top: '40%', right: '2%',
              backgroundColor: 'rgba(184,149,90,0.08)',
              border: '1px solid rgba(184,149,90,0.15)',
              transform: 'rotate(-3deg)',
            }}
          />
        </div>

        {/* Hero text */}
        <div className="relative text-center max-w-3xl mx-auto">
          <p
            className="font-sans text-xs tracking-[0.35em] uppercase mb-6"
            style={{ color: 'var(--rose)' }}
          >
            Private · Beautiful · Self-hosted
          </p>

          <h1 className="font-display font-light leading-[1.1]" style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}>
            Your memories,<br />
            <em>beautifully</em> kept.
          </h1>

          <p className="font-sans text-base sm:text-lg mt-6 max-w-xl mx-auto leading-relaxed" style={{ color: 'var(--muted)' }}>
            Velumina is a self-hosted event photo sharing platform. Guests scan a QR code, view the gallery, and contribute their own photos — no downloads, no accounts, no third parties.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <a
              href="#self-host"
              className="font-sans text-sm px-8 py-3.5 rounded-full font-medium transition w-full sm:w-auto text-center"
              style={{ backgroundColor: 'var(--charcoal)', color: 'var(--ivory)' }}
            >
              Get started free
            </a>
            <a
              href="#how-it-works"
              className="font-sans text-sm px-8 py-3.5 rounded-full font-medium transition w-full sm:w-auto text-center"
              style={{ border: '1px solid rgba(28,28,28,0.2)', color: 'var(--charcoal)' }}
            >
              See how it works
            </a>
          </div>
        </div>

        {/* Divider ornament */}
        <div className="flex items-center justify-center gap-4 mt-20">
          <div className="h-px flex-1 max-w-[120px]" style={{ backgroundColor: 'rgba(196,144,122,0.3)' }} />
          <span className="font-display text-xl" style={{ color: 'var(--rose)' }}>✦</span>
          <div className="h-px flex-1 max-w-[120px]" style={{ backgroundColor: 'rgba(196,144,122,0.3)' }} />
        </div>
      </section>

      {/* Features */}
      <section className="px-6 sm:px-12 py-16 max-w-6xl mx-auto">
        <p className="font-sans text-xs tracking-[0.35em] uppercase text-center mb-12" style={{ color: 'var(--muted)' }}>
          Why Velumina
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(f => (
            <div
              key={f.title}
              className="p-6 rounded-2xl"
              style={{ backgroundColor: 'white', border: '1px solid rgba(28,28,28,0.06)', boxShadow: '0 2px 16px rgba(28,28,28,0.04)' }}
            >
              <span className="text-2xl block mb-4" style={{ color: 'var(--rose)' }}>{f.icon}</span>
              <h3 className="font-display text-xl font-medium mb-2">{f.title}</h3>
              <p className="font-sans text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 sm:px-12 py-20 max-w-6xl mx-auto">
        <p className="font-sans text-xs tracking-[0.35em] uppercase text-center mb-4" style={{ color: 'var(--muted)' }}>
          How it works
        </p>
        <h2 className="font-display text-4xl sm:text-5xl font-light text-center mb-16">
          Simple for everyone
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, i) => (
            <div key={s.n} className="relative">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div
                  className="absolute top-8 left-full w-full h-px hidden lg:block"
                  style={{ backgroundColor: 'rgba(196,144,122,0.2)', zIndex: 0 }}
                />
              )}
              <div
                className="font-display text-6xl font-light leading-none mb-4"
                style={{ color: 'rgba(196,144,122,0.3)' }}
              >
                {s.n}
              </div>
              <h3 className="font-display text-xl font-medium mb-2">{s.title}</h3>
              <p className="font-sans text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{s.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Self-host section */}
      <section
        id="self-host"
        className="mx-4 sm:mx-12 my-12 rounded-3xl px-8 sm:px-16 py-16 sm:py-20"
        style={{ backgroundColor: 'var(--charcoal)', color: 'var(--ivory)' }}
      >
        <div className="max-w-4xl mx-auto">
          <p className="font-sans text-xs tracking-[0.35em] uppercase mb-4" style={{ color: 'rgba(196,144,122,0.8)' }}>
            Open source · Free forever
          </p>
          <h2 className="font-display text-4xl sm:text-5xl font-light leading-tight mb-6">
            Your server.<br />
            <em>Your</em> photos.
          </h2>
          <p className="font-sans text-base leading-relaxed mb-10 max-w-xl" style={{ color: 'rgba(250,247,242,0.6)' }}>
            Velumina is fully open source and designed to run on your own infrastructure with Docker. No subscriptions, no vendor lock-in, no one else's hands on your memories.
          </p>

          {/* Code block */}
          <div
            className="rounded-2xl p-5 mb-8 font-mono text-sm overflow-x-auto"
            style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <p style={{ color: 'rgba(250,247,242,0.4)' }}># Clone and run in minutes</p>
            <p className="mt-2" style={{ color: 'rgba(196,144,122,0.9)' }}>git clone https://github.com/joshuacjj7/velumina</p>
            <p style={{ color: 'rgba(250,247,242,0.7)' }}>cd velumina</p>
            <p style={{ color: 'rgba(250,247,242,0.7)' }}>cp .env.example .env.prod</p>
            <p style={{ color: 'rgba(250,247,242,0.7)' }}>docker compose -f docker-compose.prod.yml up -d</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
             <a
              href="https://github.com/joshuacjj7/velumina"
              target="_blank"
              className="font-sans text-sm px-8 py-3.5 rounded-full font-medium text-center transition"
              style={{ backgroundColor: 'var(--ivory)', color: 'var(--charcoal)' }}
            >
              View on GitHub →
            </a>
            <Link
              href="/admin"
              className="font-sans text-sm px-8 py-3.5 rounded-full font-medium text-center transition"
              style={{ border: '1px solid rgba(250,247,242,0.2)', color: 'var(--ivory)' }}
            >
              Go to admin panel
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 sm:px-12 py-12 text-center">
        <p className="font-display text-2xl font-light mb-2">Velumina</p>
        <p className="font-sans text-xs" style={{ color: 'var(--muted)' }}>
          Open source event photo sharing · Self-hosted with ♡
        </p>
      </footer>

    </main>
  )
}