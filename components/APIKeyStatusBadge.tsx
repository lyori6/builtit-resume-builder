"use client"

import { FC } from 'react'
import { AlertTriangle, CheckCircle2, KeyRound } from 'lucide-react'

type StatusVariant = 'ready' | 'missing' | 'error'

interface APIKeyStatusBadgeProps {
  status: StatusVariant
  onClick: () => void
  message?: string | null
}

const variantStyles: Record<StatusVariant, string> = {
  ready: 'border-success/30 bg-success-light text-success hover:bg-success-light/80 hover:border-success/40',
  missing: 'border-warning/30 bg-warning-light text-warning hover:bg-warning-light/80 hover:border-warning/40',
  error: 'border-accent/30 bg-accent-light text-accent hover:bg-accent-light/80 hover:border-accent/40'
}

const helperTone: Record<StatusVariant, string> = {
  ready: 'text-success/80',
  missing: 'text-warning/80',
  error: 'text-accent/80'
}

const variantCopy: Record<StatusVariant, { label: string; helper: string; Icon: typeof KeyRound }> = {
  ready: {
    label: 'Gemini Connected',
    helper: 'Key stored locally',
    Icon: CheckCircle2
  },
  missing: {
    label: 'Gemini Key Needed',
    helper: 'Tap to add key',
    Icon: KeyRound
  },
  error: {
    label: 'Check API Key',
    helper: 'Tap to update key',
    Icon: AlertTriangle
  }
}

const APIKeyStatusBadge: FC<APIKeyStatusBadgeProps> = ({ status, onClick, message }) => {
  const copy = variantCopy[status]
  const Icon = copy.Icon
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex w-full max-w-[260px] items-center gap-3 rounded-full border px-4 py-2 text-left text-sm font-semibold shadow-lg shadow-black/10 transition focus:outline-none focus:ring-4 focus:ring-black/5 ${variantStyles[status]}`}
    >
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/80 text-inherit shadow">
        <Icon size={18} className={status === 'missing' ? 'animate-pulse' : ''} />
      </span>
      <span className="flex flex-col">
        <span>{copy.label}</span>
        <span className={`text-xs font-medium ${helperTone[status]}`}>
          {message || copy.helper}
        </span>
      </span>
    </button>
  )
}

export default APIKeyStatusBadge
