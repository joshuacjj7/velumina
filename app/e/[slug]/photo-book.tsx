'use client'

import { useState, useEffect, useRef, forwardRef } from 'react'
import { useRouter } from 'next/navigation'
import HTMLFlipBook from 'react-pageflip'

type MediaItem = {
  id: string
  filename: string
  webFilename: string | null
  originalName: string
  caption: string | null
  uploadedBy: string | null
  mediaType: string
}

const Page = forwardRef<HTMLDivElement, {
  children: React.ReactNode
  pageNumber?: number
}>(({ children, pageNumber }, ref) => {
  return (
    <div ref={ref} className="relative w-full h-full overflow-hidden" style={{ backgroundColor: '#f5f0e8' }}>
      {children}
      {pageNumber !== undefined && (
        <p
          className="absolute bottom-3 left-0 right-0 text-center font-sans"
          style={{ color: 'rgba(28,28,28,0.2)', fontSize: '0.6rem', letterSpacing: '0.15em' }}
        >
          {pageNumber}
        </p>
      )}
    </div>
  )
})
Page.displayName = 'Page'

function FadeImg({
  src,
  alt,
  className,
  style,
}: {
  src: string
  alt: string
  className?: string
  style?: React.CSSProperties
}) {
  const [loaded, setLoaded] = useState(false)
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={{ ...style, opacity: loaded ? 1 : 0, transition: 'opacity 0.35s ease' }}
      onLoad={() => setLoaded(true)}
    />
  )
}

function VideoPage({ item, active }: { item: MediaItem; active: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (active) v.play().catch(() => {})
    else { v.pause(); v.currentTime = 0 }
  }, [active])
  return (
    <video
      ref={videoRef}
      src={`/api/photo/${item.filename}`}
      className="max-w-full max-h-full object-contain"
      style={{ display: 'block' }}
      loop muted playsInline
    />
  )
}

function PhotoPageContent({ item, active }: { item: MediaItem; active: boolean }) {
  if (item.mediaType === 'video') return <VideoPage item={item} active={active} />
  return (
    <FadeImg
      src={`/api/photo/${item.filename}`}
      alt={item.caption ?? item.originalName}
      className="max-w-full max-h-full object-contain"
      style={{ display: 'block' }}
    />
  )
}

function LandscapePrompt() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    function check() {
      const isMobile = window.innerWidth < 1024
      const isPortrait = window.matchMedia('(orientation: portrait)').matches
      setShow(isMobile && isPortrait)
    }
    const delayedCheck = () => setTimeout(check, 150)
    check()
    window.addEventListener('resize', check)
    window.addEventListener('orientationchange', delayedCheck)
    const mql = window.matchMedia('(orientation: portrait)')
    mql.addEventListener('change', check)
    window.screen.orientation?.addEventListener('change', check)
    return () => {
      window.removeEventListener('resize', check)
      window.removeEventListener('orientationchange', delayedCheck)
      mql.removeEventListener('change', check)
      window.screen.orientation?.removeEventListener('change', check)
    }
  }, [])
  if (!show) return null
  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center text-center px-8" style={{ backgroundColor: '#1a1510' }}>
      <div className="text-5xl mb-6" style={{ display: 'inline-block', animation: 'rotateHint 1.8s ease-in-out infinite' }}>📱</div>
      <p className="font-display italic text-2xl mb-3" style={{ color: '#f5f0e8' }}>Rotate your device</p>
      <p className="font-sans text-sm" style={{ color: 'rgba(245,240,232,0.4)', letterSpacing: '0.05em' }}>
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
        <p className="absolute bottom-6 font-sans text-xs text-center px-8" style={{ color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em' }}>
          For fullscreen: tap Share → Add to Home Screen
        </p>
      )}
    </div>
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
  const items = media
  const router = useRouter()
  const bookRef = useRef<any>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [bookSize, setBookSize] = useState({ width: 500, height: 400 })

  const paddedPhotos: (MediaItem | null)[] = [...items]
  if (paddedPhotos.length % 2 !== 0) paddedPhotos.push(null)

  useEffect(() => {
    function updateSize() {
      const w = Math.min(Math.floor(window.innerWidth * 0.42), 860)
      const h = Math.min(Math.floor(window.innerHeight * 0.72), 680)
      setBookSize({ width: w, height: h })
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  useEffect(() => {
    items.forEach(item => {
      if (item.mediaType !== 'video') {
        const img = new Image()
        img.src = `/api/photo/${item.filename}`
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.documentElement.style.overflow = 'hidden'
    window.scrollTo(0, 1)
    return () => { document.documentElement.style.overflow = '' }
  }, [])

  function handleClose() {
    if (onClose) onClose()
    else if (backUrl) router.push(backUrl)
  }

  function goNext() {
    bookRef.current?.pageFlip()?.flipNext()
  }

  function goPrev() {
    bookRef.current?.pageFlip()?.flipPrev()
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const isFirstPage = currentPage === 0
  const isLastPage = totalPages > 0 && currentPage >= totalPages - 2

  return (
    <>
      <LandscapePrompt />

      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center select-none"
        style={{ backgroundColor: '#1a1510', height: '100dvh', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 z-30 font-sans text-xs tracking-widest uppercase transition"
          style={{ color: 'rgba(255,255,255,0.3)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
        >
          Close ✕
        </button>

        {/* Floating prompt above book — only on cover */}
        <div
          className="text-center mb-4 transition-opacity duration-500"
          style={{ opacity: isFirstPage ? 1 : 0, pointerEvents: isFirstPage ? 'auto' : 'none' }}
        >
          <p className="font-display italic" style={{ color: 'rgba(245,240,232,0.4)', fontSize: 'clamp(0.8rem, 1.5vw, 1.1rem)' }}>
            Turn the page to begin
          </p>
          <p className="font-sans mt-1" style={{ color: 'rgba(245,240,232,0.2)', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            {items.length} photograph{items.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center justify-center gap-8 w-full px-6">

          <button
            onClick={goPrev}
            disabled={isFirstPage}
            className="shrink-0 transition-all duration-200"
            style={{ color: isFirstPage ? 'transparent' : 'rgba(255,255,255,0.25)' }}
            onMouseEnter={e => { if (!isFirstPage) e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}
            onMouseLeave={e => { e.currentTarget.style.color = isFirstPage ? 'transparent' : 'rgba(255,255,255,0.25)' }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M20 6L10 16L20 26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Hidden SVG filter for wood grain texture */}
          <svg width="0" height="0" style={{ position: 'absolute' }}>
            <filter id="woodGrain" x="0%" y="0%" width="100%" height="100%">
              {/* Stretched Perlin noise = natural wood grain */}
              <feTurbulence type="fractalNoise" baseFrequency="0.12 0.012" numOctaves="5" seed="3" result="grain" />
              {/* Map noise into dark walnut tones */}
              <feColorMatrix
                in="grain"
                type="matrix"
                values="0 0 0 .07 .18
                        0 0 0 .05 .11
                        0 0 0 .03 .05
                        0 0 0  0  1"
                result="wood"
              />
            </filter>
          </svg>
          <div
            className="shrink-0"
            style={{
              boxShadow: '0 60px 120px rgba(0,0,0,0.85), 0 20px 40px rgba(0,0,0,0.6)',
              borderRadius: '2px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Wood table surface behind the book */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                filter: 'url(#woodGrain)',
                zIndex: 0,
              }}
            />
            <HTMLFlipBook
              ref={bookRef}
              width={bookSize.width}
              height={bookSize.height}
              size="fixed"
              minWidth={200}
              maxWidth={900}
              minHeight={200}
              maxHeight={700}
              drawShadow={true}
              flippingTime={600}
              usePortrait={false}
              startZIndex={10}
              autoSize={false}
              maxShadowOpacity={0.5}
              showCover={true}
              mobileScrollSupport={true}
              clickEventForward={false}
              useMouseEvents={true}
              swipeDistance={30}
              showPageCorners={true}
              disableFlipByClick={false}
              className=""
              style={{}}
              startPage={0}
              onFlip={(e: any) => setCurrentPage(e.data)}
              onInit={(e: any) => setTotalPages(e.object.getPageCount())}
            >
              {/* ── Cover left ── */}
              <Page>
                <div className="absolute inset-0 flex flex-col items-center justify-center px-10" style={{ backgroundColor: '#1c1712' }}>
                  {['top-4 left-4', 'top-4 right-4', 'bottom-4 left-4', 'bottom-4 right-4'].map((pos, i) => (
                    <div key={i} className={`absolute ${pos} w-5 h-5`} style={{ border: '1px solid rgba(184,149,90,0.4)', borderRadius: '1px' }} />
                  ))}
                  <div className="text-center">
                    <p className="font-display text-xs tracking-[0.4em] uppercase mb-6" style={{ color: 'var(--rose)', opacity: 0.7 }}>
                      a collection of memories
                    </p>
                    <h1 className="font-display font-light leading-tight" style={{ color: '#f5f0e8', fontSize: 'clamp(1.4rem, 3.5vw, 2.8rem)' }}>
                      {eventName}
                    </h1>
                    <div className="flex items-center justify-center gap-3 mt-6">
                      <div className="h-px w-12" style={{ backgroundColor: 'var(--gold)', opacity: 0.5 }} />
                      <div className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--gold)' }} />
                      <div className="h-px w-12" style={{ backgroundColor: 'var(--gold)', opacity: 0.5 }} />
                    </div>
                  </div>
                </div>
              </Page>

              {/* ── Photo pages (immediately after cover) ── */}
              {paddedPhotos.map((item, idx) => (
                <Page key={idx} pageNumber={idx + 1}>
                  {item ? (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ padding: '5%', backgroundColor: idx % 2 === 0 ? '#f5f0e8' : '#faf7f2' }}>
                      <div className="w-full h-full flex flex-col items-center justify-center" style={{ backgroundColor: 'white', padding: '4%', boxShadow: '0 2px 16px rgba(0,0,0,0.12)' }}>
                        <div className="flex-1 w-full overflow-hidden flex items-center justify-center" style={{ minHeight: 0 }}>
                          <PhotoPageContent item={item} active={true} />
                        </div>
                        {item.caption && (
                          <p className="font-display italic text-center mt-2 shrink-0" style={{ color: 'rgba(28,28,28,0.45)', fontSize: 'clamp(0.55rem, 1vw, 0.75rem)' }}>
                            {item.caption}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0" style={{ backgroundColor: '#faf7f2' }} />
                  )}
                </Page>
              ))}

              {/* ── Back cover (outside — hard cover) ── */}
              <Page>
                <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: '#1c1712' }}>
                  <p className="font-display italic" style={{ color: 'rgba(245,240,232,0.25)', fontSize: 'clamp(1rem, 2.5vw, 1.6rem)' }}>fin.</p>
                </div>
              </Page>

            </HTMLFlipBook>
          </div>

          <button
            onClick={goNext}
            disabled={isLastPage}
            className="shrink-0 transition-all duration-200"
            style={{ color: isLastPage ? 'transparent' : 'rgba(255,255,255,0.25)' }}
            onMouseEnter={e => { if (!isLastPage) e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}
            onMouseLeave={e => { e.currentTarget.style.color = isLastPage ? 'transparent' : 'rgba(255,255,255,0.25)' }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M12 6L22 16L12 26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-1.5 mt-6">
          {(() => {
            // 16 photos → 8 interior spreads, + front cover + back cover = 10 dots
            const lastPage = paddedPhotos.length + 1 // back cover page index
            const spreadCount = 1 + paddedPhotos.length / 2 + 1
            let activeSpread: number
            if (currentPage <= 0) activeSpread = 0
            else if (currentPage >= lastPage) activeSpread = spreadCount - 1
            else activeSpread = Math.floor((currentPage - 1) / 2) + 1

            return Array.from({ length: spreadCount }).map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: activeSpread === i ? '16px' : '4px',
                  height: '4px',
                  backgroundColor: activeSpread === i ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)',
                }}
              />
            ))
          })()}
        </div>
      </div>
    </>
  )
}