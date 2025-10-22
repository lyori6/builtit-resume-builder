"use client"

import Image from 'next/image'
import { FC, useEffect, useState, useRef, type RefObject } from 'react'
import {
  Code,
  Sparkles,
  Check,
  AlertCircle,
  Info,
  Loader2,
  Shield,
  Eye,
  EyeOff,
  ExternalLink,
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
  onDeleteGeminiKey: () => void
  geminiKeyInput: string
  geminiKeyStatus: 'idle' | 'success' | 'error'
  geminiKeyError: string | null
  isValidatingGeminiKey: boolean
  onGeminiKeyInputChange: (value: string) => void
  onSaveGeminiKey: () => Promise<boolean> | void
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
  onDeleteGeminiKey,
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
  const jsonSectionRef = useRef<HTMLDivElement | null>(null)
  const textSectionRef = useRef<HTMLDivElement | null>(null)

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

  const handleJsonMode = () => onIntakeModeChange('json')
  const handleTextMode = () => onIntakeModeChange('text')
  const jsonActive = intakeMode === 'json'
  const textActive = intakeMode === 'text'

  const canLoadResume = Boolean(isJSONValid && pastedJSON.trim())
  const canConvertText = Boolean(hasStoredKey && rawResumeText.trim())

  const startingCardClasses = (active: boolean, variant: 'json' | 'text') => {
    if (variant === 'json') {
      return [
        'group relative flex h-full flex-col gap-4 rounded-3xl border px-7 py-7 text-left transition-all duration-200 focus:outline-none focus-visible:ring-4',
        active
          ? 'border-blue-400 bg-white text-slate-900 shadow-xl ring-4 ring-blue-200 shadow-blue-200/70'
          : 'border-transparent bg-slate-100/70 text-slate-600 hover:border-blue-200 hover:bg-white hover:text-slate-800 hover:shadow-lg hover:shadow-blue-200/60'
      ].join(' ')
    }

    return [
      'group relative flex h-full flex-col gap-4 rounded-3xl border px-7 py-7 text-left transition-all duration-200 focus:outline-none focus-visible:ring-4',
      active
        ? 'border-purple-400 bg-white text-slate-900 shadow-xl ring-4 ring-purple-200 shadow-purple-200/70'
        : 'border-transparent bg-slate-100/70 text-slate-600 hover:border-purple-200 hover:bg-white hover:text-slate-800 hover:shadow-lg hover:shadow-purple-200/60'
    ].join(' ')
  }

  const renderPromptHelper = () => (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setShowPrompt((value) => !value)}
        className="flex w-full items-center justify-between px-5 py-4 text-left text-base font-semibold text-slate-800 transition hover:bg-slate-50"
      >
        <span className="inline-flex items-center gap-3">
          <Sparkles size={20} className="text-purple-600" />
          I’ll use my own AI
        </span>
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

  const renderJsonMode = (sectionRef: RefObject<HTMLDivElement>) => (
    <section ref={sectionRef} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="space-y-2">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
          <Code size={16} /> Import JSON resume
        </p>
        <h2 className="text-2xl font-semibold text-slate-900">Drop your JSON or paste it into the editor</h2>
        <p className="text-sm text-slate-600">Everything you load stays on this device. Switch to the editor if you need to tweak fields by hand.</p>
      </header>

      <div className="space-y-5">
        <JSONDropZone onFileSelected={onJSONFileDrop} isUploading={isUploadingJSON} />

        <button
          type="button"
          onClick={toggleManualJSON}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"
        >
          {showManualJSON ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {showManualJSON ? 'Hide JSON editor' : 'Open JSON editor'}
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
              className="h-72 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm font-mono text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
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
            <p className="text-slate-500">Drop a JSON file above or open the editor to paste your resume.</p>
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

  const renderTextMode = (sectionRef: RefObject<HTMLDivElement>) => (
    <section ref={sectionRef} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="space-y-2">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-purple-600">
          <Sparkles size={16} /> Convert plain text
        </p>
        <h2 className="text-2xl font-semibold text-slate-900">Turn resume text into clean JSON</h2>
        <p className="text-sm text-slate-600">Add your Gemini key, paste raw text, and convert to the schema this resume optimizer understands.</p>
      </header>

      <div className="space-y-3 rounded-xl border border-purple-100 bg-purple-50/60 p-4 text-sm text-purple-700">
        <span>{hasStoredKey ? 'Gemini key saved locally and ready to use.' : 'Add your free Gemini key so the conversion runs privately on this device.'}</span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => window.open(geminiKeyHelpUrl, '_blank', 'noopener')}
            className="inline-flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-purple-700"
          >
            <ExternalLink size={16} /> Get a free key
          </button>
          <button
            type="button"
            onClick={onOpenOnboarding}
            className="inline-flex items-center gap-2 rounded-md border border-purple-200 bg-white px-4 py-2 text-sm font-semibold text-purple-700 transition-colors hover:border-purple-300 hover:text-purple-800"
          >
            <Sparkles size={16} /> Gemini setup guide
          </button>
        </div>
      </div>

      <div className="space-y-2 text-sm text-slate-600">
        <label className="font-semibold" htmlFor="gemini-key-helper">
          Gemini API key
        </label>
        {hasStoredKey ? (
          <div className="flex flex-col gap-3 rounded-lg border border-purple-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="inline-flex items-center gap-2 text-purple-700">
              <Check size={16} /> Key saved on this device. Conversion runs locally.
            </span>
            <button
              type="button"
              onClick={onDeleteGeminiKey}
              className="inline-flex items-center justify-center rounded-md border border-purple-200 px-4 py-2 text-sm font-semibold text-purple-700 transition hover:border-purple-300 hover:text-purple-800"
            >
              Clear key
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <input
                id="gemini-key-helper"
                type="password"
                value={geminiKeyInput}
                onChange={(event) => onGeminiKeyInputChange(event.target.value)}
                onFocus={handleTextMode}
                placeholder="Paste your Gemini API key"
                className="flex-1 rounded border border-slate-200 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => {
                  void onSaveGeminiKey()
                }}
                disabled={isValidatingGeminiKey || !geminiKeyInput.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isValidatingGeminiKey ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                Save key
              </button>
            </div>
            {geminiKeyStatus === 'error' && geminiKeyError && (
              <div className="inline-flex items-center gap-2 text-xs text-red-600">
                <AlertCircle size={14} /> {geminiKeyError}
              </div>
            )}
          </>
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-start">
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
      </div>

      {renderPromptHelper()}
    </section>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="print:hidden border-b bg-white">
        <div className="mx-auto max-w-5xl px-6 py-12 space-y-10">
          <div className="space-y-5 text-center">
            <div className="flex justify-center">
              <Image src="/logo.svg" alt="BuiltIt logo" width={48} height={48} priority />
            </div>
            <h1 className="text-4xl font-bold text-slate-900">Import your resume and start optimizing</h1>
            <div className="mx-auto max-w-2xl space-y-3 text-base text-slate-600">
              <p>We’ll need your resume in JSON format so this resume optimizer can make precise updates.</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-blue-700">
              <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-5 py-2">
                <Shield size={14} /> Private by design
              </span>
              <div className="group relative inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-slate-600 transition hover:border-slate-300 hover:text-slate-900">
                <Code size={14} className="text-blue-500" />
                What is JSON?
                <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-3 w-[min(28rem,90vw)] -translate-x-1/2 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-left text-xs font-medium text-blue-700 shadow-lg opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  JSON is a programmatic format. Your resume text becomes labeled fields, so this optimizer can update targeted sections without touching the rest.
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              className={startingCardClasses(textActive, 'text')}
              onClick={handleTextMode}
              aria-pressed={textActive}
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 shadow-inner group-hover:bg-purple-200">
                <Sparkles size={32} />
              </span>
              <div className="space-y-1">
                <p className="text-xl font-semibold">Convert my resume to JSON</p>
                <p className="text-sm text-slate-500 group-hover:text-slate-600">
                  Paste raw text and let Gemini build the JSON for you.
                </p>
              </div>
              <span
                className={`pointer-events-none absolute inset-0 rounded-3xl border-2 transition-opacity ${
                  textActive ? 'border-purple-300 opacity-100' : 'border-transparent opacity-0 group-hover:opacity-80'
                }`}
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              className={startingCardClasses(jsonActive, 'json')}
              onClick={handleJsonMode}
              aria-pressed={jsonActive}
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-inner group-hover:bg-blue-200">
                <Code size={32} />
              </span>
              <div className="space-y-1">
                <p className="text-xl font-semibold">Use my JSON resume</p>
                <p className="text-sm text-slate-500 group-hover:text-slate-600">
                  Drop a JSON file or paste the schema you already have.
                </p>
              </div>
              <span
                className={`pointer-events-none absolute inset-0 rounded-3xl border-2 transition-opacity ${
                  jsonActive ? 'border-blue-300 opacity-100' : 'border-transparent opacity-0 group-hover:opacity-80'
                }`}
                aria-hidden="true"
              />
            </button>
          </div>

          {jsonActive ? renderJsonMode(jsonSectionRef) : renderTextMode(textSectionRef)}
        </div>
      </div>
    </div>
  )
}

export default ResumeIntake
