import React, { useState, useEffect } from 'react'
import { X, Loader2, Check, AlertCircle } from 'lucide-react'
import { storage } from '@/lib/local-storage'
import {
  DEFAULT_OPTIMIZATION_SYSTEM_PROMPT,
  DEFAULT_ADJUSTMENT_SYSTEM_PROMPT,
  DEFAULT_TEXT_CONVERSION_SYSTEM_PROMPT
} from '@/lib/prompts'

interface PromptSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  systemPrompt: string
  setSystemPrompt: (value: string) => void
  adjustmentPrompt: string
  setAdjustmentPrompt: (value: string) => void
  conversionPrompt: string
  setConversionPrompt: (value: string) => void
}

const PromptSettingsModal: React.FC<PromptSettingsModalProps> = ({
  isOpen,
  onClose,
  systemPrompt,
  setSystemPrompt,
  adjustmentPrompt,
  setAdjustmentPrompt,
  conversionPrompt,
  setConversionPrompt
}) => {
  const [draftSystemPrompt, setDraftSystemPrompt] = useState(systemPrompt)
  const [draftAdjustmentPrompt, setDraftAdjustmentPrompt] = useState(adjustmentPrompt)
  const [draftConversionPrompt, setDraftConversionPrompt] = useState(conversionPrompt)
  const [promptSaveState, setPromptSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [promptError, setPromptError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setDraftSystemPrompt(systemPrompt)
      setDraftAdjustmentPrompt(adjustmentPrompt)
      setDraftConversionPrompt(conversionPrompt)
      setPromptSaveState('idle')
      setPromptError(null)
    }
  }, [isOpen, systemPrompt, adjustmentPrompt, conversionPrompt])

  const handleResetPrompts = () => {
    setDraftSystemPrompt(DEFAULT_OPTIMIZATION_SYSTEM_PROMPT)
    setDraftAdjustmentPrompt(DEFAULT_ADJUSTMENT_SYSTEM_PROMPT)
    setDraftConversionPrompt(DEFAULT_TEXT_CONVERSION_SYSTEM_PROMPT)
    setSystemPrompt(DEFAULT_OPTIMIZATION_SYSTEM_PROMPT)
    setAdjustmentPrompt(DEFAULT_ADJUSTMENT_SYSTEM_PROMPT)
    setConversionPrompt(DEFAULT_TEXT_CONVERSION_SYSTEM_PROMPT)
    storage.savePrompts({
      systemPrompt: DEFAULT_OPTIMIZATION_SYSTEM_PROMPT,
      adjustmentPrompt: DEFAULT_ADJUSTMENT_SYSTEM_PROMPT,
      conversionPrompt: DEFAULT_TEXT_CONVERSION_SYSTEM_PROMPT
    })
    setPromptSaveState('saved')
    setPromptError(null)
    setTimeout(() => setPromptSaveState('idle'), 2000)
  }

  const handleSavePrompts = () => {
    try {
      setPromptSaveState('saving')
      setPromptError(null)
      storage.savePrompts({
        systemPrompt: draftSystemPrompt,
        adjustmentPrompt: draftAdjustmentPrompt,
        conversionPrompt: draftConversionPrompt
      })
      setSystemPrompt(draftSystemPrompt)
      setAdjustmentPrompt(draftAdjustmentPrompt)
      setConversionPrompt(draftConversionPrompt)
      setPromptSaveState('saved')
      setTimeout(() => setPromptSaveState('idle'), 2000)
    } catch (error) {
      console.error('Failed to save prompts:', error)
      setPromptSaveState('error')
      setPromptError('Unable to save prompts locally. Try again.')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-3xl rounded-lg bg-white shadow-xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Prompt Settings</h2>
            <p className="text-sm text-gray-600 mt-1">
              Customize the system prompts used for conversion, optimization, and adjustments. Changes are saved locally and applied to future Gemini requests.
            </p>
          </div>
          <button
            onClick={onClose}
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
              value={draftConversionPrompt}
              onChange={(event) => setDraftConversionPrompt(event.target.value)}
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
              value={draftSystemPrompt}
              onChange={(event) => setDraftSystemPrompt(event.target.value)}
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
              value={draftAdjustmentPrompt}
              onChange={(event) => setDraftAdjustmentPrompt(event.target.value)}
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
            Prompts are saved in your browser. Reset restores the defaults.
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleResetPrompts}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
            >
              Reset to defaults
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSavePrompts}
              disabled={promptSaveState === 'saving'}
              className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
            >
              {promptSaveState === 'saving' && <Loader2 size={16} className="animate-spin" />}
              Save prompts
            </button>
          </div>
        </div>

        <div className="mt-2 min-h-[20px]">
          {promptSaveState === 'saved' && (
            <div className="text-xs text-green-600 flex items-center gap-1">
              <Check size={14} />
              Prompts saved locally.
            </div>
          )}
          {promptSaveState === 'error' && promptError && (
            <div className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle size={14} />
              {promptError}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PromptSettingsModal
