"use client"

import { FC } from 'react'
import { Key, Info, Trash2, RotateCcw, Loader2, Check, AlertCircle, ShieldCheck } from 'lucide-react'

interface KeySetupPanelProps {
  geminiKeyHelpUrl: string
  storedGeminiKey: string | null
  geminiKeyInput: string
  isValidatingKey: boolean
  geminiKeyStatus: 'idle' | 'success' | 'error'
  geminiKeyError: string | null
  onKeyInputChange: (value: string) => void
  onSaveKey: () => void
  onDeleteKey: () => void
  onClearWorkspace: () => void
}

const KeySetupPanel: FC<KeySetupPanelProps> = ({
  geminiKeyHelpUrl,
  storedGeminiKey,
  geminiKeyInput,
  isValidatingKey,
  geminiKeyStatus,
  geminiKeyError,
  onKeyInputChange,
  onSaveKey,
  onDeleteKey,
  onClearWorkspace
}) => (
  <section className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm mb-4">
    <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div className="flex gap-3">
        <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600/10 text-blue-600">
          <Key size={18} />
        </span>
        <div className="space-y-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Gemini setup</p>
            <h2 className="text-base font-semibold text-slate-900">Use your free Gemini key to tailor resumes to any job post</h2>
            <p className="mt-1 text-sm text-slate-600">
              BuiltIt maps your resume to specific job descriptions using Gemini. You keep full control—the key lives in your browser and powers
              conversions privately.
            </p>
          </div>
          <ol className="space-y-3 text-xs text-slate-600">
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-semibold">
                1
              </span>
              <div>
                <p className="font-semibold text-slate-800">Create a free Gemini project</p>
                <p>
                  Visit Google AI Studio, click the project dropdown, and choose <strong>+ New project</strong>. No payment method or billing profile
                  is required.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-semibold">
                2
              </span>
              <div>
                <p className="font-semibold text-slate-800">Generate your API key</p>
                <p>
                  With the project selected, open <strong>API keys → Create API key</strong>. Copy the key—Google gives you generous free-tier usage
                  each day for resume optimization.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-semibold">
                3
              </span>
              <div>
                <p className="font-semibold text-slate-800">Paste it here to unlock tailoring</p>
                <p>
                  Save the key below. Every optimization, rewrite, and comparison happens in your browser—nothing is logged on our servers.
                </p>
              </div>
            </li>
          </ol>
          <a
            href={geminiKeyHelpUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            <Info size={14} />
            Open Gemini instructions
          </a>
        </div>
      </div>
      <div className="flex items-center gap-3 self-start">
        {storedGeminiKey && (
          <button
            onClick={onDeleteKey}
            className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
          >
            <Trash2 size={14} />
            Delete saved key
          </button>
        )}
        <button
          onClick={onClearWorkspace}
          className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <RotateCcw size={14} />
          Clear workspace
        </button>
      </div>
    </header>

    <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center">
      <input
        type="password"
        value={geminiKeyInput}
        onChange={(event) => onKeyInputChange(event.target.value)}
        placeholder={storedGeminiKey ? 'Key saved locally. Paste a new key to update.' : 'Paste your Gemini API key…'}
        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
        spellCheck={false}
      />
      <button
        onClick={onSaveKey}
        disabled={isValidatingKey || !geminiKeyInput.trim()}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isValidatingKey && <Loader2 size={16} className="animate-spin" />}
        {storedGeminiKey ? 'Update key' : 'Save key'}
      </button>
    </div>

    <footer className="mt-3 flex flex-col gap-2 text-xs text-slate-600 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2 text-slate-600">
        <ShieldCheck size={14} className="text-blue-600" />
        <span>
          Key stays on this device. Clear it anytime or revoke it from AI Studio—BuiltIt never sees or stores it on a server.
        </span>
      </div>
      <div className="min-h-[20px] text-right md:text-left">
        {geminiKeyStatus === 'success' && (storedGeminiKey || geminiKeyInput) && (
          <p className="flex items-center gap-1 text-green-600">
            <Check size={14} />
            Key saved in your browser.
          </p>
        )}
        {geminiKeyStatus === 'error' && geminiKeyError && (
          <p className="flex items-center gap-1 text-red-600">
            <AlertCircle size={14} />
            {geminiKeyError}
          </p>
        )}
      </div>
    </footer>
  </section>
)

export default KeySetupPanel
