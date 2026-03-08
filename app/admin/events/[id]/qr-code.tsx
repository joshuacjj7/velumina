'use client'

import { QRCodeSVG } from 'qrcode.react'
import { useRef } from 'react'

export default function QRCode({ url }: { url: string }) {
  const ref = useRef<SVGSVGElement>(null)

  function download() {
    if (!ref.current) return
    const svg = ref.current.outerHTML
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'velumina-qr.svg'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="p-4 rounded-2xl bg-white" style={{ boxShadow: '0 2px 12px rgba(28,28,28,0.08)' }}>
        <QRCodeSVG
          ref={ref}
          value={url}
          size={200}
          className="block"
          bgColor="transparent"
        />
      </div>
      <button
        onClick={download}
        className="font-sans text-xs px-4 py-2 rounded-full transition"
        style={{ border: '1px solid rgba(28,28,28,0.15)', color: 'var(--muted)' }}
      >
        Download QR code
      </button>
    </div>
  )
}