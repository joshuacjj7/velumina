'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

type MediaItem = {
  id: string
  filename: string
  thumbnailFilename: string | null
  originalName: string
  caption: string | null
  uploadedBy: string | null
  mediaType: string
  createdAt: Date
}

export default function AdminMediaGrid({
  eventId,
  initialMedia,
}: {
  eventId: string
  initialMedia: MediaItem[]
}) {
  const router = useRouter()
  const [media, setMedia] = useState(initialMedia)
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [lightboxItem, setLightboxItem] = useState<MediaItem | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const touchStartX = useRef<number>(0)

  const photoItems = media.filter(m => m.mediaType !== 'video')

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === media.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(media.map(m => m.id)))
    }
  }

  function exitSelectMode() {
    setSelectMode(false)
    setSelected(new Set())
  }

  function handleItemClick(item: MediaItem) {
    if (selectMode) {
      toggleSelect(item.id)
      return
    }
    if (item.mediaType === 'video') {
      playVideoFullscreen(item)
    } else {
      const photoIndex = photoItems.findIndex(p => p.id === item.id)
      setLightboxIndex(photoIndex)
      setLightboxItem(item)
    }
  }

  async function deleteSelected() {
    if (selected.size === 0) return
    setDeleting(true)
    try {
      await Promise.all(
        Array.from(selected).map(id =>
          fetch('/api/admin/media', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, eventId }),
          })
        )
      )
      setMedia(prev => prev.filter(m => !selected.has(m.id)))
      setSelected(new Set())
      setSelectMode(false)
      router.refresh()
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setDeleting(false)
    }
  }

  function playVideoFullscreen(item: MediaItem) {
    const overlay = document.createElement('div')
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 9999;
      background: #000;
      display: flex; align-items: center; justify-content: center;
    `
    const video = document.createElement('video')
    video.src = `/api/photo/${item.filename}`
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
    `
    close.onclick = () => { video.pause(); document.body.removeChild(overlay) }
    overlay.appendChild(video)
    overlay.appendChild(close)
    document.body.appendChild(overlay)

    const isMobile = window.innerWidth < 640
    if (isMobile) {
      video.addEventListener('canplay', () => {
        if ((video as any).webkitEnterFullscreen) {
          (video as any).webkitEnterFullscreen()
        } else if (video.requestFullscreen) {
          video.requestFullscreen()
        }
      }, { once: true })
      video.addEventListener('webkitendfullscreen', () => {
        video.pause()
        if (document.body.contains(overlay)) document.body.removeChild(overlay)
      })
    }
  }

  function lightboxNext() {
    const i = (lightboxIndex + 1) % photoItems.length
    setLightboxIndex(i)
    setLightboxItem(photoItems[i])
  }

  function lightboxPrev() {
    const i = (lightboxIndex - 1 + photoItems.length) % photoItems.length
    setLightboxIndex(i)
    setLightboxItem(photoItems[i])
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function onTouchEnd(e: React.TouchEvent) {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) < 50) return
    diff > 0 ? lightboxNext() : lightboxPrev()
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

  if (media.length === 0) {
    return <p className="text-sm text-neutral-400">No media uploaded yet.</p>
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-neutral-500">
          {media.length} item{media.length !== 1 ? 's' : ''}
          {selectMode && selected.size > 0 && ` · ${selected.size} selected`}
        </span>
        <div className="flex items-center gap-2">
          {selectMode ? (
            <>
              <button
                onClick={toggleSelectAll}
                className="text-xs px-3 py-1.5 rounded-full border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition"
              >
                {selected.size === media.length ? 'Deselect all' : 'Select all'}
              </button>
              {selected.size > 0 && (
                <button
                  onClick={deleteSelected}
                  disabled={deleting}
                  className="text-xs px-3 py-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition disabled:opacity-50"
                >
                  {deleting ? 'Deleting…' : `Delete ${selected.size}`}
                </button>
              )}
              <button
                onClick={exitSelectMode}
                className="text-xs px-3 py-1.5 rounded-full border border-neutral-200 text-neutral-500 hover:bg-neutral-50 transition"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setSelectMode(true)}
              className="text-xs px-3 py-1.5 rounded-full border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition"
            >
              Select
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-3">
        {media.map((item) => {
          const isSelected = selected.has(item.id)
          return (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              className="relative group rounded-lg overflow-hidden aspect-square bg-neutral-100 cursor-pointer"
              style={{
                outline: isSelected ? '2.5px solid #ef4444' : 'none',
                outlineOffset: '-2.5px',
              }}
            >
              {item.mediaType === 'video' ? (
                <>
                  {item.thumbnailFilename ? (
                    <img
                      src={`/api/photo/${item.thumbnailFilename}`}
                      alt={item.caption ?? item.originalName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-200">
                      <span className="text-2xl">🎬</span>
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                    >
                      <span className="text-white text-xs ml-0.5">▶</span>
                    </div>
                  </div>
                </>
              ) : (
                <img
                  src={`/api/photo/${item.filename}`}
                  alt={item.caption ?? item.originalName}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                />
              )}

              {!selectMode && (
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              )}

              {item.caption && !selectMode && (
                <p className="absolute bottom-0 left-0 right-0 text-xs text-white bg-black/40 px-2 py-1 truncate opacity-0 group-hover:opacity-100 transition">
                  {item.caption}
                </p>
              )}

              {selectMode && (
                <div className="absolute top-2 left-2">
                  <div
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition"
                    style={{
                      backgroundColor: isSelected ? '#ef4444' : 'rgba(255,255,255,0.85)',
                      borderColor: isSelected ? '#ef4444' : 'rgba(255,255,255,0.9)',
                    }}
                  >
                    {isSelected && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
              )}

              {item.uploadedBy && !selectMode && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                  <span className="text-xs bg-black/50 text-white px-2 py-0.5 rounded-full">
                    {item.uploadedBy}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Lightbox */}
      {lightboxItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(28,28,28,0.95)' }}
          onClick={() => setLightboxItem(null)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <button
            className="absolute left-4 sm:left-8 text-white/50 hover:text-white text-3xl z-10 transition"
            onClick={e => { e.stopPropagation(); lightboxPrev() }}
          >‹</button>

          <div className="max-w-4xl max-h-full px-4 sm:px-16" onClick={e => e.stopPropagation()}>
            <img
              key={lightboxItem.id}
              src={`/api/photo/${lightboxItem.filename}`}
              alt={lightboxItem.caption ?? lightboxItem.originalName}
              className="max-h-[80vh] max-w-full rounded-2xl object-contain"
              style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
            />
            {(lightboxItem.caption || lightboxItem.uploadedBy) && (
              <div className="text-center mt-4">
                {lightboxItem.caption && (
                  <p className="font-display text-lg italic text-white">{lightboxItem.caption}</p>
                )}
                {lightboxItem.uploadedBy && (
                  <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    — {lightboxItem.uploadedBy}
                  </p>
                )}
              </div>
            )}
            <p className="text-center text-xs mt-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {lightboxIndex + 1} / {photoItems.length}
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
    </>
  )
}