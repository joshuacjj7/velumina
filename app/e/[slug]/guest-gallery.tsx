'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type MediaItem = {
  id: string
  filename: string
  thumbnailFilename: string | null
  originalName: string
  blurDataUrl: string | null
  caption: string | null
  uploadedBy: string | null
  mediaType: string
  createdAt: Date
}

type Event = {
  id: string
  name: string
}

type PendingMedia = {
  file: File
  preview: string
  caption: string
  status: 'idle' | 'uploading' | 'done' | 'error'
  progress: number
}

export default function GuestGallery({
  event,
  initialMedia,
  initialHasMore,
}: {
  event: Event
  initialMedia: MediaItem[]
  initialHasMore: boolean
}) {
  const router = useRouter()
  const [media, setMedia] = useState(initialMedia)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loadingMore, setLoadingMore] = useState(false)
  const [cursor, setCursor] = useState<string | null>(
    initialMedia.length > 0
      ? initialMedia[initialMedia.length - 1].createdAt.toString()
      : null
  )
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [lightboxItem, setLightboxItem] = useState<MediaItem | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [uploadedBy, setUploadedBy] = useState('')
  const [pending, setPending] = useState<PendingMedia[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [visible, setVisible] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)


  async function loadMore() {
  if (loadingMore || !hasMore || !cursor) return
  setLoadingMore(true)
  try {
    const res = await fetch(`/api/events/${event.id}/media?cursor=${encodeURIComponent(cursor)}`)
    const data = await res.json()
    setMedia(prev => [...prev, ...data.media])
    setHasMore(data.hasMore)
    setCursor(data.nextCursor)
  } catch (err) {
    console.error('Failed to load more:', err)
  } finally {
    setLoadingMore(false)
  }
}
useEffect(() => {
  const sentinel = sentinelRef.current
  if (!sentinel) return

  const observer = new IntersectionObserver(
    entries => {
      if (entries[0].isIntersecting) loadMore()
    },
    { rootMargin: '200px' } // start loading 200px before reaching the bottom
  )

  observer.observe(sentinel)
  return () => observer.disconnect()
}, [hasMore, loadingMore, cursor])


