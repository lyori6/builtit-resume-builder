"use client"

import { FC, useMemo, useState } from 'react'
import { Sparkles, Loader2, Check, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react'
import ResumeDiffTable from '@/components/ResumeDiffTable'
import ResumeDiffSummary from '@/components/ResumeDiffSummary'
import { ResumeData } from '@/lib/resume-types'

interface WorkspaceActionsProps {
  resumeData: ResumeData | null
  jobDescription: string
  onJobDescriptionChange: (value: string) => void
  optimizeResume: () => void
  isOptimizing: boolean
  optimizationError: string | null
  optimizationSuccess: boolean
  storedGeminiKey: string | null
  finalAdjustments: string
  onFinalAdjustmentsChange: (value: string) => void
  applyFinalAdjustments: () => void
  isAdjusting: boolean
  adjustmentError: string | null
  adjustmentSuccess: boolean
  originalResume: ResumeData | null
  revertToOriginal: () => void
  showDiff: boolean
  setShowDiff: (value: boolean) => void
  diffItems: Array<{
    path: string[]
    before: string
    after: string
  }>
  maxDiffItems: number
  renderDiffValue: (value: string) => JSX.Element
  formatDiffPath: (segments: string[]) => string
}

const WorkspaceActions: FC<WorkspaceActionsProps> = ({
  resumeData,
  jobDescription,
  onJobDescriptionChange,
  optimizeResume,
  isOptimizing,
  optimizationError,
  optimizationSuccess,
  storedGeminiKey,
  finalAdjustments,
  onFinalAdjustmentsChange,
  applyFinalAdjustments,
  isAdjusting,
  adjustmentError,
  adjustmentSuccess,
  originalResume,
  revertToOriginal,
  showDiff,
  setShowDiff,
  diffItems,
  maxDiffItems,
  renderDiffValue,
  formatDiffPath
}) => {
  const diffSectionCount = useMemo(
    () => new Set(diffItems.map((diff) => diff.path[0]).filter(Boolean)).size,
    [diffItems]
  )
  const [showAdjustments, setShowAdjustments] = useState(false)

  if (!resumeData) {
    return null
  }

  const keyMissing = !storedGeminiKey || storedGeminiKey.trim() === ''

  return (
    <div className="space-y-8">
      <section className="rounded-[26px] border border-blue-100 bg-white/90 p-7 shadow-lg shadow-blue-100/60">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <h2 className="flex items-center gap-3 text-xl font-semibold text-slate-900">
              <Sparkles size={20} className="text-blue-600" />
              Optimize for this job description
            </h2>
            <p className="text-sm text-slate-600">
              Paste the job description and generate focused updates without losing your voice.
            </p>
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
              onChange={(event) => onJobDescriptionChange(event.target.value)}
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
                  <span>Add your API key on the intake screen before running optimizations.</span>
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

      {diffItems.length > 0 && (
        <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-8 shadow-lg shadow-slate-200/60">
          <ResumeDiffSummary
            totalChanges={diffItems.length}
            sectionCount={diffSectionCount}
            onToggleDetails={() => setShowDiff(!showDiff)}
            showingDetails={showDiff}
          />

          {showDiff && (
            <div className="mt-4">
              <ResumeDiffTable
                diffs={diffItems}
                renderValue={renderDiffValue}
                formatPath={formatDiffPath}
                maxVisible={maxDiffItems}
              />
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export default WorkspaceActions
