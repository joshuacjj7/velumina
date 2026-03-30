'use client'

import { useState, useEffect, useRef, useMemo, forwardRef } from 'react'
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
    <div
      ref={ref}
      className="relative w-full h-full overflow-hidden"
      style={{ backgroundColor: '#f5f0e8', willChange: 'transform' }}
    >
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

function FadeImg({ src, alt, className, style }: {
  src: string; alt: string; className?: string; style?: React.CSSProperties
}) {
  const [loaded, setLoaded] = useState(false)
  return (
    <img
      src={src} alt={alt} className={className}
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
    check()
    window.addEventListener('resize', check)
    window.screen.orientation?.addEventListener('change', check)
    return () => {
      window.removeEventListener('resize', check)
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
  onClose?: () => void
}) {
  const FLIP_DURATION = 700 // must match flippingTime prop

  const items = media
  const router = useRouter()
  const bookRef = useRef<any>(null)
  const [currentPage, setCurrentPage] = useState(0)
  // containerPage only updates AFTER the flip animation finishes
  // so the container expand/collapse never fights the page curl
  const [containerPage, setContainerPage] = useState(0)
  const [bookSize, setBookSize] = useState({ width: 500, height: 400 })

  const paddedPhotos = useMemo(() => {
    const arr: (MediaItem | null)[] = [...items]
    if (arr.length % 2 !== 0) arr.push(null)
    return arr
  }, [items])

  // Page layout:
  // 0      → front cover  (single page, right-aligned via showCover)
  // 1      → blank inside cover
  // 2      → "turn the page" instruction
  // 3..N   → photo pages
  // N+1    → back cover   (single page, left-aligned via showCover)
  const totalPageCount = 1 + 2 + paddedPhotos.length + 1
  const spreadCount = 1 + 1 + Math.ceil(paddedPhotos.length / 2) + 1
  const currentSpread = Math.min(Math.floor(currentPage / 2), spreadCount - 1)
  const isFirstPage = currentPage === 0
  const isLastPage = currentPage >= totalPageCount - 1

  // Container state driven by containerPage (post-flip)
  const isCoverState = containerPage === 0
  const isBackCoverState = containerPage >= totalPageCount - 1

  // Width: single page on cover/back-cover, double on spreads
  const containerWidth = (isCoverState || isBackCoverState)
    ? bookSize.width
    : bookSize.width * 2

  // Offset: slide left by one page-width on front cover so right half shows
  // Back cover: no offset, left half is already visible
  const containerTranslateX = isCoverState ? -bookSize.width : 0

  // Debounced responsive sizing
  useEffect(() => {
    function updateSize() {
      const w = Math.min(Math.floor(window.innerWidth * 0.42), 860)
      const h = Math.min(Math.floor(window.innerHeight * 0.72), 680)
      setBookSize({ width: w, height: h })
    }
    updateSize()
    let timer: ReturnType<typeof setTimeout>
    const debounced = () => { clearTimeout(timer); timer = setTimeout(updateSize, 200) }
    window.addEventListener('resize', debounced)
    return () => window.removeEventListener('resize', debounced)
  }, [])

  // Preload all images on mount
  useEffect(() => {
    items.forEach(item => {
      if (item.mediaType !== 'video') {
        const img = new Image()
        img.src = `/api/photo/${item.filename}`
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Safari fullscreen nudge
  useEffect(() => {
    document.documentElement.style.overflow = 'hidden'
    window.scrollTo(0, 1)
    return () => { document.documentElement.style.overflow = '' }
  }, [])

  function handleClose() {
    if (onClose) onClose()
    else if (backUrl) router.push(backUrl)
  }

  function goNext() { bookRef.current?.pageFlip()?.flipNext() }
  function goPrev() { bookRef.current?.pageFlip()?.flipPrev() }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <LandscapePrompt />

      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center select-none"
        style={{ backgroundColor: '#1a1510', height: '100dvh', paddingBottom: 'env(safe-area-inset-bottom)' }}
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

          {/*
           * OUTER: clips to the visible portion (single or double width)
           * INNER: positions the full flipbook, offset so correct half shows
           * Both animate AFTER flip completes (containerPage delayed by FLIP_DURATION)
           */}
          <div
            style={{
              overflow: 'hidden',
              flexShrink: 0,
              width: containerWidth,
              height: bookSize.height,
              transition: `width 0.5s cubic-bezier(0.645, 0.045, 0.355, 1.000)`,
              boxShadow: '0 60px 120px rgba(0,0,0,0.85), 0 20px 40px rgba(0,0,0,0.6)',
              borderRadius: '2px',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                transform: `translateX(${containerTranslateX}px)`,
                transition: `transform 0.5s cubic-bezier(0.645, 0.045, 0.355, 1.000)`,
              }}
            >
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
                flippingTime={FLIP_DURATION}
                usePortrait={false}
                startZIndex={10}
                autoSize={false}
                maxShadowOpacity={0.5}
                showCover={true}
                mobileScrollSupport={false}
                clickEventForward={false}
                useMouseEvents={true}
                swipeDistance={30}
                showPageCorners={true}
                disableFlipByClick={false}
                className=""
                style={{}}
                startPage={0}
                onFlip={(e: any) => {
                  const page = e.data
                  // Update immediately for arrows/dots
                  setCurrentPage(page)
                  // Update container AFTER flip finishes so animations don't clash
                  setTimeout(() => setContainerPage(page), FLIP_DURATION)
                }}
              >
                {/* ── Front cover (page 0) ── */}
                <Page>
                  <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ backgroundColor: '#1c1712' }}>
                    {['top-4 left-4', 'top-4 right-4', 'bottom-4 left-4', 'bottom-4 right-4'].map((pos, i) => (
                      <div key={i} className={`absolute ${pos} w-8 h-8`} style={{ border: '1px solid rgba(184,149,90,0.35)', borderRadius: '1px' }} />
                    ))}
                    <div className="flex items-center gap-3 mb-8">
                      <div className="h-px w-16" style={{ backgroundColor: 'rgba(184,149,90,0.4)' }} />
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'rgba(184,149,90,0.6)' }} />
                      <div className="h-px w-16" style={{ backgroundColor: 'rgba(184,149,90,0.4)' }} />
                    </div>
                    <div className="text-center px-10">
                      <p
                        className="font-display font-light tracking-[0.35em] uppercase"
                        style={{ color: 'rgba(245,240,232,0.5)', fontSize: 'clamp(0.55rem, 1vw, 0.75rem)' }}
                      >
                        the proposal of
                      </p>
                      <h1
                        className="font-display font-light mt-3 leading-snug"
                        style={{ color: '#f5f0e8', fontSize: 'clamp(2rem, 4.5vw, 3.6rem)' }}
                      >
                        Joshua
                      </h1>
                      <p
                        className="font-display italic mt-1 mb-1"
                        style={{ color: 'rgba(184,149,90,0.7)', fontSize: 'clamp(0.9rem, 1.8vw, 1.4rem)' }}
                      >
                        &amp;
                      </p>
                      <h1
                        className="font-display font-light leading-snug"
                        style={{ color: '#f5f0e8', fontSize: 'clamp(2rem, 4.5vw, 3.6rem)' }}
                      >
                        Chai
                      </h1>
                    </div>
                    <div className="flex items-center gap-3 mt-8">
                      <div className="h-px w-16" style={{ backgroundColor: 'rgba(184,149,90,0.4)' }} />
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'rgba(184,149,90,0.6)' }} />
                      <div className="h-px w-16" style={{ backgroundColor: 'rgba(184,149,90,0.4)' }} />
                    </div>
                    <p
                      className="font-display italic mt-6"
                      style={{ color: 'rgba(245,240,232,0.25)', fontSize: 'clamp(0.6rem, 1.1vw, 0.85rem)', letterSpacing: '0.1em' }}
                    >
                      a moment captured forever
                    </p>
                  </div>
                </Page>

                {/* ── Blank inside cover (page 1) ── */}
                <Page>
                  <div className="absolute inset-0" style={{ backgroundColor: '#f5f0e8' }} />
                </Page>

                {/* ── Turn the page instruction (page 2) ── */}
                <Page>
                  <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ backgroundColor: '#faf7f2' }}>
                    <p className="font-display italic" style={{ color: 'var(--muted)', fontSize: 'clamp(0.9rem, 2vw, 1.3rem)' }}>
                      Turn the page to begin
                    </p>
                    <p className="font-sans mt-3" style={{ color: 'var(--muted)', opacity: 0.4, fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                      {items.length} photograph{items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </Page>

                {/* ── Photo pages (start at page 3) ── */}
                {paddedPhotos.map((item, idx) => (
                  <Page key={idx} pageNumber={idx + 1}>
                    {item ? (
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ padding: '5%', backgroundColor: idx % 2 === 0 ? '#f5f0e8' : '#faf7f2' }}
                      >
                        <div
                          className="w-full h-full flex flex-col items-center justify-center"
                          style={{ backgroundColor: 'white', padding: '4%', boxShadow: '0 2px 16px rgba(0,0,0,0.12)' }}
                        >
                          <div className="flex-1 w-full overflow-hidden flex items-center justify-center" style={{ minHeight: 0 }}>
                            <PhotoPageContent item={item} active={currentPage === idx + 3} />
                          </div>
                          {item.caption && (
                            <p
                              className="font-display italic text-center mt-2 shrink-0"
                              style={{ color: 'rgba(28,28,28,0.45)', fontSize: 'clamp(0.55rem, 1vw, 0.75rem)' }}
                            >
                              {item.caption}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: '#faf7f2' }}>
                        <p className="font-display italic text-2xl" style={{ color: 'rgba(28,28,28,0.1)' }}>fin.</p>
                      </div>
                    )}
                  </Page>
                ))}

                {/* ── Back cover (last page) ── */}
                <Page>
                  <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: '#1c1712' }}>
                    <p className="font-display italic" style={{ color: 'rgba(245,240,232,0.25)', fontSize: 'clamp(1rem, 2.5vw, 1.6rem)' }}>fin.</p>
                  </div>
                </Page>

              </HTMLFlipBook>
            </div>
          </div>

          {/* Next arrow */}
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

        {/* Spread indicator dots */}
        <div className="flex items-center gap-1.5 mt-6">
          {Array.from({ length: spreadCount }).map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: currentSpread === i ? '16px' : '4px',
                height: '4px',
                backgroundColor: currentSpread === i ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </div>
      </div>
    </>
  )
}