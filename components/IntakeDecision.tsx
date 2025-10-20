"use client"

import { FC } from 'react'
import { FileCode, Sparkles, Upload, ClipboardList, ArrowRight } from 'lucide-react'

interface IntakeDecisionProps {
  onSelectJSONPath: () => void
  onSelectHelperPath: () => void
}

const IntakeDecision: FC<IntakeDecisionProps> = ({ onSelectJSONPath, onSelectHelperPath }) => (
  <div className="min-h-screen bg-gray-50">
    <div className="print:hidden p-4 bg-white shadow-sm border-b">
      <div className="max-w-4xl mx-auto py-10 space-y-10">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold text-gray-900">Choose your starting point</h1>
          <p className="text-sm text-gray-600">
            Bring your own JSON resume or let BuiltIt help you create one from scratch.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <button
            onClick={onSelectJSONPath}
            data-testid="intake-option-json"
            className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-blue-500 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-100 p-3 text-blue-600">
                  <FileCode size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">I already have JSON</h2>
                  <p className="text-sm text-gray-600">
                    Paste or upload your JSON resume and jump straight into optimization.
                  </p>
                </div>
              </div>
              <ArrowRight size={18} className="text-blue-500" />
            </div>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <Upload size={16} className="text-blue-500" />
                Drag & drop or paste your JSON resume
              </li>
              <li className="flex items-center gap-2">
                <Sparkles size={16} className="text-blue-500" />
                Validate instantly before loading it
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight size={16} className="text-blue-500" />
                Review and tailor in the workspace
              </li>
            </ul>
          </button>

          <button
            onClick={onSelectHelperPath}
            data-testid="intake-option-helper"
            className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-blue-500 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-purple-100 p-3 text-purple-600">
                  <Sparkles size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Help me create JSON</h2>
                  <p className="text-sm text-gray-600">
                    Use your own AI prompt or let BuiltIt convert plain text into the right format.
                  </p>
                </div>
              </div>
              <ArrowRight size={18} className="text-purple-500" />
            </div>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <ClipboardList size={16} className="text-purple-500" />
                Get a ready-to-copy prompt + schema in one step
              </li>
              <li className="flex items-center gap-2">
                <Sparkles size={16} className="text-purple-500" />
                Optionally paste your resume text and we will convert it
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight size={16} className="text-purple-500" />
                Download and continue to the workspace
              </li>
            </ul>
          </button>
        </div>
      </div>
    </div>
  </div>
)

export default IntakeDecision
