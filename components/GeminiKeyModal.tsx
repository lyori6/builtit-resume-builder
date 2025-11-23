"use client"

import { FC, useEffect, useRef, useState } from 'react'
import { X, ExternalLink, Loader2, KeyRound, Zap, Lock, DollarSign, ChevronDown } from 'lucide-react'
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

  const handleClose = () => {
    if (!requireKey) {
      onClose()
    }
  }

  const handleBackdropClick = () => {
    handleClose()
  }

  if (!isOpen) {
    return null
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Gemini API key setup panel"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning-light text-warning">
                <KeyRound size={26} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Gemini API Key</h2>
                <p className="text-sm text-neutral-500">Two-minute setup, free forever</p>
              </div>
            </div>
            {!requireKey && (
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-700"
                aria-label="Close API key panel"
              >
                <X size={20} />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {stage === 'info' ? (
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-sm text-neutral-600">
                    This tool runs in your browser and uses your own free Google Gemini API key. Nothing is uploaded to a server.
                  </p>
                  <div className="grid gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-warning-light text-warning">
                        <Zap size={18} />
                      </span>
                      <div>
                        <p className="font-semibold text-neutral-900">2 minute setup</p>
                        <p>Copy + paste from Google AI Studio.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-success-light text-success">
                        <Lock size={18} />
                      </span>
                      <div>
                        <p className="font-semibold text-neutral-900">Private</p>
                        <p>Key is stored locally — never leaves this browser.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light text-primary">
                        <DollarSign size={18} />
                      </span>
                      <div>
                        <p className="font-semibold text-neutral-900">Free tier</p>
                        <p>Google covers typical resume usage.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleOpenKeySite}
                    className="w-full rounded-lg bg-primary px-6 py-3 text-base font-semibold text-white transition hover:bg-primary-hover"
                  >
                    Get Free API Key →
                  </button>
                  <button
                    type="button"
                    onClick={() => setStage('input')}
                    className="w-full rounded-lg border-2 border-neutral-200 px-6 py-3 text-base font-semibold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50"
                  >
                    I already have a key
                  </button>
                </div>

                <div className="rounded-lg border border-neutral-200">
                  <button
                    type="button"
                    onClick={() => setHelpOpen((value) => !value)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-neutral-800"
                  >
                    <span>Show me how</span>
                    <ChevronDown className={`transition ${helpOpen ? 'rotate-180' : ''}`} size={18} />
                  </button>
                  {helpOpen && (
                    <div className="border-t border-neutral-200 px-4 py-4 text-sm text-neutral-600">
                      <ol className="list-decimal space-y-3 pl-4">
                        <li>
                          Open{' '}
                          <a
                            href={geminiKeyHelpUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-primary underline-offset-4 hover:underline"
                          >
                            aistudio.google.com/apikey
                          </a>{' '}
                          (requires Google account)
                        </li>
                        <li>Click “Create API key” and copy the value Google shows.</li>
                        <li>
                          Paste it here.{' '}
                          <button
                            type="button"
                            onClick={() => setStage('input')}
                            className="font-semibold text-primary underline-offset-4 hover:underline"
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
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-neutral-900">Paste your API key</h3>
                  <p className="text-sm text-neutral-600">Stored securely in your browser so optimizations stay private.</p>
                </div>
                <div className="space-y-2">
                  <input
                    ref={inputRef}
                    id="gemini-key-modal"
                    type="text"
                    value={geminiKeyInput}
                    onChange={(event) => onInputChange(event.target.value)}
                    placeholder="Paste your Gemini API key (starts with AIza...)"
                    className={`w-full rounded-lg border-2 px-4 py-3 text-sm font-mono focus:outline-none focus:ring-4 focus:ring-primary/15 ${
                      showInlineFormatError ? 'border-accent' : 'border-neutral-200 focus:border-primary'
                    }`}
                    spellCheck={false}
                  />
                  {showInlineFormatError && (
                    <p className="text-xs font-medium text-accent">Invalid key format. Should start with “AIza” and be 39 characters.</p>
                  )}
                  {status === 'error' && error && <p className="text-xs font-medium text-accent">{error}</p>}
                  <p className="text-xs text-neutral-500">🔒 Stored locally, never shared.</p>
                </div>
                <button
                  type="submit"
                  disabled={isSaving || !isFormatValid}
                  className="w-full rounded-lg bg-primary px-6 py-3 text-base font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={18} className="animate-spin" /> Saving…
                    </span>
                  ) : (
                    'Save & continue'
                  )}
                </button>
                <div className="flex flex-wrap items-center gap-3 text-sm text-primary">
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
                    <ExternalLink size={14} />
                    Lost your key? Get a new one
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}

export default GeminiKeyModal
