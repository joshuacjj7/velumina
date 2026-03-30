'use client'

import { QRCodeCanvas } from 'qrcode.react'
import { useRef, useEffect, useState } from 'react'

export default function QRCode({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [imgSrc, setImgSrc] = useState<string | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    // Wait a frame for qrcode.react to finish rendering
    requestAnimationFrame(() => {
      setImgSrc(canvas.toDataURL('image/png'))
    })
  }, [url])

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Hidden canvas used by qrcode.react to generate the image */}
      <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}>
        <QRCodeCanvas
          ref={canvasRef}
          value={url}
          size={800}
          bgColor="#ffffff"
        />
      </div>

      {/* Visible image — long-press to save on mobile */}
      {imgSrc && (
        <div className="p-4 rounded-2xl bg-white" style={{ boxShadow: '0 2px 12px rgba(28,28,28,0.08)' }}>
          <img
            src={imgSrc}
            alt="QR code"
            width={200}
            height={200}
            className="block"
          />
        </div>
      )}
    </div>
  )
}
