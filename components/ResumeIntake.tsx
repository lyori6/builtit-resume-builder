"use client"

import Image from 'next/image'
import { FC, useEffect, useState } from 'react'
import {
  Code,
  Check,
  AlertCircle,
  Info,
  Sparkles,
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
  Download
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
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-4">
      <label
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-6 text-center transition-colors ${
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
        <div className="text-base font-semibold text-slate-800">Drag and drop your JSON file</div>
        <div className="text-sm text-slate-500">or click to browse from your computer</div>
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
      <p className="mt-3 text-sm text-slate-500">
        We keep the latest JSON you load on this device so you can pick up where you left off.
      </p>
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

  const PromptHelper = (
    title: string,
    description: string,
    highlightText?: string
  ) => (
    <div className="space-y-3 rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Sparkles size={16} className="text-blue-600" />
            {title}
          </p>
          <p className="text-xs text-slate-600">{description}</p>
          {highlightText && <p className="mt-1 text-xs font-medium text-blue-600">{highlightText}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyPrompt}
            className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-100"
          >
            {copiedPrompt ? <ClipboardCheck size={14} /> : <ClipboardCopy size={14} />}
            {copiedPrompt ? 'Prompt copied!' : 'Copy prompt'}
          </button>
          <a
            href="https://rxresu.me/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"
          >
            <ExternalLink size={14} />
            Try Rx Resume
          </a>
        </div>
      </div>
      {copyError && (
        <p className="flex items-center gap-2 text-xs text-red-600">
          <AlertCircle size={12} />
          {copyError}
        </p>
      )}
      <pre className="max-h-48 overflow-y-auto rounded-md bg-slate-900/90 px-3 py-3 text-xs font-mono text-slate-100 whitespace-pre-wrap">
        {JSON_PROMPT_SNIPPET}
      </pre>
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
        <button
          onClick={toggleSampleJSON}
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-1.5 font-semibold transition-colors hover:border-slate-300 hover:text-slate-800"
        >
          {showSampleJSON ? <EyeOff size={14} /> : <Eye size={14} />}
          {showSampleJSON ? 'Hide sample JSON' : 'Show sample JSON'}
        </button>
        <a
          href="https://github.com/lyor/builtit-resume-builder/blob/main/docs/resume-json-template.md"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 font-semibold text-blue-600 hover:text-blue-700"
        >
          <ExternalLink size={14} />
          View full template
        </a>
      </div>
      {showSampleJSON && (
        <pre className="max-h-64 overflow-auto rounded-md border border-slate-200 bg-slate-900/80 px-3 py-3 text-xs font-mono text-slate-100">
          {SAMPLE_JSON_SNIPPET}
        </pre>
      )}
    </div>
  )

  const handleJsonMode = () => onIntakeModeChange('json')
  const handleTextMode = () => onIntakeModeChange('text')
  const jsonActive = intakeMode === 'json'
  const textActive = intakeMode === 'text'

  const jsonCardClasses = `flex h-full flex-col rounded-2xl border p-6 transition-all duration-200 cursor-pointer ${
    jsonActive
      ? 'border-blue-600 bg-white shadow-xl'
      : 'border-slate-200 bg-slate-100 hover:border-blue-400 hover:bg-blue-50 hover:shadow-lg'
  }`
  const textCardClasses = `flex h-full flex-col rounded-2xl border p-6 transition-all duration-200 cursor-pointer ${
    textActive
      ? 'border-purple-600 bg-white shadow-xl'
      : 'border-slate-200 bg-slate-100 hover:border-purple-400 hover:bg-purple-50 hover:shadow-lg'
  }`
  const canLoadResume = Boolean(isJSONValid && pastedJSON.trim())
  const canConvertText = Boolean(hasStoredKey && rawResumeText.trim())

  const jsonBadgeClasses = jsonActive
    ? 'inline-flex items-center gap-2 text-sm font-semibold text-blue-600'
    : 'inline-flex items-center gap-2 text-sm font-semibold text-slate-400'
  const jsonTitleClasses = jsonActive ? 'text-3xl font-bold text-slate-900' : 'text-3xl font-bold text-slate-500'
  const jsonBodyTextClasses = jsonActive ? 'text-base text-slate-600' : 'text-base text-slate-500'

  const textBadgeClasses = textActive
    ? 'inline-flex items-center gap-2 text-sm font-semibold text-purple-600'
    : 'inline-flex items-center gap-2 text-sm font-semibold text-slate-400'
  const textTitleClasses = textActive ? 'text-3xl font-bold text-slate-900' : 'text-3xl font-bold text-slate-500'
  const textBodyTextClasses = textActive ? 'text-base text-slate-600' : 'text-base text-slate-500'

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="print:hidden border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="space-y-6">
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

            <div className="text-center space-y-5">
              <div className="flex justify-center">
                <Image src="/logo.svg" alt="BuiltIt logo" width={56} height={56} priority />
              </div>
              <h1 className="text-4xl font-bold text-slate-900">BuiltIt Resume Builder</h1>
              <p className="text-lg text-slate-600">BuiltIt runs entirely in your browser with your own free Gemini API key.</p>
              <div className="mx-auto max-w-xl space-y-2 text-left text-base text-slate-600 sm:text-center">
                <p className="font-semibold text-slate-700">You only need two things:</p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Create a free Gemini API key at Google AI Studio so the experience stays private and self-sufficient.</li>
                  <li>Provide your resume JSON or paste plain text and let BuiltIt convert it instantly.</li>
                </ol>
              </div>
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                <span className="inline-flex items-center gap-3 rounded-full bg-blue-50 px-5 py-2 text-sm font-medium text-blue-700">
                  <Shield size={16} /> Secure &amp; private · Nothing leaves your browser
                </span>
                <button
                  type="button"
                  onClick={onOpenOnboarding}
                  className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"
                >
                  <Sparkles size={16} className="text-blue-500" /> Gemini setup guide
                </button>
              </div>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <section className={jsonCardClasses} onClick={handleJsonMode}>
                <header className="space-y-3">
                  <span className={jsonBadgeClasses}>
                    <span className={jsonActive ? 'rounded-full bg-blue-100 p-3 text-blue-600' : 'rounded-full bg-slate-200 p-3 text-slate-400'}>
                      <Code size={16} />
                    </span>
                    I already have JSON
                  </span>
                  <h2 className={jsonTitleClasses}>Paste or upload your JSON</h2>
                  <p className={jsonBodyTextClasses}>Paste your JSON or drag in a file below. BuiltIt validates it as you go so you can load the workspace instantly.</p>
                </header>

                <div className="mt-4 space-y-2">
                  <label className="text-sm font-semibold uppercase tracking-wide text-slate-500" htmlFor="resume-json-input">
                    Resume JSON
                  </label>
                  <textarea
                    id="resume-json-input"
                    value={pastedJSON}
                    onChange={(event) => onJSONChange(event.target.value)}
                    onFocus={handleJsonMode}
                    placeholder="Paste your resume JSON here..."
                    data-testid="json-textarea"
                    className="h-48 w-full rounded-lg border border-slate-200 px-4 py-3 text-base font-mono text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    spellCheck={false}
                  />
                </div>

                <div className="mt-4 space-y-3 text-base">
                  {pastedJSON ? (
                    isJSONValid === true ? (
                      <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-1.5 text-green-700">
                        <Check size={18} /> Valid JSON detected
                      </div>
                    ) : isJSONValid === false ? (
                      <div className="space-y-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-600">
                        <div className="inline-flex items-center gap-2 font-semibold">
                          <AlertCircle size={18} /> Needs updates
                        </div>
                        <ul className="list-disc pl-6 text-sm">
                          {jsonErrors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null
                  ) : (
                    <p className={jsonBodyTextClasses}>Paste your JSON above or drag a file into the drop zone below. We keep your latest resume on this device.</p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={onLoadJSON}
                      disabled={!canLoadResume}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <UploadCloud size={18} /> Load resume
                    </button>
                    <button
                      type="button"
                      onClick={onDownloadJSON}
                      disabled={!pastedJSON}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-2.5 text-base font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Download size={18} /> Download JSON
                    </button>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <JSONDropZone onFileSelected={onJSONFileDrop} isUploading={isUploadingJSON} />
                </div>
              </section>

              <section className={textCardClasses} onClick={handleTextMode}>
                <header className="space-y-3">
                  <span className={textBadgeClasses}>
                    <span className={textActive ? 'rounded-full bg-purple-100 p-3 text-purple-600' : 'rounded-full bg-slate-200 p-3 text-slate-400'}>
                      <Sparkles size={16} />
                    </span>
                    Help me create JSON
                  </span>
                  <h2 className={textTitleClasses}>Convert resume text with your Gemini key</h2>
                  <p className={textBodyTextClasses}>Copy a prompt for your AI or let BuiltIt convert plain text in one step.</p>
                </header>

                <details className="mt-4 rounded-lg border border-purple-100 bg-white">
                  <summary className="cursor-pointer px-4 py-2 text-sm font-semibold text-purple-700">
                    Copy a prompt for your AI
                  </summary>
                  <div className="space-y-3 border-t border-purple-100 px-4 py-4">
                    {PromptHelper(
                      'Ask your AI to output JSON',
                      'Share this schema with Gemini, ChatGPT, or Claude and paste the result back here if you prefer DIY.'
                    )}
                  </div>
                </details>

                <div className="mt-4 space-y-4">
                  <div className="flex flex-col gap-2 rounded-lg border border-purple-100 bg-purple-50 px-4 py-3 text-sm text-purple-700 sm:flex-row sm:items-center sm:justify-between">
                    <span>
                      {hasStoredKey
                        ? 'Gemini key saved locally and ready to convert.'
                        : 'Use your own free Gemini key so conversions stay private on this device.'}
                    </span>
                    <button
                      type="button"
                      onClick={() => window.open(geminiKeyHelpUrl, '_blank', 'noopener')}
                      className="inline-flex items-center gap-2 rounded-md border border-purple-200 bg-white px-4 py-2 text-sm font-semibold text-purple-700 transition-colors hover:border-purple-300 hover:text-purple-800"
                    >
                      <ExternalLink size={16} /> Get a free key
                    </button>
                  </div>

                  <div className="space-y-2 text-sm text-slate-600">
                    <label className="font-semibold text-slate-600" htmlFor="gemini-key-helper">
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
                        className="flex-1 rounded border border-slate-200 px-3 py-2 text-base focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                        spellCheck={false}
                      />
                      <button
                        type="button"
                        onClick={() => { void onSaveGeminiKey() }}
                        disabled={isValidatingGeminiKey || (!geminiKeyInput.trim() && !hasStoredKey)}
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-purple-600 px-5 py-2.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {isValidatingGeminiKey ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />}
                        Save key
                      </button>
                    </div>
                    {geminiKeyStatus === 'success' && (
                      <div className="inline-flex items-center gap-2 text-sm text-green-600">
                        <Check size={16} /> Key saved locally.
                      </div>
                    )}
                    {geminiKeyStatus === 'error' && geminiKeyError && (
                      <div className="inline-flex items-center gap-2 text-sm text-red-600">
                        <AlertCircle size={16} /> {geminiKeyError}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold uppercase tracking-wide text-slate-500" htmlFor="resume-text-input">
                      Resume text
                    </label>
                    <textarea
                      id="resume-text-input"
                      value={rawResumeText}
                      onChange={(event) => onRawTextChange(event.target.value)}
                      onFocus={handleTextMode}
                      placeholder="Paste the plain-text version of your resume..."
                      className="h-48 w-full rounded-lg border border-slate-200 px-4 py-3 text-base text-slate-800 shadow-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
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
                    <div className="inline-flex items-center gap-2 text-sm text-blue-700">
                      <Info size={16} /> Paste your key above to enable conversion. Grabbing one from Google AI Studio takes about a minute.
                    </div>
                  )}

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={onConvertText}
                      disabled={isConvertingText || !canConvertText}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isConvertingText ? (
                        <>
                          <Loader2 size={18} className="animate-spin" /> Converting...
                        </>
                      ) : (
                        <>
                          <Sparkles size={18} /> Convert to JSON
                        </>
                      )}
                    </button>
                    <p className="text-sm text-slate-500">Converted resumes stay local; download anytime from the workspace.</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResumeIntake
