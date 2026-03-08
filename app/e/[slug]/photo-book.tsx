'use client'

import { useState, useEffect,useRef } from 'react'
import { useRouter } from 'next/navigation'

type MediaItem = {
  id: string
  filename: string
  webFilename: string | null
  originalName: string
  caption: string | null
  uploadedBy: string | null
  mediaType: string
}
function PageContent({ item, active }: { item: MediaItem, active: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (active) {
      v.play().catch(() => {})
    } else {
      v.pause()
      v.currentTime = 0
    }
  }, [active])

  if (item.mediaType === 'video') {
    return (
      <video
        ref={videoRef}
        src={`/api/photo/${item.filename}`}
        className="max-w-full max-h-full object-contain"
        style={{ display: 'block' }}
        loop
        muted
        playsInline
        autoPlay={active}
      />
    )
  }

  return (
    <img
      src={`/api/photo/${item.filename}`}
      alt={item.caption ?? item.originalName}
      className="max-w-full max-h-full object-contain"
      style={{ display: 'block' }}
    />
  )
}
export default function PhotoBook({
  media,
  eventName,
    backUrl,
  onClose,
}: {
  media: MediaItem[]
  eventName: string
  backUrl?: string
  onClose: () => void
}) {
const items = media  // videos included

  const [spread, setSpread] = useState(0)
  const [flipping, setFlipping] = useState(false)
  const [flipDir, setFlipDir] = useState<'next' | 'prev'>('next')
  const [displaySpread, setDisplaySpread] = useState(0)

const router = useRouter()

  function handleClose() {
    if (onClose) onClose()
    else if (backUrl) router.push(backUrl)
  }

  // spread 0 = cover, then photo pairs
    const totalSpreads = Math.ceil(items.length / 2) + 1

function getPhotos(s: number): [MediaItem | null, MediaItem | null] {
  if (s === 0) return [null, null]
  const i = (s - 1) * 2
  return [items[i] ?? null, items[i + 1] ?? null]
}

  function goNext() {
    if (flipping || spread >= totalSpreads - 1) return
    setFlipDir('next')
    setFlipping(true)
    setTimeout(() => {
      setSpread(s => s + 1)
      setDisplaySpread(s => s + 1)
      setFlipping(false)
    }, 480)
  }

  function goPrev() {
    if (flipping || spread <= 0) return
    setFlipDir('prev')
    setFlipping(true)
    setTimeout(() => {
      setSpread(s => s - 1)
      setDisplaySpread(s => s - 1)
      setFlipping(false)
    }, 480)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [spread, flipping])

  const [leftPhoto, rightPhoto] = getPhotos(displaySpread)
  const nextSpread = flipDir === 'next' ? displaySpread + 1 : displaySpread - 1
  const [nextLeft, nextRight] = getPhotos(Math.max(0, Math.min(nextSpread, totalSpreads - 1)))

  const isCover = displaySpread === 0
  const isLastSpread = displaySpread === totalSpreads - 1

function LandscapePrompt() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    function check() {
      const isMobile = window.innerWidth < 1024
      const isPortrait = window.matchMedia('(orientation: portrait)').matches
      setShow(isMobile && isPortrait)
    }
    check()
    window.addEventListener('resize', check)
    window.screen.orientation?.addEventListener('change', check)
    return () => {
      window.removeEventListener('resize', check)
      window.screen.orientation?.removeEventListener('change', check)
    }
  }, [])

  if (!show) return null
useEffect(() => {
  const toPreload: string[] = []
  const [nl, nr] = getPhotos(Math.min(spread + 1, totalSpreads - 1))
  const [pl, pr] = getPhotos(Math.max(spread - 1, 0))
  ;[nl, nr, pl, pr].forEach(item => {
    if (item && item.mediaType !== 'video') {
      toPreload.push(`/api/photo/${item.filename}`)
    }
  })
  toPreload.forEach(src => {
    const img = new Image()
    img.src = src
  })
}, [spread])


  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center text-center px-8"
      style={{ backgroundColor: '#1a1510' }}
    >
      <div
        className="text-5xl mb-6"
        style={{
          display: 'inline-block',
          animation: 'rotateHint 1.8s ease-in-out infinite',
        }}
      >
        📱
      </div>
      <p
        className="font-display italic text-2xl mb-3"
        style={{ color: '#f5f0e8' }}
      >
        Rotate your device
      </p>
      <p
        className="font-sans text-sm"
        style={{ color: 'rgba(245,240,232,0.4)', letterSpacing: '0.05em' }}
      >
        The photobook is best viewed in landscape mode
      </p>
      <style>{`
        @keyframes rotateHint {
          0%, 100% { transform: rotate(0deg); }
          40%       { transform: rotate(90deg); }
          60%       { transform: rotate(90deg); }
        }
      `}</style>
          {/iPhone|iPad/i.test(navigator.userAgent) && (
        <p
            className="absolute bottom-6 font-sans text-xs text-center px-8"
            style={{ color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em' }}
        >
            For fullscreen: tap Share → Add to Home Screen
        </p>
        )}
    </div>
  )
}
useEffect(() => {
  // nudge Safari into hiding its tab bar
  document.documentElement.style.overflow = 'hidden'
  window.scrollTo(0, 1)
  return () => {
    document.documentElement.style.overflow = ''
  }
}, [])
  return (
    <>
    <LandscapePrompt />
      <style>{`
        @keyframes flipPageNext {
          0%   { transform: perspective(2000px) rotateY(0deg); }
          100% { transform: perspective(2000px) rotateY(-180deg); }
        }
        @keyframes flipPagePrev {
          0%   { transform: perspective(2000px) rotateY(0deg); }
          100% { transform: perspective(2000px) rotateY(180deg); }
        }
        .flip-next { animation: flipPageNext 0.48s cubic-bezier(0.645, 0.045, 0.355, 1.000) forwards; }
        .flip-prev { animation: flipPagePrev 0.48s cubic-bezier(0.645, 0.045, 0.355, 1.000) forwards; }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center select-none"
        style={{ backgroundColor: '#1a1510',height: '100dvh', paddingBottom: 'env(safe-area-inset-bottom)', }}
      >
        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 z-30 font-sans text-xs tracking-widest uppercase transition"
          style={{ color: 'rgba(255,255,255,0.3)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
        >
          Close ✕
        </button>

        {/* Book + nav row */}
        <div className="flex items-center justify-center gap-8 w-full px-6">

          {/* Prev arrow */}
          <button
            onClick={goPrev}
            disabled={spread === 0 || flipping}
            className="shrink-0 transition-all duration-200"
            style={{ color: spread === 0 ? 'transparent' : 'rgba(255,255,255,0.25)' }}
            onMouseEnter={e => { if (spread > 0) e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}
            onMouseLeave={e => { e.currentTarget.style.color = spread === 0 ? 'transparent' : 'rgba(255,255,255,0.25)' }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M20 6L10 16L20 26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* ── The Book ── */}
          <div
            className="relative shrink-0"
            style={{
                width: 'min(88vw, 2080px)',
                height: 'min(36vw, 1000px)',
                perspective: '3000px',
            }}
          >
            {/* Drop shadow */}
            <div
              className="absolute inset-0 rounded-sm"
              style={{ boxShadow: '0 60px 120px rgba(0,0,0,0.85), 0 20px 40px rgba(0,0,0,0.6)' }}
            />

            {/* Book body */}
            <div className="absolute inset-0 flex rounded-sm overflow-hidden">

              {/* ── Left page ── */}
              <div
                className="relative flex-1 flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: '#f5f0e8' }}
                onClick={goPrev}
              >
                {isCover ? (
                  /* Cover left — decorative */
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center px-10"
                    style={{ backgroundColor: '#1c1712' }}
                  >
                    {/* Decorative corner marks */}
                    {['top-4 left-4', 'top-4 right-4', 'bottom-4 left-4', 'bottom-4 right-4'].map((pos, i) => (
                      <div key={i} className={`absolute ${pos} w-5 h-5`} style={{ border: '1px solid rgba(184,149,90,0.4)', borderRadius: '1px' }} />
                    ))}
                    <div className="text-center">
                      <p className="font-display text-xs tracking-[0.4em] uppercase mb-6" style={{ color: 'var(--rose)', opacity: 0.7 }}>
                        a collection of memories
                      </p>
                      <h1
                        className="font-display font-light leading-tight"
                        style={{
                          color: '#f5f0e8',
                          fontSize: 'clamp(1.4rem, 3.5vw, 2.8rem)',
                        }}
                      >
                        {eventName}
                      </h1>
                      <div className="flex items-center justify-center gap-3 mt-6">
                        <div className="h-px w-12" style={{ backgroundColor: 'var(--gold)', opacity: 0.5 }} />
                        <div className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--gold)' }} />
                        <div className="h-px w-12" style={{ backgroundColor: 'var(--gold)', opacity: 0.5 }} />
                      </div>
                    </div>
                  </div>
                ) : leftPhoto ? (
                  /* Photo page */
                  <div className="absolute inset-0 flex items-center justify-center" style={{ padding: '5%' }}>
                    <div
                      className="w-full h-full flex flex-col items-center justify-center"
                      style={{
                        backgroundColor: 'white',
                        padding: '4%',
                        boxShadow: '0 2px 16px rgba(0,0,0,0.12)',
                      }}
                    >
                      <div className="flex-1 w-full overflow-hidden flex items-center justify-center" style={{ minHeight: 0 }}>
                        <PageContent item={leftPhoto} active={!flipping} />
                      </div>
                      {leftPhoto.caption && (
                        <p
                          className="font-display italic text-center mt-2 shrink-0"
                          style={{
                            color: 'rgba(28,28,28,0.45)',
                            fontSize: 'clamp(0.55rem, 1vw, 0.75rem)',
                          }}
                        >
                          {leftPhoto.caption}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Empty left page (last spread odd count) */
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="font-display italic text-2xl" style={{ color: 'rgba(28,28,28,0.1)' }}>fin.</p>
                  </div>
                )}

                {/* Page number */}
                {!isCover && (
                  <p
                    className="absolute bottom-3 left-0 right-0 text-center font-sans"
                    style={{ color: 'rgba(28,28,28,0.2)', fontSize: '0.6rem', letterSpacing: '0.15em' }}
                  >
                    {(displaySpread - 1) * 2 + 1}
                  </p>
                )}
              </div>

              {/* ── Spine ── */}
              <div
                style={{
                  width: '6px',
                  flexShrink: 0,
                  background: 'linear-gradient(to right, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.08) 40%, rgba(255,255,255,0.15) 60%, rgba(0,0,0,0.1) 100%)',
                }}
              />

              {/* ── Right page ── */}
              <div
                className="relative flex-1 flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: '#faf7f2' }}
                onClick={goNext}
              >
                {isCover ? (
                  /* Cover right — open invitation */
                  <div className="text-center px-10">
                    <p className="font-display italic" style={{ color: 'var(--muted)', fontSize: 'clamp(0.9rem, 2vw, 1.3rem)' }}>
                      Turn the page to begin
                    </p>
                    <p className="font-sans mt-3" style={{ color: 'var(--muted)', opacity: 0.4, fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                      {items.length} photograph{items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                ) : isLastSpread && !rightPhoto ? (
                  /* Back cover */
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ backgroundColor: '#1c1712' }}
                  >
                    <p className="font-display italic" style={{ color: 'rgba(245,240,232,0.25)', fontSize: 'clamp(1rem, 2.5vw, 1.6rem)' }}>
                      fin.
                    </p>
                  </div>
                ) : rightPhoto ? (
                  /* Photo page */
                  <div className="absolute inset-0 flex items-center justify-center" style={{ padding: '5%' }}>
                    <div
                      className="w-full h-full flex flex-col items-center justify-center"
                      style={{
                        backgroundColor: 'white',
                        padding: '4%',
                        boxShadow: '0 2px 16px rgba(0,0,0,0.12)',
                      }}
                    >
                      <div className="flex-1 w-full overflow-hidden flex items-center justify-center" style={{ minHeight: 0 }}>
                        <PageContent item={rightPhoto} active={!flipping} />
                      </div>
                      {rightPhoto.caption && (
                        <p
                          className="font-display italic text-center mt-2 shrink-0"
                          style={{
                            color: 'rgba(28,28,28,0.45)',
                            fontSize: 'clamp(0.55rem, 1vw, 0.75rem)',
                          }}
                        >
                          {rightPhoto.caption}
                        </p>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Page number */}
                {!isCover && rightPhoto && (
                  <p
                    className="absolute bottom-3 left-0 right-0 text-center font-sans"
                    style={{ color: 'rgba(28,28,28,0.2)', fontSize: '0.6rem', letterSpacing: '0.15em' }}
                  >
                    {(displaySpread - 1) * 2 + 2}
                  </p>
                )}
              </div>
            </div>

            {/* ── Flip animation overlay ── */}
            {flipping && (
              <div
                className={`${flipDir === 'next' ? 'flip-next' : 'flip-prev'}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  ...(flipDir === 'next'
                    ? { left: '50%', right: 0, transformOrigin: 'left center' }
                    : { left: 0, right: '50%', transformOrigin: 'right center' }
                  ),
                  transformStyle: 'preserve-3d',
                  zIndex: 20,
                }}
              >
                {/* Front face of flipping page */}
                <div
                  style={{
                    position: 'absolute', inset: 0,
                    backfaceVisibility: 'hidden',
                    backgroundColor: flipDir === 'next' ? '#faf7f2' : '#f5f0e8',
                    overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {flipDir === 'next' && rightPhoto && (
                    <div style={{ position: 'absolute', inset: '5%', backgroundColor: 'white', padding: '4%', boxShadow: '0 2px 16px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={`/api/photo/${rightPhoto.filename}`} className="max-w-full max-h-full object-contain" style={{ display: 'block' }} />
                    </div>
                  )}
                  {flipDir === 'prev' && nextLeft && (
                    <div style={{ position: 'absolute', inset: '5%', backgroundColor: 'white', padding: '4%', boxShadow: '0 2px 16px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={`/api/photo/${nextLeft.filename}`} className="max-w-full max-h-full object-contain" style={{ display: 'block' }} />
                    </div>
                  )}
                </div>

                {/* Back face of flipping page */}
                <div
                  style={{
                    position: 'absolute', inset: 0,
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    backgroundColor: '#f5f0e8',
                    overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {flipDir === 'next' && nextLeft && (
                    <div style={{ position: 'absolute', inset: '5%', backgroundColor: 'white', padding: '4%', boxShadow: '0 2px 16px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={`/api/photo/${nextLeft.filename}`} className="max-w-full max-h-full object-contain" style={{ display: 'block' }} />
                    </div>
                  )}
                  {flipDir === 'prev' && leftPhoto && (
                    <div style={{ position: 'absolute', inset: '5%', backgroundColor: 'white', padding: '4%', boxShadow: '0 2px 16px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={`/api/photo/${leftPhoto.filename}`} className="max-w-full max-h-full object-contain" style={{ display: 'block' }} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* ── End book ── */}

          {/* Next arrow */}
          <button
            onClick={goNext}
            disabled={spread >= totalSpreads - 1 || flipping}
            className="shrink-0 transition-all duration-200"
            style={{ color: spread >= totalSpreads - 1 ? 'transparent' : 'rgba(255,255,255,0.25)' }}
            onMouseEnter={e => { if (spread < totalSpreads - 1) e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}
            onMouseLeave={e => { e.currentTarget.style.color = spread >= totalSpreads - 1 ? 'transparent' : 'rgba(255,255,255,0.25)' }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M12 6L22 16L12 26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Spread indicator dots */}
        <div className="flex items-center gap-1.5 mt-6">
          {Array.from({ length: totalSpreads }).map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === displaySpread ? '16px' : '4px',
                height: '4px',
                backgroundColor: i === displaySpread ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </div>
      </div>
    </>
  )
}