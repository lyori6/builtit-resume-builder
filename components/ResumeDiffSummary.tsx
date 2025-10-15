"use client"

import { FC } from 'react'

interface DiffSummaryProps {
  totalChanges: number
  sectionCount: number
  onToggleDetails: () => void
  showingDetails: boolean
}

const ResumeDiffSummary: FC<DiffSummaryProps> = ({
  totalChanges,
  sectionCount,
  onToggleDetails,
  showingDetails
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
    <div>
      <h2 className="text-sm font-semibold text-blue-700">AI Changes Summary</h2>
      <p className="text-xs text-gray-600">
        {totalChanges} change{totalChanges === 1 ? '' : 's'} across {sectionCount} section{sectionCount === 1 ? '' : 's'}.
      </p>
    </div>
    <button
      onClick={onToggleDetails}
      className="self-start px-3 py-1.5 text-xs font-medium text-blue-700 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
    >
      {showingDetails ? 'Hide detailed changes' : 'View detailed changes'}
    </button>
  </div>
)

export default ResumeDiffSummary
