"use client"

import { FC, useEffect, useState } from 'react'
import {
  Code,
  FileText,
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
  KeyRound
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
  showModeToggle?: boolean
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
}`;

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
[paste your resume here]`;

const SAMPLE_JSON_SNIPPET = JSON_TEMPLATE;

const JSONDropZone: FC<{
  onFileSelected: (file: File) => void
  isUploading: boolean
  pastedJSON: string
  onJSONChange: (value: string) => void
}> = ({ onFileSelected, isUploading, pastedJSON, onJSONChange }) => {
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
    <div className="space-y-3">
      <label
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50/60' : 'border-gray-300 bg-white'
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
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Drag & drop your JSON file here
          </p>
          <p className="text-xs text-gray-500">or click to browse from your computer</p>
        </div>
        {isUploading && (
          <div className="flex items-center gap-2 text-xs text-blue-600">
            <Loader2 size={14} className="animate-spin" />
            Uploading...
          </div>
        )}
      </label>
      {fileError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          <AlertCircle size={14} />
          {fileError}
        </div>
      )}
      <textarea
        value={pastedJSON}
        onChange={(event) => onJSONChange(event.target.value)}
        placeholder="Or paste your resume JSON here..."
        className="w-full h-48 px-4 py-3 text-sm font-mono border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        spellCheck={false}
      />
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
  showModeToggle = true,
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
  };

  const toggleSampleJSON = () => {
    setShowSampleJSON((value) => !value);
  };

  const PromptHelper = (
    title: string,
    description: string,
    highlightText?: string
  ) => (
    <div className="space-y-3 rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <Sparkles size={16} className="text-blue-600" />
            {title}
          </p>
          <p className="text-xs text-gray-600">{description}</p>
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
            className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-900"
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
      <pre className="max-h-48 overflow-y-auto rounded-md bg-gray-900/90 px-3 py-3 text-xs font-mono text-gray-100 whitespace-pre-wrap">
        {JSON_PROMPT_SNIPPET}
      </pre>
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
        <button
          onClick={toggleSampleJSON}
          className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-1.5 font-semibold transition-colors hover:border-gray-300 hover:text-gray-800"
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
        <pre className="max-h-64 overflow-auto rounded-md border border-gray-200 bg-gray-900/80 px-3 py-3 text-xs font-mono text-gray-100">
          {SAMPLE_JSON_SNIPPET}
        </pre>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="print:hidden p-4 bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto">
          <div className="py-8 space-y-6">
            {onBackToDecision && (
              <div>
                <button
                  onClick={onBackToDecision}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft size={14} />
                  Back
                </button>
              </div>
            )}
            <div className="text-center space-y-3">
              <h1 className="text-2xl font-bold text-gray-900 mb-3">BuiltIt Resume Builder</h1>
              <p className="text-gray-600">
                Bring your resume as JSON or plain text, connect your Gemini key, and start tailoring it for new roles.
              </p>
              <p className="text-xs text-gray-500">
                MVP keeps things simple: load one resume at a time, tweak it, and download it with no history to manage.
              </p>
              <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1 text-xs font-medium text-blue-700">
                  <Shield size={14} />
                  Free to use · Everything stays in your browser
                </div>
                <button
                  onClick={onOpenOnboarding}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 hover:border-gray-400 transition-colors"
                >
                  <Sparkles size={14} className="text-blue-500" />
                  Open guided setup
                </button>
              </div>
          </div>

          {showModeToggle && (
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-stretch rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="relative group">
                  <button
                    onClick={() => onIntakeModeChange('json')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-l-lg ${
                      intakeMode === 'json' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Code size={16} />
                    Paste JSON
                  </button>
                  <div className="pointer-events-none absolute left-1/2 top-full z-10 hidden w-72 -translate-x-1/2 translate-y-2 rounded-md border border-gray-200 bg-white p-3 text-xs text-gray-600 shadow-lg group-hover:flex group-focus-within:flex">
                    <p className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-blue-600">
                      <Info size={12} />
                      Quick tip
                    </p>
                    <p className="leading-relaxed">
                      Ask Gemini, ChatGPT, or Claude to convert your resume with the helper below or grab an export from Rx Resume.
                    </p>
                  </div>
                </div>
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
          )}

          <div className="max-w-2xl mx-auto bg-gray-50 rounded-lg p-6 border border-gray-200 space-y-4 text-left">
            {intakeMode === 'json' ? (
              <>
                <p className="text-sm text-gray-600">
                  Already have a resume in JSON? Drop the file or paste it below. Need a refresher on the schema? Grab the prompt and template first.
                </p>
                {PromptHelper(
                  'Generate JSON with your AI',
                  'Copy these instructions for Gemini, ChatGPT, or Claude, then paste the JSON back here once it looks good.'
                )}
                <JSONDropZone
                  onFileSelected={onJSONFileDrop}
                  isUploading={isUploadingJSON}
                  pastedJSON={pastedJSON}
                  onJSONChange={onJSONChange}
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
                    Tip: Use the prompt helper above to generate valid JSON, then load it. Only the most recent resume stays saved for quick edits.
                  </div>
                )}
              </>
            ) : (
              <>
                {PromptHelper(
                  'Ask your AI to create a JSON resume',
                  'Use this prompt to generate a valid JSON export. Once you have it, switch back to the JSON tab to upload or paste it.',
                  'Prefer not to switch tabs? Let BuiltIt convert your resume text below.'
                )}

                <div className="space-y-3 rounded-lg border border-purple-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <Sparkles size={16} className="text-purple-600" />
                        Let BuiltIt convert your resume text
                      </p>
                      <p className="text-xs text-gray-600">
                        Works with Google AI Studio on the free tier. Your key stays in this browser; we never send it to our servers.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => window.open(geminiKeyHelpUrl, '_blank', 'noopener')}
                        className="inline-flex items-center gap-2 rounded-md border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 transition-colors hover:border-purple-300 hover:bg-purple-100"
                      >
                        <ExternalLink size={14} />
                        Get a free key
                      </button>
                      <button
                        type="button"
                        onClick={onOpenOnboarding}
                        className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-900"
                      >
                        How it works
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-gray-600">
                    <p className="font-semibold text-gray-700">Quick steps</p>
                    <p>1. Copy your resume text (Google Docs, Notion, LinkedIn, etc.).</p>
                    <p>
                      2. Sign in to Google AI Studio to grab your free Gemini key. We store it locally so you can remove it anytime.
                    </p>
                    <p>3. Paste your resume text below and tap convert. We will produce JSON you can download or keep for tailoring.</p>
                  </div>

                  <div className="space-y-2 text-xs text-gray-600">
                    <label className="font-semibold text-gray-700" htmlFor="gemini-key-helper">
                      Gemini API key
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                      <input
                        id="gemini-key-helper"
                        type="password"
                        value={geminiKeyInput}
                        onChange={(event) => onGeminiKeyInputChange(event.target.value)}
                        placeholder={hasStoredKey ? 'Key saved. Paste a new key to update.' : 'Paste your Gemini API key'}
                        className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        spellCheck={false}
                      />
                      <button
                        type="button"
                        onClick={() => { void onSaveGeminiKey() }}
                        disabled={isValidatingGeminiKey || (!geminiKeyInput.trim() && !hasStoredKey)}
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isValidatingGeminiKey ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                        Save key
                      </button>
                    </div>
                    {geminiKeyStatus === 'success' && (
                      <div className="flex items-center gap-2 text-xs text-green-600">
                        <Check size={14} />
                        Key saved locally.
                      </div>
                    )}
                    {geminiKeyStatus === 'error' && geminiKeyError && (
                      <div className="flex items-center gap-2 text-xs text-red-600">
                        <AlertCircle size={14} />
                        {geminiKeyError}
                      </div>
                    )}
                  </div>

                  <div className="rounded-md bg-purple-50 px-3 py-2 text-xs text-purple-700">
                    {hasStoredKey
                      ? "Gemini key saved locally - you're ready to convert."
                      : "No key saved yet. You'll need one to run the conversion (free, stored only in this browser)."}
                  </div>

                  <textarea
                    value={rawResumeText}
                    onChange={(event) => onRawTextChange(event.target.value)}
                    placeholder="Paste the plain-text version of your resume..."
                    className="w-full h-48 px-4 py-3 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    spellCheck={false}
                  />

                  {textConversionError && (
                    <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                      <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">Conversion failed</p>
                        <p>{textConversionError}</p>
                      </div>
                    </div>
                  )}

                  {!hasStoredKey && (
                    <div className="flex items-start gap-2 text-xs text-blue-700">
                      <Info size={14} className="mt-0.5 flex-shrink-0" />
                      <span>
                        Add your Gemini key to enable conversion. Use the buttons above if you need a quick walkthrough.
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3">
                    <button
                      onClick={onConvertText}
                      disabled={isConvertingText || !rawResumeText.trim() || !hasStoredKey}
                      className="inline-flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                    <p className="text-xs text-gray-500">
                      We keep only the latest converted resume in this browser. Download anytime from the workspace.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
  )
}

export default ResumeIntake
