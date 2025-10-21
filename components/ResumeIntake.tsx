"use client"

import Image from 'next/image'
import { FC, useEffect, useState } from 'react'
import {
  Code,
  Sparkles,
  Check,
  AlertCircle,
  Info,
  Loader2,
  Shield,
  ClipboardCopy,
  ClipboardCheck,
  Eye,
  EyeOff,
  ExternalLink,
  ArrowLeft,
  UploadCloud,
  KeyRound,
  Download,
  ChevronDown,
  ChevronUp
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
  onJSONFileDrop: (file: File) => void
  isUploadingJSON: boolean
  rawResumeText: string
  onRawTextChange: (value: string) => void
  onConvertText: () => void
  isConvertingText: boolean
  textConversionError: string | null
  hasStoredKey: boolean
  onOpenOnboarding: () => void
  onBackToDecision?: () => void
  geminiKeyInput: string
  geminiKeyStatus: 'idle' | 'success' | 'error'
  geminiKeyError: string | null
  isValidatingGeminiKey: boolean
  onGeminiKeyInputChange: (value: string) => void
  onSaveGeminiKey: () => void
  geminiKeyHelpUrl: string
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
  intakeMode,
  onIntakeModeChange,
  pastedJSON,
  onJSONChange,
  isJSONValid,
  jsonErrors,
  onLoadJSON,
  onDownloadJSON,
  onJSONFileDrop,
  isUploadingJSON,
  rawResumeText,
  onRawTextChange,
  onConvertText,
  isConvertingText,
  textConversionError,
  hasStoredKey,
  onOpenOnboarding,
  onBackToDecision,
  geminiKeyInput,
  geminiKeyStatus,
  geminiKeyError,
  isValidatingGeminiKey,
  onGeminiKeyInputChange,
  onSaveGeminiKey,
  geminiKeyHelpUrl
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
  const togglePrompt = () => {
    setShowPrompt((value) => !value)
  }

  const handleJsonMode = () => onIntakeModeChange('json')
  const handleTextMode = () => onIntakeModeChange('text')
  const jsonActive = intakeMode === 'json'
  const textActive = intakeMode === 'text'
  const promptPreview = JSON_PROMPT_SNIPPET.split('\n').slice(0, 3).join('\n')

  const canLoadResume = Boolean(isJSONValid && pastedJSON.trim())
  const canConvertText = Boolean(hasStoredKey && rawResumeText.trim())

  const toggleButtonClasses = (active: boolean) =>
    `inline-flex items-center gap-3 rounded-full border px-7 py-3.5 text-base font-semibold transition-all duration-150 ${
      active
        ? 'border-blue-400 bg-white text-slate-900 shadow-lg ring-2 ring-blue-100'
        : 'border-transparent text-slate-500 hover:border-blue-300 hover:bg-white hover:text-slate-800 hover:shadow-md hover:ring-2 hover:ring-blue-100'
    }`

  const renderPromptHelper = () => (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Sparkles size={16} className="text-purple-600" /> I’ll use my own AI
        </p>
        <button
          onClick={handleCopyPrompt}
          className="inline-flex items-center gap-2 rounded-md border border-transparent bg-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700"
        >
          {copiedPrompt ? <ClipboardCheck size={18} /> : <ClipboardCopy size={18} />}
          {copiedPrompt ? 'Prompt copied!' : 'Copy prompt'}
        </button>
      </div>
      <p className="text-xs text-slate-600">Share this schema with Gemini, ChatGPT, or Claude and paste the JSON it returns.</p>
      {copyError && (
        <p className="flex items-center gap-2 text-xs text-red-600">
          <AlertCircle size={12} />
          {copyError}
        </p>
      )}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <button
          onClick={togglePrompt}
          className={`flex w-full items-center justify-between px-3 py-2 text-xs font-semibold transition ${
            showPrompt ? 'bg-slate-50 text-slate-800' : 'text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span className="inline-flex items-center gap-2">
            {showPrompt ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showPrompt ? 'Hide prompt' : 'Preview prompt'}
          </span>
        </button>
        {showPrompt && (
          <pre className="max-h-48 overflow-y-auto bg-slate-900/90 px-3 py-3 text-xs font-mono text-slate-100 whitespace-pre-wrap">
            {JSON_PROMPT_SNIPPET}
          </pre>
        )}
        {!showPrompt && (
          <div className="relative border-t border-slate-200 bg-slate-900/85 px-3 py-2">
            <pre className="max-h-20 overflow-hidden whitespace-pre text-[11px] font-mono leading-5 text-slate-200">
              {`${promptPreview}\n...`}
            </pre>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-slate-900/90 to-transparent" />
          </div>
        )}
      </div>
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

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
        <p className="text-xs text-slate-500">Need a head start? Open the sample JSON or grab a template export.</p>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="https://github.com/lyor/builtit-resume-builder/blob/main/docs/resume-json-template.md"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-xs font-semibold text-purple-700 hover:text-purple-800"
          >
            <ExternalLink size={14} /> View template
          </a>
          <a
            href="https://rxresu.me/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            <ExternalLink size={14} /> Try Rx Resume for a quick export
          </a>
        </div>
      </div>
    </div>
  )

  const renderJsonMode = () => (
    <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="space-y-2">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
          <Code size={16} /> Upload or paste JSON
        </p>
        <h2 className="text-2xl font-semibold text-slate-900">Drop a JSON resume to get started fast</h2>
        <p className="text-sm text-slate-600">BuiltIt checks formatting automatically. You can still open the paste view if you want to edit by hand.</p>
      </header>

      <div className="space-y-5">
        <JSONDropZone onFileSelected={onJSONFileDrop} isUploading={isUploadingJSON} />

        <button
          type="button"
          onClick={toggleManualJSON}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"
        >
          {showManualJSON ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {showManualJSON ? 'Hide manual paste' : 'Paste or edit JSON manually'}
        </button>

        {showManualJSON && (
          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="resume-json-input">
              Resume JSON
            </label>
            <textarea
              id="resume-json-input"
              value={pastedJSON}
              onChange={(event) => onJSONChange(event.target.value)}
              onFocus={handleJsonMode}
              placeholder="Paste your resume JSON here..."
              data-testid="json-textarea"
              className="h-48 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm font-mono text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              spellCheck={false}
            />
          </div>
        )}

        <div className="space-y-3 text-sm">
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
          ) : (
            <p className="text-slate-500">Drop a JSON file above or open the manual paste view if you need to edit.</p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onLoadJSON}
              disabled={!canLoadResume}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <UploadCloud size={16} /> Load resume
            </button>
            <button
              type="button"
              onClick={onDownloadJSON}
              disabled={!pastedJSON}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download size={16} /> Download JSON
            </button>
          </div>
        </div>
      </div>
    </section>
  )

  const renderTextMode = () => (
    <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="space-y-2">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-purple-600">
          <Sparkles size={16} /> Convert text
        </p>
        <h2 className="text-2xl font-semibold text-slate-900">Turn plain text into the BuiltIt JSON format</h2>
        <p className="text-sm text-slate-600">Save your Gemini key once, paste your resume text, and convert. Everything stays in your browser.</p>
      </header>

      <div className="space-y-3 rounded-xl border border-purple-100 bg-purple-50/60 p-4 text-sm text-purple-700">
        <span>{hasStoredKey ? 'Gemini key saved locally and ready to use.' : 'Add your free Gemini key so the conversion runs privately on this device.'}</span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => window.open(geminiKeyHelpUrl, '_blank', 'noopener')}
            className="inline-flex items-center gap-2 rounded-md border border-purple-200 bg-white px-4 py-2 text-sm font-semibold text-purple-700 transition-colors hover:border-purple-300 hover:text-purple-800"
          >
            <ExternalLink size={16} /> Get a free key
          </button>
          <button
            type="button"
            onClick={onOpenOnboarding}
            className="inline-flex items-center gap-2 rounded-md border border-transparent bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-purple-700"
          >
            <Sparkles size={16} /> Gemini setup guide
          </button>
        </div>
      </div>

      <div className="space-y-2 text-sm text-slate-600">
        <label className="font-semibold" htmlFor="gemini-key-helper">
          Gemini API key
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <input
            id="gemini-key-helper"
            type="password"
            value={geminiKeyInput}
            onChange={(event) => onGeminiKeyInputChange(event.target.value)}
            onFocus={handleTextMode}
            placeholder={hasStoredKey ? 'Key saved. Paste a new key to update.' : 'Paste your Gemini API key'}
            className="flex-1 rounded border border-slate-200 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={() => {
              void onSaveGeminiKey()
            }}
            disabled={isValidatingGeminiKey || (!geminiKeyInput.trim() && !hasStoredKey)}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isValidatingGeminiKey ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
            Save key
          </button>
        </div>
        {geminiKeyStatus === 'success' && (
          <div className="inline-flex items-center gap-2 text-xs text-green-600">
            <Check size={14} /> Key saved locally.
          </div>
        )}
        {geminiKeyStatus === 'error' && geminiKeyError && (
          <div className="inline-flex items-center gap-2 text-xs text-red-600">
            <AlertCircle size={14} /> {geminiKeyError}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="resume-text-input">
          Resume text
        </label>
        <textarea
          id="resume-text-input"
          value={rawResumeText}
          onChange={(event) => onRawTextChange(event.target.value)}
          onFocus={handleTextMode}
          placeholder="Paste the plain-text version of your resume..."
          className="h-48 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
          spellCheck={false}
        />
      </div>

      {textConversionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          <div className="inline-flex items-center gap-2 font-semibold">
            <AlertCircle size={16} /> Conversion failed
          </div>
          <p className="mt-1 text-xs">{textConversionError}</p>
        </div>
      )}

      {!hasStoredKey && (
        <div className="inline-flex items-center gap-2 text-xs text-blue-700">
          <Info size={14} /> Paste your key to unlock conversion. It takes about a minute to grab one.
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onConvertText}
          disabled={isConvertingText || !canConvertText}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isConvertingText ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Converting...
            </>
          ) : (
            <>
              <Sparkles size={16} /> Convert to JSON
            </>
          )}
        </button>
        <p className="text-xs text-slate-500">Converted resumes stay local; download anytime from the workspace.</p>
      </div>

      {renderPromptHelper()}
    </section>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="print:hidden border-b bg-white">
        <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
          {onBackToDecision && (
            <div>
              <button
                onClick={onBackToDecision}
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft size={14} />
                Back
              </button>
            </div>
          )}

          <div className="space-y-5 text-center">
            <div className="flex justify-center">
              <Image src="/logo.svg" alt="BuiltIt logo" width={48} height={48} priority />
            </div>
            <h1 className="text-4xl font-bold text-slate-900">Bring your resume into BuiltIt</h1>
            <p className="text-base text-slate-600">
              Choose the path that fits. Paste valid JSON or convert plain text with your Gemini key — everything stays in your browser.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-blue-700">
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2">
                <Shield size={14} /> Private by design
              </span>
              <button
                type="button"
                onClick={onOpenOnboarding}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"
              >
                <Sparkles size={14} className="text-blue-500" /> Gemini setup guide
              </button>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-3 shadow-md">
              <button
                type="button"
                className={toggleButtonClasses(jsonActive)}
                onClick={handleJsonMode}
                aria-pressed={jsonActive}
              >
                <Code size={18} /> Paste JSON
              </button>
              <button
                type="button"
                className={toggleButtonClasses(textActive)}
                onClick={handleTextMode}
                aria-pressed={textActive}
              >
                <Sparkles size={18} /> Convert text
              </button>
            </div>
          </div>

          {jsonActive ? renderJsonMode() : renderTextMode()}
        </div>
      </div>
    </div>
  )
}

export default ResumeIntake
