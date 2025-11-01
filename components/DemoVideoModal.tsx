"use client"

import { FC, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'

interface DemoVideoModalProps {
  isOpen: boolean
  onClose: () => void
  videoUrl: string
  title?: string
}

const DemoVideoModal: FC<DemoVideoModalProps> = ({ isOpen, onClose, videoUrl, title = 'Resume Optimizer Demo' }) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, isOpen])

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200/80 bg-black shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white/60"
          aria-label="Close demo video"
        >
          <X size={20} />
        </button>
        <div className="aspect-video w-full">
          <iframe
            key={videoUrl}
            src={`${videoUrl}?rel=0&autoplay=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={title}
            className="h-full w-full"
          />
        </div>
      </div>
      <button
        onClick={onClose}
        className="absolute inset-0 cursor-default"
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  )
}

export default DemoVideoModal
