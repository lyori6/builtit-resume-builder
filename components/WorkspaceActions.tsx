"use client"

import { FC } from 'react'
import { Sparkles, Loader2, Check, AlertCircle, Info } from 'lucide-react'
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
  const diffSectionCount = new Set(diffItems.map((diff) => diff.path[0]).filter(Boolean)).size

  return (
  <>
    {(resumeData) && (
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-blue-700 flex items-center gap-2">
            <Sparkles size={16} />
            AI Resume Optimization
          </h2>
          {originalResume && (
            <button
              onClick={revertToOriginal}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              Revert to Original
            </button>
          )}
        </div>
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Job Description
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => onJobDescriptionChange(e.target.value)}
              placeholder="Paste job description here..."
              className="w-full h-32 px-3 py-2 text-xs border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              spellCheck={false}
            />
          </div>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {optimizationError && (
                <div className="flex items-start gap-2 text-red-600 text-xs mb-2">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Optimization failed:</div>
                    <div>{optimizationError}</div>
                  </div>
                </div>
              )}
              
              {optimizationSuccess && !isOptimizing && (
                <div className="flex items-center gap-1 text-green-600 text-xs">
                  <Check size={14} />
                  <span>Resume optimized! Generate PDF to see changes.</span>
                </div>
              )}
              {!storedGeminiKey && (
                <div className="flex items-center gap-1 text-blue-700 text-xs">
                  <Info size={14} />
                  <span>Add your Gemini key above to enable optimization.</span>
                </div>
              )}
            </div>
            
            <button
              onClick={optimizeResume}
              disabled={isOptimizing || !jobDescription.trim() || !resumeData || !storedGeminiKey}
              className="px-4 py-2 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isOptimizing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Optimize Resume
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )}

    {(resumeData) && (
      <div className="bg-green-50 rounded-lg p-4 border border-green-200 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-green-700 flex items-center gap-2">
            <Sparkles size={16} />
            Final Adjustments
          </h2>
          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
            Powered by Gemini 2.5 Flash
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Quick Adjustments
            </label>
            <textarea
              value={finalAdjustments}
              onChange={(e) => onFinalAdjustmentsChange(e.target.value)}
              placeholder="Make it shorter, remove certain sections, emphasize specific skills, etc..."
              className="w-full h-24 px-3 py-2 text-xs border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              spellCheck={false}
            />
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              {adjustmentError && (
                <div className="flex items-start gap-2 text-red-600 text-xs mb-2">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Adjustment failed:</div>
                    <div>{adjustmentError}</div>
                  </div>
                </div>
              )}

              {adjustmentSuccess && !isAdjusting && (
                <div className="flex items-center gap-1 text-green-600 text-xs">
                  <Check size={14} />
                  <span>Adjustments applied! Generate PDF to see changes.</span>
                </div>
              )}
              {!storedGeminiKey && (
                <div className="flex items-center gap-1 text-green-700 text-xs">
                  <Info size={14} />
                  <span>Add your Gemini key above to enable adjustments.</span>
                </div>
              )}
            </div>

            <button
              onClick={applyFinalAdjustments}
              disabled={isAdjusting || !finalAdjustments.trim() || !resumeData || !storedGeminiKey}
              className="px-4 py-2 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isAdjusting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Apply Adjustments
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )}

    {diffItems.length > 0 && (
      <div className="bg-white rounded-lg p-4 border border-gray-200 mt-4">
        <ResumeDiffSummary
          totalChanges={diffItems.length}
          sectionCount={diffSectionCount}
          onToggleDetails={() => setShowDiff(!showDiff)}
          showingDetails={showDiff}
        />

        {showDiff && (
          <div className="mt-3">
            <ResumeDiffTable
              diffs={diffItems}
              renderValue={renderDiffValue}
              formatPath={formatDiffPath}
              maxVisible={maxDiffItems}
            />
          </div>
        )}
      </div>
    )}
  </>
)}

export default WorkspaceActions
