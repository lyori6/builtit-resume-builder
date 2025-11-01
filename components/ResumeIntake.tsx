"use client"

import { FC, useEffect, useState } from 'react'
import { Check, AlertCircle, Info, Loader2, Eye, EyeOff, ExternalLink, UploadCloud, ChevronDown, ChevronUp } from 'lucide-react'

interface ResumeIntakeProps {
  pastedJSON: string
  onJSONChange: (value: string) => void
  isJSONValid: boolean | null
  jsonErrors: string[]
  onLoadJSON: () => void
  onJSONFileDrop: (file: File) => void
  isUploadingJSON: boolean
  rawResumeText: string
  onRawTextChange: (value: string) => void
  onConvertText: () => void
  isConvertingText: boolean
  textConversionError: string | null
  onViewDemo: () => void
}

const JSON_TEMPLATE = `{
  "basics": {
    "name": "Alex Taylor",
    "headline": "Product Manager",
    "email": "alex@example.com",
    "location": "San Francisco, CA"
  },
  "sections": {
    "summary": {
      "id": "summary",
      "name": "Professional Summary",
      "visible": true,
      "content": "<p>Product leader with 6+ years owning AI-powered experiences across B2B and consumer teams.</p>"
    },
    "experience": {
      "id": "experience",
      "name": "Experience",
      "visible": true,
      "items": [
        {
          "id": "exp-1",
          "visible": true,
          "company": "BuiltIt",
          "position": "Senior Product Manager",
          "location": "Remote",
          "date": "2022 – Present",
          "summary": "<ul><li>Shipped resume optimization assistant used by 1K+ job seekers.</li><li>Drove 35% faster tailoring with AI-powered prompts.</li></ul>"
        }
      ]
    },
    "projects": {
      "id": "projects",
      "name": "Projects",
      "visible": false,
      "items": []
    },
    "skills": {
      "id": "skills",
      "name": "Skills",
      "visible": true,
      "items": [
        {
          "id": "skill-1",
          "visible": true,
          "name": "Product Leadership",
          "keywords": ["Roadmaps", "User Research", "Cross-functional"]
        }
      ]
    },
    "education": {
      "id": "education",
      "name": "Education",
      "visible": true,
      "items": [
        {
          "id": "edu-1",
          "visible": true,
          "institution": "Example University",
          "studyType": "B.S. Computer Science",
          "date": "2013 - 2017",
          "location": "Boston, MA",
          "score": "3.8 GPA",
          "summary": ""
        }
      ]
    }
  }
}`

const JSON_PROMPT_SNIPPET = `You are converting my resume into JSON for the BuiltIt resume builder.

Use the following template exactly. Remove sections that do not apply instead of leaving placeholder text:

${JSON_TEMPLATE}

Rules:
- Keep all factual details exactly as provided.
- Use HTML tags (<p>, <ul><li>) for summaries and bullet points.
- Keep stable IDs such as "exp-1", "proj-1", and update numbering when adding items.
- If I do not have data for a section (for example projects or certifications), either omit that section entirely or set "visible": false with an empty "items" array.
- Return only valid JSON with no comments, explanations, or markdown fences.

Here is my resume text:
[paste your resume here]`

const SAMPLE_JSON_SNIPPET = JSON_TEMPLATE