function playVideoFullscreen(media: MediaItem) {
  // Create a temporary fullscreen video player
  const overlay = document.createElement('div')
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 9999;
    background: #000;
    display: flex; align-items: center; justify-content: center;
  `

  const video = document.createElement('video')
  video.src = `/api/photo/${media.filename}`
  video.controls = true
  video.autoplay = true
  video.playsInline = true
  video.style.cssText = 'max-width: 100%; max-height: 100vh; width: 100%;'

  const close = document.createElement('button')
  close.innerHTML = '✕'
  close.style.cssText = `
    position: absolute; top: 1rem; right: 1rem;
    color: white; background: rgba(255,255,255,0.15);
    border: none; border-radius: 50%;
    width: 2.5rem; height: 2.5rem;
    font-size: 1rem; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
  `

  close.onclick = () => {
    video.pause()
    document.body.removeChild(overlay)
  }

  overlay.appendChild(video)
  overlay.appendChild(close)
  document.body.appendChild(overlay)

  // Auto fullscreen on mobile
  const isMobile = window.innerWidth < 640
  if (isMobile) {
    video.addEventListener('canplay', () => {
      if ((video as any).webkitEnterFullscreen) {
        (video as any).webkitEnterFullscreen()
      } else if (video.requestFullscreen) {
        video.requestFullscreen()
      }
    }, { once: true })

    // Remove overlay when fullscreen exits on mobile
    video.addEventListener('webkitendfullscreen', () => {
      video.pause()
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay)
      }
    })

    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement && document.body.contains(overlay)) {
        video.pause()
        document.body.removeChild(overlay)
      }
    }, { once: true })
  }
}


  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

function addFiles(files: FileList | File[]) {
  setError('')
  const newPending: PendingMedia[] = []
  for (const file of Array.from(files)) {
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    if (!isImage && !isVideo) continue

    const maxSize = isVideo ? 500 * 1024 * 1024 : 20 * 1024 * 1024
    if (file.size > maxSize) {
      setError(`${file.name} exceeds the size limit and was skipped.`)
      continue
    }
    newPending.push({
      file,
      preview: URL.createObjectURL(file),
      caption: '',
      status: 'idle',
      progress: 0,
    })
  }
  setPending(prev => [...prev, ...newPending])
}

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) addFiles(e.target.files)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files)
  }

  function removeFile(index: number) {
    setPending(prev => prev.filter((_, i) => i !== index))
  }

  function updateCaption(index: number, caption: string) {
    setPending(prev => prev.map((p, i) => i === index ? { ...p, caption } : p))
  }

  function updateStatus(index: number, status: PendingMedia['status'], progress = 0) {
    setPending(prev => prev.map((p, i) => i === index ? { ...p, status, progress } : p))
  }

  async function uploadOne(item: PendingMedia, index: number): Promise<MediaItem | null> {
    updateStatus(index, 'uploading', 10)
    const formData = new FormData()
    formData.append('file', item.file)
    formData.append('eventId', event.id)
    formData.append('caption', item.caption)
    formData.append('uploadedBy', uploadedBy)

    try {
      // Simulate incremental progress
      const interval = setInterval(() => {
        setPending(prev => prev.map((p, i) =>
          i === index && p.progress < 85
            ? { ...p, progress: p.progress + 15 }
            : p
        ))
      }, 200)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      clearInterval(interval)

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      updateStatus(index, 'done', 100)
      return data.mediaItem
    } catch {
      updateStatus(index, 'error', 0)
      return null
    }
  }

  async function handleUploadAll() {
    if (pending.length === 0) return
    setUploading(true)

    const results = await Promise.all(
      pending.map((item, index) => uploadOne(item, index))
    )

    const uploaded = results.filter(Boolean) as MediaItem[]
    if (uploaded.length > 0) {
      setMedia(prev => [...uploaded.reverse(), ...prev])
      router.refresh()
    }

    setUploading(false)

    // Close modal after short delay if all succeeded
    const allDone = pending.every((_, i) => results[i] !== null)
    if (allDone) {
      setTimeout(() => {
        setShowUploadModal(false)
        setPending([])
        setUploadedBy('')
        setError('')
      }, 800)
    }
  }

  function closeModal() {
    if (uploading) return
    setShowUploadModal(false)
    setPending([])
    setUploadedBy('')
    setError('')
  }

  function openLightbox(mediaItem: MediaItem, index: number) {
    setLightboxItem(mediaItem)
    setLightboxIndex(index)
  }

function lightboxNext() {
  let i = (lightboxIndex + 1) % media.length
  while (media[i].mediaType === 'video' && i !== lightboxIndex) {
    i = (i + 1) % media.length
  }
  setLightboxIndex(i)
  setLightboxItem(media[i])
}

function lightboxPrev() {
  let i = (lightboxIndex - 1 + media.length) % media.length
  while (media[i].mediaType === 'video' && i !== lightboxIndex) {
    i = (i - 1 + media.length) % media.length
  }
  setLightboxIndex(i)
  setLightboxItem(media[i])
}
  const touchStartX = useRef<number>(0)

    function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    }

    function onTouchEnd(e: React.TouchEvent) {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) < 50) return // ignore small swipes
    if (diff > 0) lightboxNext()
    else lightboxPrev()
    }

  useEffect(() => {
  function onKey(e: KeyboardEvent) {
    if (!lightboxItem) return
    if (e.key === 'ArrowLeft') lightboxPrev()
    if (e.key === 'ArrowRight') lightboxNext()
    if (e.key === 'Escape') setLightboxItem(null)
  }
  window.addEventListener('keydown', onKey)
  return () => window.removeEventListener('keydown', onKey)
}, [lightboxItem, lightboxIndex])

  const allDone = pending.length > 0 && pending.every(p => p.status === 'done')
  const doneCount = pending.filter(p => p.status === 'done').length

  return (
    <div className="px-4 sm:px-8 pb-16 max-w-6xl mx-auto">
      {/* Upload CTA */}
      <div className="flex justify-center mb-10">
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn-primary group flex items-center gap-2 px-8 py-3 rounded-full text-sm font-sans font-medium"
        >
          <span className="text-lg leading-none">+</span>
          Add your photos
        </button>
      </div>

      {/* Empty state */}
      {media.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-display text-3xl font-light italic" style={{ color: 'var(--muted)' }}>
            No media yet
          </p>
          <p className="font-sans text-sm mt-2" style={{ color: 'var(--muted)' }}>
            Be the first to share a memory from this event.
          </p>
        </div>
      ) : (
        <div
          className="columns-2 sm:columns-3 lg:columns-4 gap-3"
          style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.6s ease',columnFill: 'balance', }}
        >
          {media.map((mediaItem, i) => (
            <div
              key={mediaItem.id}
              className="break-inside-avoid mb-3 rounded-2xl overflow-hidden cursor-pointer group relative"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(12px)',
                transition: `opacity 0.5s ease ${i * 40}ms, transform 0.5s ease ${i * 40}ms`,
                boxShadow: '0 2px 12px rgba(28,28,28,0.08)',
              }}
              onClick={() => {
                if (mediaItem.mediaType === 'video') {
                  playVideoFullscreen(mediaItem)
                } else {
                  openLightbox(mediaItem, i)
                }
              }}
            >
              {mediaItem.mediaType === 'video' ? (
                <>
                  <div
                    className="relative w-full overflow-hidden"
                    style={{ aspectRatio: '4/3' }}
                  >
                    {mediaItem.thumbnailFilename ? (
                      <img
                        src={`/api/photo/${mediaItem.thumbnailFilename}`}
                        alt={mediaItem.caption ?? mediaItem.originalName}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                    ) : (
                      <video
                        src={`/api/photo/${mediaItem.filename}`}
                        className="absolute inset-0 w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    )}
                    {/* Play icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center transition group-hover:scale-110 duration-200"
                        style={{ backgroundColor: 'rgba(28,28,28,0.55)', backdropFilter: 'blur(4px)' }}
                      >
                        <span className="text-white text-base ml-1">▶</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="relative w-full">
                  {/* Blur placeholder */}
                  {mediaItem.blurDataUrl && (
                    <img
                      src={mediaItem.blurDataUrl}
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover scale-110"
                      style={{ filter: 'blur(8px)' }}
                    />
                  )}
                  {/* Full image */}
                  <img
                    src={`/api/photo/${mediaItem.filename}`}
                    alt={mediaItem.caption ?? mediaItem.originalName}
                    className="relative w-full object-cover transition-all duration-700 group-hover:scale-[1.03]"
                    style={{ opacity: 0 }}
                    loading="lazy"
                    onLoad={e => {
                      (e.currentTarget as HTMLImageElement).style.opacity = '1'
                    }}
                  />
                </div>
              )}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3"
                style={{ background: 'linear-gradient(to top, rgba(28,28,28,0.6), transparent)' }}
              >
                {mediaItem.caption && <p className="font-display text-sm italic text-white">{mediaItem.caption}</p>}
                {mediaItem.uploadedBy && <p className="font-sans text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>— {mediaItem.uploadedBy}</p>}
              </div>
            </div>
          ))}
          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="col-span-full h-10 flex items-center justify-center">
            {loadingMore && (
              <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--rose)', borderTopColor: 'transparent' }} />
            )}
          </div>
        </div>
      )}

      {/* Upload modal */}
      {showUploadModal && (
        <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 touch-none"
        style={{ backgroundColor: 'rgba(28,28,28,0.7)', backdropFilter: 'blur(4px)' }}
        onClick={closeModal}
        >
        {/* Modal */}
        <div
        className="w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl flex flex-col touch-auto"
        style={{
            backgroundColor: 'var(--ivory)',
            height: '92dvh',
        }}
        onClick={e => e.stopPropagation()}
        >
            {/* Drag handle — mobile only */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
            <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'rgba(28,28,28,0.15)' }} />
            </div>

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 pt-4 pb-4 shrink-0">
            <div>
                <h2 className="font-display text-2xl font-light" style={{ color: 'var(--charcoal)' }}>
                Share your memories
                </h2>
                {pending.length > 0 && (
                  <p className="font-sans text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    {pending.length} item{pending.length !== 1 ? 's' : ''} selected
                    {uploading ? ` · ${doneCount} uploaded` : ''}
                  </p>
                )}
            </div>
            <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-full text-sm"
                style={{ color: 'var(--muted)', backgroundColor: 'rgba(28,28,28,0.06)' }}
            >
                ✕
            </button>
            </div>

            {/* Scrollable body */}
            <div
            style={{
                flex: '1 1 0',
                minHeight: 0,
                overflowY: 'scroll',
                WebkitOverflowScrolling: 'touch',
                padding: '0 1.5rem 1rem',
            }}
            >
            {/* Your name */}
            <input
                type="text"
                placeholder="Your name (optional — applies to all photos)"
                value={uploadedBy}
                onChange={e => setUploadedBy(e.target.value)}
                disabled={uploading}
                className="w-full px-4 py-2.5 rounded-xl text-sm font-sans text-gray-600 placeholder:text-gray-400 focus:outline-none mb-4"
                style={{
                backgroundColor: 'rgba(28,28,28,0.05)',
                border: '1px solid rgba(28,28,28,0.1)',
                }}
            />

            {/* Drop zone */}
            <div
                className="rounded-2xl border-2 border-dashed p-5 text-center cursor-pointer transition-all duration-200 mb-4"
                style={{
                borderColor: isDragging ? 'var(--rose)' : 'rgba(28,28,28,0.15)',
                backgroundColor: isDragging ? 'rgba(196,144,122,0.05)' : 'transparent',
                }}
                onClick={() => fileInputRef.current?.click()}
                onDrop={onDrop}
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
            >
                <p className="text-2xl mb-1">🖼️</p>
                <p className="font-sans text-sm font-medium" style={{ color: 'var(--charcoal)' }}>
                Drop photos and videos here or click to browse
                </p>
                <p className="font-sans text-xs mt-1" style={{ color: 'var(--muted)' }}>
                  Photos & videos · JPG, PNG, HEIC, MP4, MOV up to 500MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={onInputChange}
                />
            </div>

            {error && <p className="text-xs mb-3 px-1" style={{ color: '#C0392B' }}>{error}</p>}

            {/* Pending photos and videos list */}
            {pending.length > 0 && (
                <div className="flex flex-col gap-3">
                {pending.map((item, i) => (
                    <div
                    key={i}
                    className="flex gap-3 items-start rounded-xl p-3"
                    style={{ backgroundColor: 'white', border: '1px solid rgba(28,28,28,0.06)' }}
                    >
                    {/* Thumbnail */}
                    <div className="relative shrink-0 w-16 h-16 rounded-lg overflow-hidden">
                        <img src={item.preview} alt="" className="w-full h-full object-cover" />
                        {item.status === 'uploading' && (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(28,28,28,0.5)' }}>
                            <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        </div>
                        )}
                        {item.status === 'done' && (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(28,28,28,0.4)' }}>
                            <span className="text-white text-lg">✓</span>
                        </div>
                        )}
                        {item.status === 'error' && (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(192,57,43,0.5)' }}>
                            <span className="text-white text-lg">✕</span>
                        </div>
                        )}
                    </div>

                    {/* Caption */}
                    <div className="flex-1 min-w-0">
                        <p className="font-sans text-xs truncate mb-1.5" style={{ color: 'var(--muted)' }}>
                        {item.file.name}
                        </p>
                        <input
                        type="text"
                        placeholder="Add a caption (optional)"
                        value={item.caption}
                        onChange={e => updateCaption(i, e.target.value)}
                        disabled={item.status !== 'idle'}
                        className="w-full px-3 py-1.5 rounded-lg text-xs font-sans text-gray-600 placeholder:text-gray-400 focus:outline-none"
                        style={{
                            backgroundColor: 'rgba(28,28,28,0.04)',
                            border: '1px solid rgba(28,28,28,0.08)',
                        }}
                        />
                        {item.status === 'uploading' && (
                        <div className="mt-1.5 rounded-full overflow-hidden h-0.5" style={{ backgroundColor: 'rgba(28,28,28,0.1)' }}>
                            <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${item.progress}%`, backgroundColor: 'var(--rose)' }}
                            />
                        </div>
                        )}
                    </div>

                    {/* Remove */}
                    {item.status === 'idle' && (
                        <button
                        onClick={() => removeFile(i)}
                        className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs"
                        style={{ color: 'var(--muted)', backgroundColor: 'rgba(28,28,28,0.06)' }}
                        >
                        ✕
                        </button>
                    )}
                    </div>
                ))}
                </div>
            )}
            </div>

           {/* Footer — always visible at bottom */}
            <div
            className="px-6 pt-4 pb-6 flex gap-3 shrink-0"
            style={{
                borderTop: '1px solid rgba(28,28,28,0.08)',
                paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))',
            }}
            >
                <button
                    onClick={closeModal}
                    disabled={uploading}
                    className="flex-1 py-2.5 rounded-xl text-sm font-sans font-medium transition"
                    style={{ border: '1px solid rgba(28,28,28,0.15)', color: 'var(--muted)' }}
                >
                    Cancel
                </button>
                <button
                    onClick={handleUploadAll}
                    disabled={pending.length === 0 || uploading || allDone}
                    className="flex-1 py-2.5 rounded-xl text-sm font-sans font-medium transition"
                    style={{
                    backgroundColor: pending.length > 0 && !uploading && !allDone
                        ? 'var(--charcoal)'
                        : 'rgba(28,28,28,0.2)',
                    color: 'var(--ivory)',
                    }}
                >
                    {allDone
                      ? `✓ ${doneCount} uploaded`
                      : uploading
                      ? `Uploading ${doneCount}/${pending.length}…`
                      : `Upload ${pending.length > 0 ? pending.length : ''} item${pending.length !== 1 ? 's' : ''}`}
                </button>
            </div>
          </div>
        </div>
      )}

        {/* Lightbox */}
        {lightboxItem && (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(28,28,28,0.95)' }}
            onClick={() => setLightboxItem(null)}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            {/* Preload adjacent images */}
            <link rel="preload" as="image" href={`/api/photo/${media[(lightboxIndex - 1 + media.length) % media.length].filename}`} />
            <link rel="preload" as="image" href={`/api/photo/${media[(lightboxIndex + 1) % media.length].filename}`} />

            <button
            className="absolute left-4 sm:left-8 text-white/50 hover:text-white text-3xl z-10 transition"
            onClick={e => { e.stopPropagation(); lightboxPrev() }}
            >‹</button>

            <div className="max-w-4xl max-h-full px-4 sm:px-16" onClick={e => e.stopPropagation()}>
            {lightboxItem.mediaType === 'video' ? (
              <video
                ref={videoRef}
                src={`/api/photo/${lightboxItem.filename}`}
                className="max-h-[80vh] max-w-full rounded-2xl"
                controls
                autoPlay
                playsInline
                style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
                onCanPlay={() => {
                  const video = videoRef.current
                  if (!video) return
                  const isMobile = window.innerWidth < 640
                  if (!isMobile) return
                  if ((video as any).webkitEnterFullscreen) {
                    (video as any).webkitEnterFullscreen()
                  } else if (video.requestFullscreen) {
                    video.requestFullscreen()
                  }
                }}
              />
            ) : (
              <img
                key={lightboxItem.id}
                src={`/api/photo/${lightboxItem.filename}`}
                alt={lightboxItem.caption ?? lightboxItem.originalName}
                className="max-h-[80vh] max-w-full rounded-2xl object-contain"
                style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
              />
            )}
            {(lightboxItem.caption || lightboxItem.uploadedBy) && (
              <div className="text-center mt-4">
                {lightboxItem.caption && <p className="font-display text-lg italic text-white">{lightboxItem.caption}</p>}
                {lightboxItem.uploadedBy && <p className="font-sans text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>— {lightboxItem.uploadedBy}</p>}
              </div>
            )}
            <p className="text-center font-sans text-xs mt-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {lightboxIndex + 1} / {media.length}
            </p>
          </div>

            <button
            className="absolute right-4 sm:right-8 text-white/50 hover:text-white text-3xl z-10 transition"
            onClick={e => { e.stopPropagation(); lightboxNext() }}
            >›</button>

            <button
            className="absolute top-4 right-4 text-white/50 hover:text-white text-xl transition"
            onClick={() => setLightboxItem(null)}
            >✕</button>
        </div>
     )}
    </div>
  )
}