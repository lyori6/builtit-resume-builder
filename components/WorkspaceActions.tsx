"use client"

import { FC, useMemo, useState, useCallback } from 'react'
import { Sparkles, Loader2, Check, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react'
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

  const [showAdjustments, setShowAdjustments] = useState(false)
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
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-blue-500">
              Job description
            </label>
            <textarea
              value={jobDescription}
              onChange={(event) => handleJobDescriptionChange(event.target.value)}
              placeholder="Paste the job description you want to target..."
              className="h-28 w-full resize-none rounded-3xl border border-blue-100 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
              spellCheck={false}
            />
          </div>

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
              disabled={isOptimizing || !jobDescription.trim() || keyMissing}
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

      <section className="rounded-[26px] border border-purple-100 bg-purple-50/70 p-7 shadow-lg shadow-purple-100/60">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-purple-900">Optional final adjustments</h2>
          <button
            type="button"
            onClick={() => setShowAdjustments((value) => !value)}
            className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-purple-700 transition hover:bg-purple-50"
            aria-expanded={showAdjustments}
          >
            {showAdjustments ? <ChevronUp size={16} /> : <ChevronDown size={16} />} 
            {showAdjustments ? 'Hide adjustments' : 'Show adjustments'}
          </button>
        </header>

        {showAdjustments && (
        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-purple-500">
              Quick instructions
            </label>
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

      {optimizationSuccess && (summaryMetrics.length > 0 || diffItems.length > 0) && (
        <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-8 shadow-lg shadow-slate-200/60">
          <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
              <div className="space-y-1.5">
                <h2 className="text-lg font-semibold text-slate-900">Results summary</h2>
                <p className="text-sm text-slate-600">Review the highlights before you export.</p>
              </div>
              <button
                type="button"
                onClick={handleToggleDiff}
                className="inline-flex items-center justify-center rounded-full border border-blue-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-blue-700 transition hover:bg-blue-50"
              >
                {showDiff ? 'Hide all changes' : 'Show all changes'}
              </button>
            </header>

            <div className="flex flex-wrap justify-center gap-3">
              {summaryMetrics.map((metric) => (
                <div
                  key={metric.id}
                  className="inline-flex items-center gap-3 rounded-xl border border-[#bfdbfe] bg-[#f0f7ff] px-5 py-3 shadow-sm shadow-blue-100/60"
                >
                  <span className="text-2xl font-bold leading-none text-[#2563eb]">{metric.value}</span>
                  <span className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                    {metric.label}
                  </span>
                </div>
              ))}
            </div>

            {showDiff && (
              <div className="max-h-[400px] overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-inner transition-all duration-200">
                {metadata?.keywordsMatched && metadata.keywordsMatched.length > 0 && (
                  <div className="mb-6 flex flex-wrap gap-2">
                    {metadata.keywordsMatched.map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center rounded-full bg-[#dbeafe] px-3 py-1 text-xs font-semibold text-[#1e40af]"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}

                {groupedChanges ? (
                  <div className="space-y-6">
                    {Object.entries(groupedChanges).map(([type, changes]) => {
                      const meta = changeTypeMeta[type] ?? {
                        icon: '✨',
                        label: type.charAt(0).toUpperCase() + type.slice(1)
                      }
                      const expanded = expandedGroups[type] ?? false
                      const visibleChanges = expanded ? changes : changes.slice(0, 3)
                      const remaining = changes.length - visibleChanges.length

                      return (
                        <div key={type} className="space-y-3">
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <span>{meta.icon}</span>
                            <span>{meta.label}</span>
                            <span className="text-xs font-medium text-slate-400">({changes.length})</span>
                          </div>
                          <ul className="space-y-2 pl-1">
                            {visibleChanges.map((change, index) => (
                              <li key={`${type}-${index}`} className="flex items-start gap-2 text-sm text-slate-700">
                                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400" />
                                <div className="space-y-1">
                                  <p className="text-sm font-semibold text-slate-900">{change.section || 'General'}</p>
                                  <p className="text-sm text-slate-600">
                                    {mapChangeSummary(change) || 'Detailed change available in the export.'}
                                  </p>
                                </div>
                              </li>
                            ))}
                          </ul>
                          {remaining > 0 && (
                            <button
                              type="button"
                              onClick={() => handleToggleGroup(type)}
                              className="text-xs font-semibold uppercase tracking-wide text-blue-600 hover:underline"
                            >
                              {expanded ? 'Show fewer...' : `[${remaining} more...]`}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <ResumeDiffTable
                    diffs={diffItems}
                    renderValue={renderDiffValue}
                    formatPath={formatDiffPath}
                    maxVisible={maxDiffItems}
                  />
                )}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

export default WorkspaceActions
