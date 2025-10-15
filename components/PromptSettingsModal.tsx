"use client"

import { FC } from 'react'
import { Loader2, Check, AlertCircle, X } from 'lucide-react'

interface PromptSettingsModalProps {
  isOpen: boolean
  conversionPrompt: string
  optimizationPrompt: string
  adjustmentPrompt: string
  onConversionPromptChange: (value: string) => void
  onOptimizationPromptChange: (value: string) => void
  onAdjustmentPromptChange: (value: string) => void
  onSave: () => void
  onReset: () => void
  onCancel: () => void
  saveState: 'idle' | 'saving' | 'saved' | 'error'
  errorMessage: string | null
}

const PromptSettingsModal: FC<PromptSettingsModalProps> = ({
  isOpen,
  conversionPrompt,
  optimizationPrompt,
  adjustmentPrompt,
  onConversionPromptChange,
  onOptimizationPromptChange,
  onAdjustmentPromptChange,
  onSave,
  onReset,
  onCancel,
  saveState,
  errorMessage
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-3xl rounded-lg bg-white shadow-xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Prompt Settings</h2>
            <p className="text-sm text-gray-600 mt-1">
              Customize the system prompts used for conversion, optimization, and adjustments. Changes are saved locally and applied to all future Gemini requests.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close prompt settings"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Text → JSON conversion prompt
            </label>
            <textarea
              value={conversionPrompt}
              onChange={(event) => onConversionPromptChange(event.target.value)}
              className="w-full h-32 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              spellCheck={false}
            />
            <p className="text-xs text-gray-500 mt-1">
              Applied when converting plain text resumes into JSON.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Optimization prompt
            </label>
            <textarea
              value={optimizationPrompt}
              onChange={(event) => onOptimizationPromptChange(event.target.value)}
              className="w-full h-32 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              spellCheck={false}
            />
            <p className="text-xs text-gray-500 mt-1">
              Used when tailoring a resume against a job description.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adjustment prompt
            </label>
            <textarea
              value={adjustmentPrompt}
              onChange={(event) => onAdjustmentPromptChange(event.target.value)}
              className="w-full h-32 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              spellCheck={false}
            />
            <p className="text-xs text-gray-500 mt-1">
              Used for quick follow-up edits (length tweaks, emphasis changes, etc.).
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-gray-500">
            Prompts are saved in your browser. Reset restores defaults from <code>lib/prompts.ts</code>.
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onReset}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
            >
              Reset to defaults
            </button>
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={saveState === 'saving'}
              className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
            >
              {saveState === 'saving' && <Loader2 size={16} className="animate-spin" />}
              Save prompts
            </button>
          </div>
        </div>

        <div className="mt-2 min-h-[20px]">
          {saveState === 'saved' && (
            <div className="text-xs text-green-600 flex items-center gap-1">
              <Check size={14} />
              Prompts saved locally.
            </div>
          )}
          {saveState === 'error' && errorMessage && (
            <div className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle size={14} />
              {errorMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PromptSettingsModal