const JSONDropZone: FC<{
  onFileSelected: (file: File) => void
  isUploading: boolean
}> = ({ onFileSelected, isUploading }) => {
  const [isDragging, setIsDragging] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    if (!isDragging) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) {
      if (!file.name.toLowerCase().endsWith('.json')) {
        setFileError('Please upload a .json file.')
        return
      }
      setFileError(null)
      onFileSelected(file)
    }
  }

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.json')) {
      setFileError('Please upload a .json file.')
      return
    }
    setFileError(null)
    onFileSelected(file)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
      <label
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-6 text-center transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50/60' : 'border-slate-200 bg-white'
        }`}
      >
        <input
          type="file"
          accept=".json,application/json"
          onChange={handleFileInputChange}
          disabled={isUploading}
          className="hidden"
        />
        <UploadCloud size={28} className="text-blue-500" />
        <div className="text-base font-semibold text-slate-800">Drag and drop your JSON</div>
        <div className="text-sm text-slate-500">or click to browse</div>
        {isUploading && (
          <div className="flex items-center gap-2 text-xs text-blue-600">
            <Loader2 size={14} className="animate-spin" /> Uploading...
          </div>
        )}
      </label>
      {fileError && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          <AlertCircle size={14} />
          {fileError}
        </div>
      )}
      <p className="mt-3 text-xs text-slate-500">Your latest resume stays on this device for quick reloads.</p>
    </div>
  )
}

const ResumeIntake: FC<ResumeIntakeProps> = ({
  pastedJSON,
  onJSONChange,
  isJSONValid,
  jsonErrors,
  onLoadJSON,
  onJSONFileDrop,
  isUploadingJSON,
  rawResumeText,
  onRawTextChange,
  onConvertText,
  isConvertingText,
  textConversionError,
  onViewDemo
}) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const [copyError, setCopyError] = useState<string | null>(null)
  const [showSampleJSON, setShowSampleJSON] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [showManualJSON, setShowManualJSON] = useState(() => Boolean(pastedJSON))

  useEffect(() => {
    if (!copiedPrompt) return undefined
    const timer = window.setTimeout(() => setCopiedPrompt(false), 2400)
    return () => window.clearTimeout(timer)
  }, [copiedPrompt])

  useEffect(() => {
    if (!copyError) return undefined
    const timer = window.setTimeout(() => setCopyError(null), 4000)
    return () => window.clearTimeout(timer)
  }, [copyError])

  useEffect(() => {
    if (pastedJSON && !showManualJSON) {
      setShowManualJSON(true)
    }
  }, [pastedJSON, showManualJSON])
  const handleCopyPrompt = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(JSON_PROMPT_SNIPPET)
        setCopiedPrompt(true)
        setCopyError(null)
      } else {
        throw new Error('Clipboard API unavailable')
      }
    } catch (error) {
      console.error('Failed to copy prompt', error)
      setCopyError('Copy failed - highlight and copy the text manually.')
    }
  }

  const toggleSampleJSON = () => {
    setShowSampleJSON((value) => !value)
  }
  const toggleManualJSON = () => {
    setShowManualJSON((value) => !value)
  }

  const canLoadResume = Boolean(isJSONValid && pastedJSON.trim())
  const canContinue = rawResumeText.trim().length > 0

const renderPromptHelper = () => (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setShowPrompt((value) => !value)}
        className="flex w-full items-center justify-between px-5 py-4 text-left text-base font-semibold text-slate-800 transition hover:bg-slate-50"
      >
        <span className="inline-flex items-center gap-2">I’ll use my own AI</span>
        {showPrompt ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      {showPrompt && (
        <div className="space-y-4 border-t border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
          <p>Copy the prompt, ask your AI to respond with JSON, then paste the output back into this resume optimizer.</p>
          <button
            onClick={handleCopyPrompt}
            className="inline-flex items-center justify-center rounded-full bg-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700"
          >
            {copiedPrompt ? 'Prompt copied!' : 'Copy prompt'}
          </button>
          {copyError && (
            <p className="flex items-center gap-2 text-xs text-red-600">
              <AlertCircle size={12} />
              {copyError}
            </p>
          )}
          <pre className="max-h-48 overflow-y-auto rounded-lg bg-slate-900/90 px-3 py-3 text-xs font-mono text-slate-100 whitespace-pre-wrap">
            {JSON_PROMPT_SNIPPET}
          </pre>
          <div className="space-y-2">
            <button
              onClick={toggleSampleJSON}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              {showSampleJSON ? <EyeOff size={14} /> : <Eye size={14} />} {showSampleJSON ? 'Hide sample JSON' : 'Show sample JSON'}
            </button>
            {showSampleJSON && (
              <pre className="max-h-64 overflow-auto rounded-md border border-slate-200 bg-slate-900/80 px-3 py-3 text-xs font-mono text-slate-100">
                {SAMPLE_JSON_SNIPPET}
              </pre>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <a
              href="https://github.com/lyor/builtit-resume-builder/blob/main/docs/resume-json-template.md"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 font-semibold text-purple-700 hover:text-purple-800"
            >
              <ExternalLink size={14} />
              View template
            </a>
            <a
              href="https://rxresu.me/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 font-semibold text-blue-600 hover:text-blue-700"
            >
              <ExternalLink size={14} />
              Try Rx Resume
            </a>
          </div>
        </div>
      )}
    </div>
  )

  
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="print:hidden border-b bg-white">
        <div className="mx-auto max-w-3xl px-6 py-12 space-y-8">
          <header className="space-y-4 text-center">
            <h1 className="text-3xl font-bold text-slate-900">Step 1: Add Your Resume</h1>
            <p className="text-xs text-slate-500">
              Not ready to paste your resume?{' '}
              <button
                type="button"
                onClick={onViewDemo}
                className="font-semibold text-blue-600 underline-offset-2 hover:underline"
              >
                See the sample optimization →
              </button>
            </p>
          </header>

          <section className="space-y-2">
            <label className="text-sm font-semibold text-slate-700" htmlFor="resume-text-input">
              Paste your resume text here
            </label>
            <textarea
              id="resume-text-input"
              value={rawResumeText}
              onChange={(event) => onRawTextChange(event.target.value)}
              placeholder="Paste the plain-text version of your resume..."
              className="h-48 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              spellCheck={false}
            />
          </section>

          {textConversionError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              <div className="inline-flex items-center gap-2 font-semibold">
                <AlertCircle size={16} /> Continue failed
              </div>
              <p className="mt-1 text-xs">{textConversionError}</p>
            </div>
          )}

          <div className="space-y-3 text-center">
            <button
              type="button"
              onClick={onConvertText}
              disabled={isConvertingText || !canContinue}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isConvertingText ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Working...
                </>
              ) : (
                <>Continue</>
              )}
            </button>
            {!canContinue && (
              <p className="text-xs text-slate-500">Paste at least a few lines from your resume to continue.</p>
            )}
          </div>

          <section className="border-t border-slate-200 pt-6 text-center">
            <button
              type="button"
              onClick={toggleManualJSON}
              className="text-sm font-semibold text-blue-600 transition hover:text-blue-800"
            >
              ⚙️ Advanced: Import JSON resume instead
            </button>
          </section>

          {showManualJSON && (
            <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="space-y-3 text-left">
                <h2 className="text-xl font-semibold text-slate-900">Import JSON Resume</h2>
                <div className="flex items-start gap-3 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4 text-sm text-slate-700">
                  <Info size={16} className="mt-0.5 text-blue-600" />
                  <div className="space-y-1">
                    <p>Use JSON Resume format for precise control over your resume structure.</p>
                    <button
                      type="button"
                      onClick={() => window.open('https://jsonresume.org/schema/', '_blank', 'noopener')}
                      className="text-sm font-semibold text-blue-600 transition hover:text-blue-800"
                    >
                      What is this?
                    </button>
                  </div>
                </div>
              </div>

              <JSONDropZone onFileSelected={onJSONFileDrop} isUploading={isUploadingJSON} />

              <textarea
                id="resume-json-input"
                value={pastedJSON}
                onChange={(event) => onJSONChange(event.target.value)}
                placeholder="Paste your resume JSON here..."
                data-testid="json-textarea"
                className="h-72 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm font-mono text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                spellCheck={false}
              />

              {pastedJSON ? (
                isJSONValid === true ? (
                  <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-1.5 text-green-700">
                    <Check size={16} /> Valid JSON detected
                  </div>
                ) : isJSONValid === false ? (
                  <div className="space-y-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-600">
                    <div className="inline-flex items-center gap-2 font-semibold">
                      <AlertCircle size={16} /> Needs updates
                    </div>
                    <ul className="list-disc pl-6 text-xs">
                      {jsonErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                ) : null
              ) : null}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onLoadJSON}
                  disabled={!canLoadResume}
                  className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-5 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:text-blue-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Validate JSON
                </button>
                <button
                  type="button"
                  onClick={() => onJSONChange(SAMPLE_JSON_SNIPPET)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Load Sample JSON
                </button>
              </div>

              {renderPromptHelper()}

              <button
                type="button"
                onClick={() => setShowManualJSON(false)}
                className="text-sm font-semibold text-blue-600 transition hover:text-blue-800"
              >
                ← Back to text input
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResumeIntake
