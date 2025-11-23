"use client"

import { FC, useMemo, useState, useCallback } from 'react'
import {
  Sparkles,
  Loader2,
  Check,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Target,
  Settings,
  FileText
} from 'lucide-react'
import ResumeDiffTable from '@/components/ResumeDiffTable'
import { ResumeData } from '@/lib/resume-types'
import { useOptimizerContext } from '@/src/state/optimizer-context'
import type { OptimizationMetadata } from '@/src/state/optimizer-context'

interface WorkspaceActionsProps {
  resumeData: ResumeData | null
  optimizeResume: () => void
  finalAdjustments: string
  onFinalAdjustmentsChange: (value: string) => void
  applyFinalAdjustments: () => void
  isAdjusting: boolean
  adjustmentError: string | null
  adjustmentSuccess: boolean
  originalResume: ResumeData | null
  revertToOriginal: () => void
  maxDiffItems: number
  renderDiffValue: (value: string) => JSX.Element
  formatDiffPath: (segments: string[]) => string
}

const WorkspaceActions: FC<WorkspaceActionsProps> = ({
  resumeData,
  optimizeResume,
  finalAdjustments,
  onFinalAdjustmentsChange,
  applyFinalAdjustments,
  isAdjusting,
  adjustmentError,
  adjustmentSuccess,
  originalResume,
  revertToOriginal,
  maxDiffItems,
  renderDiffValue,
  formatDiffPath
}) => {
  const { state, dispatch } = useOptimizerContext()
  const jobDescription = state.jobDescription.text
  const storedGeminiKey = state.apiKey.value
  const optimizationState = state.optimization
  const metadata = state.metadata
  const isDemoMode = state.ui.isDemoMode
  const diffItems = optimizationState.diffItems
  const showDiff = optimizationState.showDiff
  const isOptimizing = optimizationState.status === 'running'
  const optimizationError = optimizationState.errorMessage
  const optimizationSuccess = optimizationState.status === 'success'

  const handleJobDescriptionChange = useCallback(
    (value: string) => {
      dispatch({ type: 'SET_JOB_DESCRIPTION', text: value })
    },
    [dispatch]
  )

  const handleToggleDiff = useCallback(() => {
    dispatch({ type: 'SET_SHOW_DIFF', value: !showDiff })
  }, [dispatch, showDiff])
  const handleViewFullResume = useCallback(() => {
    if (typeof document !== 'undefined') {
      const previewEl = document.getElementById('resume-preview-panel')
      if (previewEl) {
        previewEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [])

  const [showAdjustments, setShowAdjustments] = useState(false)
  const [showJobOptions, setShowJobOptions] = useState(false)
  const showJobFilterHelpers = false
  const showResumeSnapshot = false
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const keyMissing = !storedGeminiKey || storedGeminiKey.trim() === ''
  const improvementsCount = metadata?.improvementsCount ?? diffItems.length
  const keywordCount = metadata?.keywordsMatched?.length ?? 0
  const processingTime = metadata?.processingTimeSeconds
  const wordCount = metadata?.wordCount

  const summaryMetrics = useMemo(() => {
    const metrics: Array<{ id: string; value: string; label: string }> = [
      {
        id: 'improvements',
        value: improvementsCount.toString(),
        label: 'Improvements'
      }
    ]

    metrics.push({
      id: 'keywords',
      value: keywordCount.toString(),
      label: 'Keywords matched'
    })

    if (typeof wordCount === 'number' && Number.isFinite(wordCount)) {
      metrics.push({
        id: 'wordCount',
        value: wordCount.toLocaleString(),
        label: 'Words processed'
      })
    }

    if (typeof processingTime === 'number' && Number.isFinite(processingTime)) {
      const formatted =
        processingTime >= 1
          ? `${processingTime.toFixed(processingTime >= 10 ? 0 : 1)}s`
          : `${Math.round(processingTime * 1000)}ms`
      metrics.push({
        id: 'processingTime',
        value: formatted,
        label: 'Processing time'
      })
    }

    return metrics
  }, [improvementsCount, keywordCount, processingTime, wordCount])

  const resumeSnapshot = useMemo(() => {
    if (!resumeData) return []
    const snapshot: string[] = []
    const basics: any = (resumeData as any).basics ?? {}
    const sections: any = (resumeData as any).sections ?? {}

    const contactParts = [basics.email, basics.location?.text || basics.location]
      .filter(Boolean)
      .join(' • ')

    if (basics.name || contactParts || basics.headline || basics.label) {
      snapshot.push(
        [basics.name, basics.headline || basics.label, contactParts].filter(Boolean).join(' | ')
      )
    }

    if (basics.summary || basics.summaryText) {
      snapshot.push((basics.summaryText || basics.summary || '').replace(/<[^>]+>/g, ''))
    }

    const experienceItems: any[] = Array.isArray(sections?.experience?.items)
      ? sections.experience.items
      : []

    experienceItems.slice(0, 2).forEach((item) => {
      snapshot.push(
        `${item.company || 'Company'} — ${item.position || item.name || 'Role'}${item.date ? ` (${item.date})` : ''
        }`
      )
    })

    return snapshot.filter(Boolean).slice(0, 5)
  }, [resumeData])

  type ChangeEntry = NonNullable<OptimizationMetadata['changes']>[number]

  const groupedChanges = useMemo(() => {
    if (!metadata?.changes || metadata.changes.length === 0) {
      return null
    }

    return metadata.changes.reduce<Record<string, ChangeEntry[]>>((acc, change) => {
      const key = change.type || 'modified'
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(change)
      return acc
    }, {})
  }, [metadata?.changes])

  const changeTypeMeta: Record<string, { icon: string; label: string }> = {
    modified: { icon: '✏️', label: 'Modified' },
    added: { icon: '➕', label: 'Added' },
    removed: { icon: '➖', label: 'Removed' },
    keywords: { icon: '🎯', label: 'Keyword highlight' }
  }

  const mapChangeSummary = (change: ChangeEntry) => {
    const summaryParts: string[] = []

    if (change.description) {
      summaryParts.push(change.description)
    } else if (change.before && change.after) {
      summaryParts.push(`Updated "${change.before}" -> "${change.after}"`)
    } else if (change.after) {
      summaryParts.push(`Added "${change.after}"`)
    } else if (change.before) {
      summaryParts.push(`Removed "${change.before}"`)
    }

    if (change.reason) {
      summaryParts.push(change.reason)
    }

    return summaryParts.join(' ')
  }

  const handleToggleGroup = (type: string) => {
    setExpandedGroups((previous) => ({
      ...previous,
      [type]: !previous[type]
    }))
  }

  if (!resumeData) {
    return null
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[26px] border border-blue-100 bg-white/90 p-7 shadow-lg shadow-blue-100/60">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <h2 className="flex items-center gap-3 text-xl font-semibold text-slate-900">
              <Sparkles size={20} className="text-blue-600" />
              Optimize for this job description
            </h2>
            <p className="text-sm text-slate-600">
              Paste the job description and generate focused updates without losing your voice.
            </p>
            {isDemoMode && (
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-900">
                Demo resume loaded — add your API key to tailor your own.
              </div>
            )}
            {optimizationSuccess && metadata && (
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
                  <Check size={14} /> {improvementsCount} improvements detected
                </span>
                {!!metadata.keywordsMatched?.length && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
                    🎯 {keywordCount} keywords matched
                  </span>
                )}
              </div>
            )}
          </div>
          {originalResume && (
            <button
              type="button"
              onClick={revertToOriginal}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              Revert to original
            </button>
          )}
        </header>

        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <label htmlFor="job-description-input" className="block">
              <div className="mb-2 flex items-center gap-2">
                <Target size={20} className="text-warning" />
                <span className="text-lg font-semibold text-slate-900">Job description</span>
              </div>
            </label>
            <textarea
              id="job-description-input"
              value={jobDescription}
              onChange={(event) => handleJobDescriptionChange(event.target.value)}
              placeholder={`Product Manager\n\nSunnyvale, CA • Full Time\nMeta\nProduct Management\n\nWe're looking for an experienced Product Manager to lead our core product initiatives...\n\nRequirements:\n• 5+ years in product management\n• Experience with AI/ML products\n• Strong analytical skills...`}
              className="min-h-[240px] w-full resize-none rounded-2xl border-2 border-neutral-200 bg-white px-5 py-4 text-sm text-slate-900 shadow-sm focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200"
              spellCheck={false}
            />
          </div>

          {showJobFilterHelpers && (
            <div className="rounded-2xl border border-neutral-200">
              <button
                type="button"
                onClick={() => setShowJobOptions((value) => !value)}
                className="flex w-full items-center justify-between px-5 py-3 text-left text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
              >
                <span className="inline-flex items-center gap-2">
                  <Settings size={18} className="text-neutral-500" />
                  Optional adjustments
                </span>
                {showJobOptions ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {showJobOptions && (
                <div className="border-t border-neutral-200 px-5 py-4 text-sm text-neutral-600">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="rounded-full bg-primary-light px-2 py-1 text-xs font-semibold text-primary">Filters</span>
                      <p>Call out specific skills, industries, or levels you want the optimizer to emphasize.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="rounded-full bg-warning-light px-2 py-1 text-xs font-semibold text-warning">Tone</span>
                      <p>Keep it leadership-focused, concise, or more technical depending on the role.</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="rounded-full bg-success-light px-2 py-1 text-xs font-semibold text-success">Keywords</span>
                      <p>Paste priority keywords so we double-check they’re woven into the updates.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {showResumeSnapshot && (
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-neutral-900">
                  <FileText size={18} />
                  <h3 className="text-base font-semibold">Current resume snapshot</h3>
                </div>
                <button
                  type="button"
                  onClick={handleViewFullResume}
                  className="text-sm font-semibold text-primary underline-offset-4 transition hover:text-primary-hover hover:underline"
                >
                  View full →
                </button>
              </div>
              <div className="max-h-[200px] space-y-2 overflow-y-auto rounded-xl border border-white bg-white px-4 py-3 text-sm text-neutral-700 shadow-inner">
                {resumeSnapshot.length > 0 ? (
                  resumeSnapshot.map((line, index) => <p key={index}>{line}</p>)
                ) : (
                  <p className="text-xs text-neutral-500">
                    Paste your resume on the previous step to see a quick preview here.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 space-y-2 text-xs text-slate-600">
              {optimizationError && (
                <div className="flex items-start gap-2 text-red-600">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold">Optimization failed.</span> {optimizationError}
                  </div>
                </div>
              )}
              {optimizationSuccess && !isOptimizing && (
                <div className="flex items-center gap-1 text-emerald-600">
                  <Check size={14} /> Resume optimized. Review the diff below.
                </div>
              )}
              {keyMissing && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Info size={14} />
                  <span>
                    {isDemoMode
                      ? 'Exit demo and add your Gemini API key to optimize your resume.'
                      : 'Add your API key on the intake screen before running optimizations.'}
                  </span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={optimizeResume}
              disabled={isOptimizing || !jobDescription.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-blue-300/40 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isOptimizing ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Optimizing...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Optimize resume
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      <section
        className={`rounded-[26px] border border-purple-100 bg-purple-50/70 shadow-lg shadow-purple-100/60 transition ${showAdjustments ? '' : 'hover:shadow-purple-200/80 hover:ring-2 hover:ring-purple-100'
          }`}
      >
        <button
          type="button"
          onClick={() => setShowAdjustments((value) => !value)}
          className="flex w-full items-center justify-between rounded-[26px] px-6 py-4 text-left"
          aria-expanded={showAdjustments}
        >
          <div>
            <p className="text-sm font-semibold text-purple-900">Edit my resume with AI</p>
            {!showAdjustments && (
              <p className="text-xs text-purple-600">Click to make custom changes to your resume using AI.</p>
            )}
          </div>
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-purple-700">
            {showAdjustments ? 'Hide' : 'Show'} <span>{showAdjustments ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
          </div>
        </button>

        {showAdjustments && (
          <div className="space-y-4 border-t border-purple-100 px-6 py-6">
            <div>
              <textarea
                value={finalAdjustments}
                onChange={(event) => onFinalAdjustmentsChange(event.target.value)}
                placeholder="Make it shorter, remove certain sections, emphasize specific skills, etc..."
                className="h-28 w-full resize-none rounded-3xl border border-purple-100 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-200"
                spellCheck={false}
              />
            </div>

            <div className="flex flex-col gap-4 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1 space-y-2">
                {adjustmentError && (
                  <div className="flex items-start gap-2 text-red-600">
                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold">Adjustment failed.</span> {adjustmentError}
                    </div>
                  </div>
                )}
                {adjustmentSuccess && !isAdjusting && (
                  <div className="flex items-center gap-1 text-emerald-600">
                    <Check size={14} /> Adjustments applied. Check the diff below.
                  </div>
                )}
                {keyMissing && (
                  <div className="flex items-center gap-2 text-purple-700">
                    <Info size={14} />
                    <span>Add your API key on the intake screen before applying adjustments.</span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={applyFinalAdjustments}
                disabled={isAdjusting || !finalAdjustments.trim() || keyMissing}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-purple-300/40 transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAdjusting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Applying...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Apply adjustments
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export default WorkspaceActions
