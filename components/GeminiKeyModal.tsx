"use client"

import { FC, useEffect, useRef, useState } from 'react'
import { X, ExternalLink, Loader2 } from 'lucide-react'
import { useOptimizerContext } from '@/src/state/optimizer-context'

interface GeminiKeyModalProps {
  isOpen: boolean
  onClose: () => void
  geminiKeyInput: string
  onInputChange: (value: string) => void
  onSave: () => Promise<boolean>
  geminiKeyHelpUrl: string
  requireKey?: boolean
}

const GeminiKeyModal: FC<GeminiKeyModalProps> = ({
  isOpen,
  onClose,
  geminiKeyInput,
  onInputChange,
  onSave,
  geminiKeyHelpUrl,
  requireKey = false
}) => {
  const {
    state: { apiKey }
  } = useOptimizerContext()

  const rawStatus = apiKey.status
  const status: 'idle' | 'success' | 'error' = rawStatus === 'error' ? 'error' : rawStatus === 'saved' ? 'success' : 'idle'
  const isSaving = rawStatus === 'validating'
  const error = apiKey.errorMessage
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [stage, setStage] = useState<'info' | 'input'>('info')
  const [helpOpen, setHelpOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setStage('info')
      setHelpOpen(false)
    }
  }, [isOpen, requireKey])

  useEffect(() => {
    if (isOpen && stage === 'input' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, stage])

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

  const geminiKeyTrimmed = geminiKeyInput.trim()
  const isFormatValid = /^AIza[A-Za-z0-9_\-]{35}$/.test(geminiKeyTrimmed)
  const showInlineFormatError = geminiKeyTrimmed.length > 0 && !isFormatValid

  const handleOpenKeySite = () => {
    if (geminiKeyHelpUrl) {
      window.open(geminiKeyHelpUrl, '_blank', 'noopener')
    }
    setStage('input')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-[18px] border border-slate-200 bg-white shadow-[0_25px_50px_rgba(15,23,42,0.25)]">
        {!requireKey && (
          <button
            onClick={onClose}
            className="absolute right-5 top-5 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:text-slate-600"
            aria-label="Close Gemini key prompt"
          >
            <X size={20} />
          </button>
        )}
        <div className="px-10 py-12 text-center">
          <div className="flex justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-3xl shadow-lg shadow-blue-500/30">
              {stage === 'info' ? '🔑' : '⚡'}
            </span>
          </div>
          {stage === 'info' ? (
            <div className="mt-6 space-y-6">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900">Quick Setup: Get Your Free API Key</h2>
                <p className="mx-auto max-w-md text-base text-slate-600">
                  This tool uses your free Google Gemini API key to optimize resumes privately in your browser.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium text-slate-500">
                  <span>⚡ 2 minutes</span>
                  <span>•</span>
                  <span>🔒 Private</span>
                  <span>•</span>
                  <span>💰 Free</span>
                </div>
              </div>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleOpenKeySite}
                  className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  Get Free API Key
                </button>
                <button
                  type="button"
                  onClick={() => setStage('input')}
                  className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  I already have a key
                </button>
              </div>
              <div className="space-y-2 text-sm text-slate-500">
                <p>🔒 Private: Never leaves your browser</p>
              </div>
              <div className="text-sm">
                <button
                  type="button"
                  onClick={() => setHelpOpen((value) => !value)}
                  className="font-semibold text-blue-600 underline-offset-4 hover:underline"
                >
                  {helpOpen ? '▲ Hide steps' : '▼ Show me how'}
                </button>
                {helpOpen && (
                  <div className="mt-4 space-y-3 text-left text-sm text-slate-600">
                    <p className="font-semibold text-slate-800">Getting Your Free API Key:</p>
                    <ol className="space-y-3">
                      <li>
                        1. Open{' '}
                        <a
                          href={geminiKeyHelpUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-blue-600 underline-offset-4 hover:underline"
                        >
                          aistudio.google.com/apikey
                        </a>
                      </li>
                      <li>2. Sign in with Google and click “Create API key”.</li>
                      <li>
                        3. Copy the key and paste it back here.{' '}
                        <button
                          type="button"
                          onClick={() => setStage('input')}
                          className="font-semibold text-blue-600 underline-offset-4 hover:underline"
                        >
                          I have my key →
                        </button>
                      </li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-6 text-left">
              <div className="space-y-2 text-center">
                <h2 className="text-2xl font-bold text-slate-900">Paste Your API Key</h2>
                <p className="text-sm text-slate-600">Store it locally so tailoring can run right in this browser.</p>
              </div>
              <div className="space-y-2">
                <input
                  ref={inputRef}
                  id="gemini-key-modal"
                  type="text"
                  value={geminiKeyInput}
                  onChange={(event) => onInputChange(event.target.value)}
                  placeholder="Paste your Gemini API key (starts with AIza...)"
                  className={`w-full rounded-lg border-2 px-4 py-3 text-sm font-mono focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                    showInlineFormatError ? 'border-red-500' : 'border-slate-200 focus:border-blue-500'
                  }`}
                  spellCheck={false}
                />
                {showInlineFormatError && (
                  <p className="text-xs font-medium text-red-600">
                    Invalid key format. Should start with “AIza” and be 39 characters.
                  </p>
                )}
                {status === 'error' && error && (
                  <p className="text-xs font-medium text-red-600">{error}</p>
                )}
                <p className="text-xs text-slate-500">🔒 Stored locally, never shared.</p>
              </div>
              <button
                type="submit"
                disabled={isSaving || !isFormatValid}
                className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Saving…
                  </>
                ) : (
                  'Save & Continue'
                )}
              </button>
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-blue-600">
                <button
                  type="button"
                  onClick={() => setStage('info')}
                  className="font-semibold underline-offset-4 hover:underline"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleOpenKeySite}
                  className="inline-flex items-center gap-1 font-semibold underline-offset-4 hover:underline"
                >
                  <ExternalLink size={14} /> Lost your key? Get a new one
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default GeminiKeyModal
