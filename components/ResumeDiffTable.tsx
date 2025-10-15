"use client"

import { FC } from 'react'

export interface DiffItem {
  path: string[]
  before: string
  after: string
}

export interface ResumeDiffTableProps {
  diffs: DiffItem[]
  renderValue: (value: string) => JSX.Element
  formatPath: (path: string[]) => string
  maxVisible?: number
}

const ResumeDiffTable: FC<ResumeDiffTableProps> = ({
  diffs,
  renderValue,
  formatPath,
  maxVisible = 50
}) => {
  if (diffs.length === 0) {
    return null
  }

  const displayed = diffs.slice(0, maxVisible)
  const hasMore = diffs.length > maxVisible

  // TODO: Replace WorkspaceActions table with this component.
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 mt-4" data-testid="resume-diff-table">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Field
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Before
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                After
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-xs">
            {displayed.map((diff, index) => (
              <tr key={`${diff.path.join('.')}-${index}`} className="align-top">
                <td className="px-3 py-2 text-gray-700 font-medium">{formatPath(diff.path)}</td>
                <td className="px-3 py-2 text-gray-600">{renderValue(diff.before)}</td>
                <td className="px-3 py-2 text-gray-600">{renderValue(diff.after)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <div className="mt-2 text-xs text-gray-500">
          Showing first {displayed.length} changes. Download JSON to review all updates.
        </div>
      )}
    </div>
  )
}

export default ResumeDiffTable
