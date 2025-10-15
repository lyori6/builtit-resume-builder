"use client"

import { FC } from 'react'
import {
  Code,
  FileText,
  Check,
  AlertCircle,
  Info,
  Sparkles,
  Loader2
} from 'lucide-react'

type IntakeMode = 'json' | 'text'

interface ResumeIntakeProps {
  intakeMode: IntakeMode
  onIntakeModeChange: (mode: IntakeMode) => void
  pastedJSON: string
  onJSONChange: (value: string) => void
  isJSONValid: boolean | null
  jsonErrors: string[]
  onLoadJSON: () => void
  onDownloadJSON: () => void
  rawResumeText: string
  onRawTextChange: (value: string) => void
  onConvertText: () => void
  isConvertingText: boolean
  textConversionError: string | null
  hasStoredKey: boolean
}

const ResumeIntake: FC<ResumeIntakeProps> = ({
  intakeMode,
  onIntakeModeChange,
  pastedJSON,
  onJSONChange,
  isJSONValid,
  jsonErrors,
  onLoadJSON,
  onDownloadJSON,
  rawResumeText,
  onRawTextChange,
  onConvertText,
  isConvertingText,
  textConversionError,
  hasStoredKey
}) => (
  <div className="min-h-screen bg-gray-50">
    <div className="print:hidden p-4 bg-white shadow-sm border-b">
      <div className="max-w-4xl mx-auto">
        <div className="py-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">BuiltIt Resume Builder</h1>
            <p className="text-gray-600">
              Bring your resume as JSON or plain text, connect your Gemini key, and start tailoring it for new roles.
            </p>
          </div>

          <div className="flex justify-center mb-6">
            <div className="inline-flex rounded-lg border border-gray-200 bg-white shadow-sm">
              <button
                onClick={() => onIntakeModeChange('json')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-l-lg ${
                  intakeMode === 'json' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Code size={16} />
                Paste JSON
              </button>
              <button
                onClick={() => onIntakeModeChange('text')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-r-lg ${
                  intakeMode === 'text' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText size={16} />
                Paste Text
              </button>
            </div>
          </div>

          <div className="max-w-2xl mx-auto bg-gray-50 rounded-lg p-6 border border-gray-200 space-y-4 text-left">
            {intakeMode === 'json' ? (
              <>
                <p className="text-sm text-gray-600">
                  Already have a resume in JSON? Paste it below. Need a template? Check{' '}
                  <span className="font-mono text-xs bg-gray-200 px-1 py-0.5 rounded">
                    docs/resume-json-template.md
                  </span>{' '}
                  for the schema and prompt tips.
                </p>
                <textarea
                  value={pastedJSON}
                  onChange={(event) => onJSONChange(event.target.value)}
                  placeholder="Paste your resume JSON here..."
                  className="w-full h-48 px-4 py-3 text-sm font-mono border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  spellCheck={false}
                />

                {pastedJSON && (
                  <div className="text-left">
                    {isJSONValid === true && (
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-green-600 text-sm">
                          <Check size={16} />
                          <span>Valid JSON format</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={onDownloadJSON}
                            className="px-4 py-2 text-sm font-medium bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors shadow-sm"
                          >
                            Download JSON
                          </button>
                          <button
                            onClick={onLoadJSON}
                            className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded hover:bg-green-700 transition-colors shadow-sm"
                          >
                            Load Resume
                          </button>
                        </div>
                      </div>
                    )}
                    {isJSONValid === false && (
                      <div className="flex items-start gap-2 text-red-600 text-sm">
                        <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-medium mb-1">Invalid JSON:</div>
                          <ul className="list-disc list-inside space-y-1">
                            {jsonErrors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!pastedJSON && (
                  <div className="text-xs text-gray-500">
                    Tip: Ask your favorite AI to “output my resume in this JSON format” using the schema in our docs.
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  Paste the plain text of your resume (from Google Docs, LinkedIn, etc.). We’ll convert it into the JSON schema using your Gemini key.
                </p>
                <textarea
                  value={rawResumeText}
                  onChange={(event) => onRawTextChange(event.target.value)}
                  placeholder="Paste your resume text here..."
                  className="w-full h-48 px-4 py-3 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  spellCheck={false}
                />

                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {textConversionError && (
                      <div className="flex items-start gap-2 text-red-600 text-xs mb-2">
                        <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-medium">Conversion failed:</div>
                          <div>{textConversionError}</div>
                        </div>
                      </div>
                    )}
                    {!hasStoredKey && (
                      <div className="flex items-center gap-1 text-blue-700 text-xs">
                        <Info size={14} />
                        <span>Add your Gemini key above to run the conversion.</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={onConvertText}
                    disabled={isConvertingText || !rawResumeText.trim() || !hasStoredKey}
                    className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isConvertingText ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Converting...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Convert to JSON
                      </>
                    )}
                  </button>
                </div>

                <div className="text-xs text-gray-500">
                  We store the converted JSON locally so you can edit it later or download a backup.
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
)

export default ResumeIntake
