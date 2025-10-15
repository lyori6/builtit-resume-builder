"use client"

import { FC } from 'react'
import { Key, Info, Trash2, RotateCcw, Loader2, Check, AlertCircle } from 'lucide-react'

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
  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <Key size={18} className="text-blue-600" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Connect your Gemini API key</h2>
          <p className="text-xs text-gray-600">
            Use Google’s free Gemini API key to optimize your resume locally. We save it in your browser only—you can remove it anytime.
          </p>
          <a
            href={geminiKeyHelpUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-2"
          >
            <Info size={14} />
            How to get a free Gemini API key
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
          className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <RotateCcw size={14} />
          Clear workspace
        </button>
      </div>
    </div>

    <div className="mt-4 flex flex-col md:flex-row md:items-center gap-3">
      <input
        type="password"
        value={geminiKeyInput}
        onChange={(event) => onKeyInputChange(event.target.value)}
        placeholder={storedGeminiKey ? 'Key saved locally. Paste a new key to update.' : 'Paste your Gemini API key...'}
        className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        spellCheck={false}
      />
      <button
        onClick={onSaveKey}
        disabled={isValidatingKey || !geminiKeyInput.trim()}
        className="inline-flex items-center justify-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isValidatingKey && <Loader2 size={16} className="animate-spin" />}
        {storedGeminiKey ? 'Update key' : 'Save key'}
      </button>
    </div>

    <div className="mt-2 min-h-[20px]">
      {geminiKeyStatus === 'success' && storedGeminiKey && (
        <p className="text-xs text-green-600 flex items-center gap-1">
          <Check size={14} />
          Key saved in your browser.
        </p>
      )}
      {geminiKeyStatus === 'error' && geminiKeyError && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle size={14} />
          {geminiKeyError}
        </p>
      )}
    </div>
  </div>
)

export default KeySetupPanel
