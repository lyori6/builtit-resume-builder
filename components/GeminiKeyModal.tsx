"use client"

import { FC, useEffect, useRef } from 'react'
import { X, Sparkles, ExternalLink, Loader2 } from 'lucide-react'

interface GeminiKeyModalProps {
  isOpen: boolean
  onClose: () => void
  geminiKeyInput: string
  onInputChange: (value: string) => void
  onSave: () => Promise<boolean>
  isSaving: boolean
  status: 'idle' | 'success' | 'error'
  error: string | null
  geminiKeyHelpUrl: string
  instructionsUrl: string
}

const GeminiKeyModal: FC<GeminiKeyModalProps> = ({
  isOpen,
  onClose,
  geminiKeyInput,
  onInputChange,
  onSave,
  isSaving,
  status,
  error,
  geminiKeyHelpUrl,
  instructionsUrl
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const success = await onSave()
    if (!success && inputRef.current) {
      inputRef.current.focus()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 transition hover:text-slate-700"
          aria-label="Close Gemini key prompt"
        >
          <X size={20} />
        </button>
        <div className="space-y-6 px-8 py-10">
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg shadow-purple-500/30">
              <Sparkles size={24} />
            </span>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">Add your Gemini API key</h2>
              <p className="text-sm text-slate-600">
                Store the key locally so this resume optimizer can convert text and tailor content without leaving your browser.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2 text-left">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="gemini-key-modal">
                Gemini API key
              </label>
              <input
                ref={inputRef}
                id="gemini-key-modal"
                type="password"
                value={geminiKeyInput}
                onChange={(event) => onInputChange(event.target.value)}
                placeholder="Paste your key from Google AI Studio"
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                spellCheck={false}
              />
              {status === 'error' && error && (
                <p className="text-xs font-medium text-red-600">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSaving || !geminiKeyInput.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Save key
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            >
              I’ll add it later
            </button>
          </form>

          <div className="flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-center">
            <a
              href={geminiKeyHelpUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-4 py-2 font-semibold text-purple-700 transition hover:border-purple-300 hover:text-purple-800"
            >
              <ExternalLink size={16} /> Get a free key
            </a>
            <a
              href={instructionsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              <ExternalLink size={16} /> View instructions
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GeminiKeyModal
