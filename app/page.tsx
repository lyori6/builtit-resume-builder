'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import DOMPurify from 'dompurify'
import {
  Download,
  Check,
  AlertCircle,
  Loader2,
  X
} from 'lucide-react'
import { validateResumeJSON, ResumeData, normalizeResumeJSON } from '@/lib/resume-types'
import ResumeIntake from '@/components/ResumeIntake'
import LandingHero from '@/components/LandingHero'
import ResumeDiffTable from '@/components/ResumeDiffTable'
import ResumePreview from '@/components/ResumePreview'
import GeminiKeyModal from '@/components/GeminiKeyModal'
import DemoVideoModal from '@/components/DemoVideoModal'
import WorkspaceActions from '@/components/WorkspaceActions'
import { storage } from '@/lib/local-storage'
import {
  DEFAULT_OPTIMIZATION_SYSTEM_PROMPT,
  DEFAULT_ADJUSTMENT_SYSTEM_PROMPT,
  DEFAULT_TEXT_CONVERSION_SYSTEM_PROMPT
} from '@/lib/prompts'
import {
  OptimizerProvider,
  useOptimizerContext,
  ApiKeyStatus,
  DiffItem,
  OptimizationMetadata
} from '@/src/state/optimizer-context'
import { useOptimizedResume, useWorkspaceResume } from '@/src/hooks'
import { DEMO_OPTIMIZATION } from '@/src/demo/demo-content'

const segmentLabelMap: Record<string, string> = {
  basics: 'Basics',
  customFields: 'Custom Field',
  profiles: 'Profile',
  url: 'Link',
  headline: 'Headline',
  email: 'Email',
  phone: 'Phone',
  location: 'Location',
  summary: 'Summary',
  experience: 'Experience',
  projects: 'Projects',
  skills: 'Skills',
  education: 'Education',
  awards: 'Awards',
  certifications: 'Certifications',
  volunteer: 'Volunteer',
  interests: 'Interests',
  languages: 'Languages',
  items: 'Entry',
  keywords: 'Keywords',
  company: 'Company',
  position: 'Role',
  description: 'Description',
  content: 'Content',
  name: 'Name',
  value: 'Value',
  date: 'Date',
  summaryText: 'Summary',
  studyType: 'Study Type',
  institution: 'Institution',
  locationText: 'Location',
  score: 'Score',
  headlineText: 'Headline'
}

const startCase = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())

const formatSegment = (segment: string) => {
  const arrayMatch = segment.match(/^(.*)\[(\d+)\]$/)
  if (arrayMatch) {
    const base = arrayMatch[1]
    const index = Number(arrayMatch[2])
    const baseLabel = segmentLabelMap[base] || startCase(base)
    return `${baseLabel} ${index + 1}`
  }

  return segmentLabelMap[segment] || startCase(segment)
}

const createPathLabel = (path: string[]) => {
  const filteredPath = path.filter((segment) => segment !== 'sections')
  return filteredPath.map(formatSegment).join(' › ')
}

const isPrimitiveValue = (value: unknown) =>
  value === null || ['string', 'number', 'boolean'].includes(typeof value)

const primitiveArraysEqual = (a: unknown[], b: unknown[]) => {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return false
    }
  }
  return true
}

const toDisplayString = (value: unknown) => {
  if (value === null || value === undefined) return '--'
  if (Array.isArray(value)) return value.map((entry) => `${entry}`).join(', ')
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

const collectDiffs = (
  before: unknown,
  after: unknown,
  path: string[] = [],
  diffs: DiffItem[] = []
): DiffItem[] => {
  if (before === undefined && after === undefined) {
    return diffs
  }

  if (before === undefined || after === undefined) {
    diffs.push({
      path,
      before: toDisplayString(before),
      after: toDisplayString(after)
    })
    return diffs
  }

  if (typeof before === 'string' && typeof after === 'string') {
    if (before !== after) {
      diffs.push({ path, before, after })
    }
    return diffs
  }

  if (Array.isArray(before) && Array.isArray(after)) {
    const beforeArray = before as unknown[]
    const afterArray = after as unknown[]
    const primitives = beforeArray.every(isPrimitiveValue) && afterArray.every(isPrimitiveValue)
    if (primitives) {
      if (!primitiveArraysEqual(beforeArray, afterArray)) {
        diffs.push({ path, before: toDisplayString(before), after: toDisplayString(after) })
      }
      return diffs
    }

    const arrayKey = path[path.length - 1] || 'items'
    const parentPath = path.slice(0, -1)
    const maxLength = Math.max(beforeArray.length, afterArray.length)

    for (let i = 0; i < maxLength; i += 1) {
      const beforeItem = beforeArray[i]
      const afterItem = afterArray[i]
      const elementPath = [...parentPath, `${arrayKey}[${i}]`]

      if (beforeItem === undefined || afterItem === undefined) {
        diffs.push({
          path: elementPath,
          before: toDisplayString(beforeItem),
          after: toDisplayString(afterItem)
        })
        continue
      }

      collectDiffs(beforeItem, afterItem, elementPath, diffs)
    }

    return diffs
  }

  if (isPlainObject(before) && isPlainObject(after)) {
    const beforeRecord = before as Record<string, unknown>
    const afterRecord = after as Record<string, unknown>
    const keys = new Set([...Object.keys(beforeRecord), ...Object.keys(afterRecord)])
    keys.forEach((key) => {
      collectDiffs(beforeRecord[key], afterRecord[key], [...path, key], diffs)
    })
    return diffs
  }

  if (before !== after) {
    diffs.push({ path, before: toDisplayString(before), after: toDisplayString(after) })
  }

  return diffs
}

const buildResumeDiff = (before: ResumeData | null, after: ResumeData | null): DiffItem[] => {
  if (!before || !after) return []
  return collectDiffs(before, after)
}

const normalizeOptimizationMetadata = (
  metadata: unknown,
  diff: DiffItem[]
): OptimizationMetadata | null => {
  if (!metadata || typeof metadata !== 'object') {
    if (diff.length === 0) return null
    return {
      improvementsCount: diff.length,
      changes: undefined,
      keywordsMatched: undefined,
      wordCount: undefined,
      timestamp: new Date().toISOString()
    }
  }

  const meta = metadata as Record<string, unknown>

  const improvementsCount =
    typeof meta.improvementsCount === 'number'
      ? meta.improvementsCount
      : typeof meta.improvements_count === 'number'
        ? (meta.improvements_count as number)
        : diff.length || undefined

  const wordCount =
    typeof meta.wordCount === 'number'
      ? meta.wordCount
      : typeof meta.word_count === 'number'
        ? (meta.word_count as number)
        : undefined

  const keywordsMatched = Array.isArray(meta.keywordsMatched)
    ? (meta.keywordsMatched as string[])
    : Array.isArray(meta.keywords_matched)
      ? (meta.keywords_matched as string[])
      : undefined

  const processingTimeSeconds =
    typeof meta.processingTimeSeconds === 'number'
      ? meta.processingTimeSeconds
      : typeof meta.processing_time_seconds === 'number'
        ? (meta.processing_time_seconds as number)
        : undefined

  const changes = Array.isArray(meta.changes)
    ? (meta.changes as unknown[])
        .filter((entry) => entry && typeof entry === 'object')
        .map((entry) => {
          const change = entry as Record<string, unknown>
          return {
            type: typeof change.type === 'string' ? (change.type as string) : 'modified',
            section: typeof change.section === 'string' ? (change.section as string) : 'General',
            description: typeof change.description === 'string' ? (change.description as string) : undefined,
            before: typeof change.before === 'string' ? (change.before as string) : undefined,
            after: typeof change.after === 'string' ? (change.after as string) : undefined,
            reason: typeof change.reason === 'string' ? (change.reason as string) : undefined
          }
        })
    : undefined

  const timestamp =
    typeof meta.timestamp === 'string'
      ? meta.timestamp
      : new Date().toISOString()

  return {
    improvementsCount,
    wordCount,
    keywordsMatched,
    processingTimeSeconds,
    changes,
    timestamp
  }
}

const cloneResumeData = (data: ResumeData): ResumeData =>
  JSON.parse(JSON.stringify(data)) as ResumeData

const MAX_DIFF_ITEMS = 50
const GEMINI_KEY_HELP_URL = 'https://aistudio.google.com/app/apikey'
const DEMO_VIDEO_ID = 'landing-demo'
const DEMO_VIDEO_URL = 'https://www.youtube.com/embed/dQw4w9WgXcQ'


const ResumeGenerator = () => {
  const { state, dispatch } = useOptimizerContext()

  const resumeText = state.resume.originalText
  const jobDescription = state.jobDescription.text
  const activeVideoId = state.ui.activeVideoId
  const [showDemoSticky, setShowDemoSticky] = useState(false)
  const [demoStickyDismissed, setDemoStickyDismissed] = useState(false)

  const exitDemoMode = useCallback(() => {
    if (state.ui.isDemoMode) {
      dispatch({ type: 'SET_DEMO_MODE', isActive: false })
      setShowDemoSticky(false)
    }
  }, [dispatch, setShowDemoSticky, state.ui.isDemoMode])

  const handleResumeTextChange = useCallback(
    (text: string) => {
      exitDemoMode()
      dispatch({ type: 'SET_RESUME_TEXT', text })
    },
    [dispatch, exitDemoMode]
  )

  const storedGeminiKey = state.apiKey.value
  const geminiKeyStatus = state.apiKey.status
  const isDemoMode = state.ui.isDemoMode
  const optimizedResumeJson = state.resume.optimizedJson
  const optimizedResumeData = useOptimizedResume()
  const workspaceResumeData = useWorkspaceResume()
  const loadedSource = state.resume.loadedSource

  const setGeminiKeyStatus = useCallback(
    (status: ApiKeyStatus, errorMessage?: string | null) => {
      dispatch({ type: 'SET_API_KEY_STATUS', status, errorMessage: errorMessage ?? null })
    },
    [dispatch]
  )

  const clearGeminiKey = useCallback(() => {
    dispatch({ type: 'CLEAR_API_KEY' })
  }, [dispatch])

  const [loading, setLoading] = useState(true)
  const intakeSectionRef = useRef<HTMLDivElement | null>(null)
  
  // Paste JSON functionality
  const [pastedJSON, setPastedJSON] = useState<string>('')
  const [isJSONValid, setIsJSONValid] = useState<boolean | null>(null)
  const [jsonErrors, setJsonErrors] = useState<string[]>([])
  const lastOptimizedJsonRef = useRef<string | null>(null)
  const [isConvertingText, setIsConvertingText] = useState(false)
  const [textConversionError, setTextConversionError] = useState<string | null>(null)
  const [pendingConversion, setPendingConversion] = useState(false)
  const [originalResume, setOriginalResume] = useState<ResumeData | null>(null)
  const [showJobDetails, setShowJobDetails] = useState(false)
  const [showChangeDetails, setShowChangeDetails] = useState(false)
  const [showAdjustmentsPanel, setShowAdjustmentsPanel] = useState(false)
  const [previewMode, setPreviewMode] = useState<'after' | 'before'>('after')

  // JSON paste section collapsible state

  // Final adjustments functionality
  const [finalAdjustments, setFinalAdjustments] = useState<string>('')
  const [isAdjusting, setIsAdjusting] = useState(false)
  const [adjustmentError, setAdjustmentError] = useState<string | null>(null)
  const [adjustmentSuccess, setAdjustmentSuccess] = useState(false)
  const [geminiKeyInput, setGeminiKeyInput] = useState('')
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_OPTIMIZATION_SYSTEM_PROMPT)
  const [adjustmentPrompt, setAdjustmentPrompt] = useState(DEFAULT_ADJUSTMENT_SYSTEM_PROMPT)
  const [conversionPrompt, setConversionPrompt] = useState(DEFAULT_TEXT_CONVERSION_SYSTEM_PROMPT)
  const [draftSystemPrompt, setDraftSystemPrompt] = useState(DEFAULT_OPTIMIZATION_SYSTEM_PROMPT)
  const [draftAdjustmentPrompt, setDraftAdjustmentPrompt] = useState(DEFAULT_ADJUSTMENT_SYSTEM_PROMPT)
  const [draftConversionPrompt, setDraftConversionPrompt] = useState(DEFAULT_TEXT_CONVERSION_SYSTEM_PROMPT)
  const [showPromptSettings, setShowPromptSettings] = useState(false)
  const [promptSaveState, setPromptSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [promptError, setPromptError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null)
  const [showGeminiKeyModal, setShowGeminiKeyModal] = useState(false)
  const [isGeminiKeyRequired, setIsGeminiKeyRequired] = useState(false)
  const openGeminiModal = useCallback(
    (requireKeyModal: boolean) => {
      setIsGeminiKeyRequired(requireKeyModal)
      setShowGeminiKeyModal(true)
    },
    []
  )

  const handleOpenDemoVideo = useCallback(() => {
    dispatch({ type: 'SET_ACTIVE_VIDEO', videoId: DEMO_VIDEO_ID })
  }, [dispatch])

  const handleCloseDemoVideo = useCallback(() => {
    dispatch({ type: 'SET_ACTIVE_VIDEO', videoId: null })
  }, [dispatch])

  const handleEnterDemoMode = useCallback(() => {
    const demo = DEMO_OPTIMIZATION
    const optimizedJsonString = JSON.stringify(demo.optimizedResume)
    const prettyOptimizedJson = JSON.stringify(demo.optimizedResume, null, 2)
    const diff = buildResumeDiff(demo.originalResume, demo.optimizedResume)
    const metadata = normalizeOptimizationMetadata(demo.metadata, diff)

    setDemoStickyDismissed(false)
    setShowDemoSticky(false)
    dispatch({ type: 'SET_DEMO_MODE', isActive: true })
    dispatch({ type: 'SET_RESUME_TEXT', text: demo.sampleText })
    dispatch({ type: 'SET_JOB_DESCRIPTION', text: demo.jobDescription })
    dispatch({ type: 'SET_LOADED_SOURCE', source: { type: 'example', id: 'demo-optimization' } })
    dispatch({
      type: 'OPTIMIZE_SUCCESS',
      payload: {
        optimizedText: prettyOptimizedJson,
        optimizedJson: optimizedJsonString,
        metadata,
        diffItems: diff
      }
    })

    setOriginalResume(cloneResumeData(demo.originalResume))
    setPastedJSON(JSON.stringify(demo.originalResume, null, 2))
    setIsJSONValid(true)
    setJsonErrors([])
    setLoading(false)
    setIsGeminiKeyRequired(false)
    setShowGeminiKeyModal(false)
    setTextConversionError(null)
    setIsConvertingText(false)
    setFinalAdjustments('')
    setAdjustmentError(null)
    setAdjustmentSuccess(false)
    setIsAdjusting(false)
    setGeminiKeyStatus('idle')
    setToast(null)
    lastOptimizedJsonRef.current = optimizedJsonString
  }, [dispatch, setGeminiKeyStatus, setDemoStickyDismissed, setShowDemoSticky])

  const resetToIntakeView = useCallback(() => {
    dispatch({ type: 'RESET_OPTIMIZATION' })
    dispatch({ type: 'SET_WORKSPACE_RESUME', json: null })
    dispatch({ type: 'SET_LOADED_SOURCE', source: { type: 'none', id: null } })
    dispatch({ type: 'SET_RESUME_TEXT', text: '' })
    dispatch({ type: 'SET_JOB_DESCRIPTION', text: '' })
    setPastedJSON('')
    setIsJSONValid(null)
    setJsonErrors([])
    setOriginalResume(null)
    setFinalAdjustments('')
    setIsAdjusting(false)
    setAdjustmentError(null)
    setAdjustmentSuccess(false)
    setTextConversionError(null)
    setIsConvertingText(false)
    lastOptimizedJsonRef.current = null
  }, [dispatch])

  const handleStartYourOwn = useCallback(() => {
    exitDemoMode()
    resetToIntakeView()
    dispatch({ type: 'SET_STEP', step: 'resume' })
    requestAnimationFrame(() => {
      if (intakeSectionRef.current) {
        intakeSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
    if (!storedGeminiKey) {
      openGeminiModal(false)
    }
  }, [dispatch, exitDemoMode, resetToIntakeView, storedGeminiKey, openGeminiModal])

  const downloadJSONFile = (jsonString: string, filename: string) => {
    try {
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download JSON file:', error)
    }
  }

  const optimizationState = state.optimization
  const diffItems = optimizationState.diffItems
  const optimizationSuccess = optimizationState.status === 'success'
  const metadata = state.metadata
  const resumeForWorkspace = workspaceResumeData ?? optimizedResumeData
  const hasLoadedResume = Boolean(resumeForWorkspace)
  const exportFilename = (() => {
    if (loadedSource.type === 'example' && loadedSource.id) {
      return loadedSource.id.endsWith('.json') ? loadedSource.id : `${loadedSource.id}.json`
    }
    if (loadedSource.type === 'custom') {
      const customId = loadedSource.id ?? 'custom-resume'
      return customId.endsWith('.json') ? customId : `${customId}.json`
    }
    return 'resume.json'
  })()
  const summaryMetrics = useMemo(() => {
    const metrics: Array<{ id: string; value: string; label: string }> = []
    const improvements = metadata?.improvementsCount ?? (diffItems.length || 0)
    metrics.push({
      id: 'improvements',
      value: improvements.toString(),
      label: 'Improvements'
    })

    const keywordsMatched = metadata?.keywordsMatched?.length ?? 0
    metrics.push({
      id: 'keywords',
      value: keywordsMatched.toString(),
      label: 'Keywords matched'
    })

    if (metadata?.wordCount && Number.isFinite(metadata.wordCount)) {
      metrics.push({
        id: 'wordCount',
        value: metadata.wordCount.toLocaleString(),
        label: 'Word count'
      })
    }

    if (metadata?.processingTimeSeconds && Number.isFinite(metadata.processingTimeSeconds)) {
      const seconds = metadata.processingTimeSeconds
      const formatted =
        seconds >= 1 ? `${seconds.toFixed(seconds >= 10 ? 0 : 1)}s` : `${Math.round(seconds * 1000)}ms`
      metrics.push({
        id: 'processingTime',
        value: formatted,
        label: 'Processing time'
      })
    }

    return metrics
  }, [metadata, diffItems])

  const renderSummaryChips = () => {
    if (!summaryMetrics.length) {
      return null
    }

    return (
      <div className="flex flex-wrap justify-center gap-4">
        {summaryMetrics.map((metric) => (
          <div
            key={metric.id}
            className="flex min-w-[140px] flex-col items-center gap-1 rounded-2xl border border-blue-100 bg-white px-6 py-4 text-center shadow-sm shadow-blue-100/50"
          >
            <span className="text-3xl font-semibold text-blue-600">{metric.value}</span>
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{metric.label}</span>
          </div>
        ))}
      </div>
    )
  }

  const renderJobDetailsAccordion = () => {
    const hasJobDescription = jobDescription.trim().length > 0
    if (!hasJobDescription) {
      return null
    }

    return (
      <div className="rounded-2xl border border-slate-200 bg-white/95">
        <button
          type="button"
          onClick={() => setShowJobDetails((value) => !value)}
          className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <span>{showJobDetails ? 'Hide target job ▲' : 'View target job ▼'}</span>
        </button>
        {showJobDetails && (
          <div className="border-t border-slate-200 px-5 py-4 text-sm text-slate-700 whitespace-pre-line">
            {jobDescription.trim()}
          </div>
        )}
      </div>
    )
  }

  const renderChangeAccordion = () => (
    <div className="rounded-2xl border border-slate-200 bg-white/95">
      <button
        type="button"
        onClick={() => setShowChangeDetails((value) => !value)}
        className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        <span>{showChangeDetails ? 'Hide all changes ▲' : 'View all changes ▼'}</span>
      </button>
      {showChangeDetails && (
        <div className="border-t border-slate-200 px-5 py-4">
          {diffItems.length > 0 ? (
            <ResumeDiffTable
              diffs={diffItems}
              renderValue={renderDiffValue}
              formatPath={createPathLabel}
              maxVisible={MAX_DIFF_ITEMS}
            />
          ) : (
            <p className="text-sm text-slate-500">No AI changes recorded for this run.</p>
          )}
        </div>
      )}
    </div>
  )

  const renderPreviewSection = () => {
    const baselineResume = originalResume ?? resumeForWorkspace
    const previewData =
      previewMode === 'before' && baselineResume ? baselineResume : resumeForWorkspace ?? baselineResume

    if (!previewData) {
      return null
    }

    return (
      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-sm shadow-slate-200/50">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Resume preview</h2>
            <p className="text-sm text-slate-600">Toggle between the tailored version and your original.</p>
          </div>
          <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setPreviewMode('after')}
              className={`px-4 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                previewMode === 'after'
                  ? 'rounded-full bg-blue-600 text-white shadow-sm'
                  : 'rounded-full text-slate-600 hover:text-slate-900'
              }`}
            >
              Optimized
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('before')}
              className={`px-4 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                previewMode === 'before'
                  ? 'rounded-full bg-slate-200 text-slate-900 shadow-sm'
                  : 'rounded-full text-slate-600 hover:text-slate-900'
              }`}
            >
              Original
            </button>
          </div>
        </div>
        <div className="overflow-hidden rounded-[24px] border border-slate-200/70 bg-white shadow-inner">
          <ResumePreview resumeData={previewData} />
        </div>
      </section>
    )
  }

  const revertToOriginal = useCallback(() => {
    if (!originalResume) {
      return
    }

    const originalJson = JSON.stringify(originalResume)

    dispatch({ type: 'RESET_OPTIMIZATION' })
    dispatch({ type: 'SET_WORKSPACE_RESUME', json: originalJson })
    setFinalAdjustments('')
    setAdjustmentError(null)
    setAdjustmentSuccess(false)
    setPreviewMode('after')
    setShowChangeDetails(false)
    setShowJobDetails(false)
    setToast({ message: 'Reverted to your original resume.', tone: 'success' })
    setPastedJSON(JSON.stringify(originalResume, null, 2))
    setIsJSONValid(true)
    setJsonErrors([])
    lastOptimizedJsonRef.current = null
  }, [dispatch, originalResume])

  const renderJobSetup = () => (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-6 py-14">
      <WorkspaceActions
        resumeData={resumeForWorkspace}
        optimizeResume={() => {
          if (!storedGeminiKey) {
            setIsGeminiKeyRequired(true)
            setShowGeminiKeyModal(true)
            return
          }
          optimizeResume()
        }}
        finalAdjustments={finalAdjustments}
        onFinalAdjustmentsChange={setFinalAdjustments}
        applyFinalAdjustments={applyFinalAdjustments}
        isAdjusting={isAdjusting}
        adjustmentError={adjustmentError}
        adjustmentSuccess={adjustmentSuccess}
        originalResume={originalResume}
        revertToOriginal={revertToOriginal}
        maxDiffItems={MAX_DIFF_ITEMS}
        renderDiffValue={renderDiffValue}
        formatDiffPath={createPathLabel}
      />

      {!storedGeminiKey ? (
        <section className="rounded-3xl border border-blue-50 bg-white/95 p-6 shadow-sm shadow-blue-100/30">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => openGeminiModal(false)}
              className="inline-flex items-center justify-center rounded-full border border-blue-200 px-5 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              Need an API key?
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Your resume stays in this browser. We only use your Gemini key to run tailoring locally.
          </p>
        </section>
      ) : (
        <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm shadow-slate-200/30">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleDeleteGeminiKey}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Clear saved API key
            </button>
            <span className="text-xs text-slate-500">
              Removing your key sends you back to the intake step so you can reconnect later.
            </span>
          </div>
        </section>
      )}

      {resumeForWorkspace && (
        <section className="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-sm shadow-slate-200/40">
          <h2 className="text-lg font-semibold text-slate-900">Current resume snapshot</h2>
          <p className="mt-1 text-sm text-slate-600">
            We’ll tailor this version when you run optimization.
          </p>
          <div className="mt-4 overflow-hidden rounded-[24px] border border-slate-200/70 bg-white shadow-inner">
            <ResumePreview resumeData={resumeForWorkspace} />
          </div>
        </section>
      )}
    </div>
  )

  const handleTryAnotherJob = () => {
    dispatch({ type: 'RESET_OPTIMIZATION' })
    dispatch({ type: 'SET_JOB_DESCRIPTION', text: '' })
    setFinalAdjustments('')
    setAdjustmentError(null)
    setAdjustmentSuccess(false)
    setShowAdjustmentsPanel(false)
    setPreviewMode('after')
    setShowChangeDetails(false)
    setShowJobDetails(false)
    setOriginalResume(null)
  }

  const renderAdjustmentsPanel = () => (
    <section className="space-y-3 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm shadow-slate-200/40">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-slate-900">Fine-tune manually</h3>
        <p className="text-xs text-slate-500">Describe small tweaks and we’ll apply them on top of the tailored resume.</p>
      </div>
      <textarea
        value={finalAdjustments}
        onChange={(event) => setFinalAdjustments(event.target.value)}
        placeholder="Example: shorten the summary by one sentence, emphasise leadership on TechCorp role..."
        className="min-h-[120px] w-full resize-vertical rounded-2xl border border-purple-100 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-200"
        spellCheck={false}
      />
      {adjustmentError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          <div className="inline-flex items-center gap-2 font-semibold">
            <AlertCircle size={14} /> {adjustmentError}
          </div>
        </div>
      )}
      {adjustmentSuccess && (
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700">
          <Check size={14} /> Adjustments applied. Review the preview above.
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={applyFinalAdjustments}
          disabled={isAdjusting || !finalAdjustments.trim()}
          className="inline-flex items-center justify-center rounded-full bg-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isAdjusting ? <Loader2 size={16} className="animate-spin" /> : 'Apply adjustments'}
        </button>
        <button
          type="button"
          onClick={() => {
            setFinalAdjustments('')
            setAdjustmentError(null)
            setAdjustmentSuccess(false)
          }}
          className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
        >
          Clear
        </button>
      </div>
    </section>
  )

  const renderDemoResults = () => (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-6 py-14">
      <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-900 shadow-sm shadow-amber-200/60 sm:flex-row sm:items-center sm:justify-between">
        <span>📊 DEMO MODE — Viewing sample optimization results</span>
        <button
          type="button"
          onClick={handleStartYourOwn}
          className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white px-4 py-2 text-xs font-semibold text-amber-900 transition hover:bg-amber-100"
        >
          Try your own resume
        </button>
      </div>
      {renderSummaryChips()}
      {renderJobDetailsAccordion()}
      {renderChangeAccordion()}
      {renderPreviewSection()}
    </div>
  )

  const renderUserResults = () => (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-6 py-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">Your tailored resume is ready</h1>
          <p className="text-sm text-slate-600">Review the updates, export your resume, or fine-tune further.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={generatePDF}
            disabled={!hasLoadedResume}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download size={16} /> Download PDF
          </button>
          <button
            type="button"
            onClick={exportJSON}
            disabled={!hasLoadedResume}
            className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-5 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            title="Export JSON"
          >
            <Download size={16} /> Export JSON
          </button>
        </div>
      </div>
      {renderSummaryChips()}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleTryAnotherJob}
          className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
        >
          Try another job
        </button>
        <button
          type="button"
          onClick={() => setShowAdjustmentsPanel((value) => !value)}
          className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
        >
          {showAdjustmentsPanel ? 'Hide manual tweaks' : 'Fine-tune manually'}
        </button>
      </div>
      {showAdjustmentsPanel && renderAdjustmentsPanel()}
      {renderJobDetailsAccordion()}
      {renderChangeAccordion()}
      {renderPreviewSection()}
    </div>
  )

  useEffect(() => {
    const savedPrompts = storage.getPrompts()
    if (savedPrompts.systemPrompt && savedPrompts.systemPrompt.trim().length > 0) {
      setSystemPrompt(savedPrompts.systemPrompt)
      setDraftSystemPrompt(savedPrompts.systemPrompt)
    }
    if (savedPrompts.adjustmentPrompt && savedPrompts.adjustmentPrompt.trim().length > 0) {
      setAdjustmentPrompt(savedPrompts.adjustmentPrompt)
      setDraftAdjustmentPrompt(savedPrompts.adjustmentPrompt)
    }
    if (savedPrompts.conversionPrompt && savedPrompts.conversionPrompt.trim().length > 0) {
      setConversionPrompt(savedPrompts.conversionPrompt)
      setDraftConversionPrompt(savedPrompts.conversionPrompt)
    }
  }, [])

  useEffect(() => {
    if (showPromptSettings) {
      setDraftSystemPrompt(systemPrompt)
      setDraftAdjustmentPrompt(adjustmentPrompt)
      setDraftConversionPrompt(conversionPrompt)
      setPromptSaveState('idle')
      setPromptError(null)
    }
  }, [showPromptSettings, systemPrompt, adjustmentPrompt, conversionPrompt])

  useEffect(() => {
    if (storedGeminiKey) {
      setIsGeminiKeyRequired(false)
    }
  }, [storedGeminiKey])

  useEffect(() => {
    if (!isDemoMode) {
      setShowDemoSticky(false)
      return
    }
    if (demoStickyDismissed) {
      return
    }
    const timer = window.setTimeout(() => setShowDemoSticky(true), 10000)
    return () => window.clearTimeout(timer)
  }, [demoStickyDismissed, isDemoMode])

  useEffect(() => {
    const optimizedJson = optimizedResumeJson

    if (!optimizedResumeData || !optimizedJson) {
      if (!optimizedJson) {
        lastOptimizedJsonRef.current = null
      }
      return
    }

    if (lastOptimizedJsonRef.current === optimizedJson) {
      return
    }

    if (optimizedResumeJson) {
      dispatch({ type: 'SET_WORKSPACE_RESUME', json: optimizedResumeJson })
    }
    setPastedJSON(JSON.stringify(optimizedResumeData, null, 2))
    setIsJSONValid(true)
    setJsonErrors([])
    lastOptimizedJsonRef.current = optimizedJson
  }, [dispatch, optimizedResumeData, optimizedResumeJson])

  useEffect(() => {
    const savedResumeJSON = storage.getResume('custom')
    if (savedResumeJSON) {
      setPastedJSON(savedResumeJSON)
      try {
        const parsed = JSON.parse(savedResumeJSON)
        dispatch({ type: 'SET_WORKSPACE_RESUME', json: JSON.stringify(parsed) })
        dispatch({ type: 'SET_LOADED_SOURCE', source: { type: 'custom', id: 'local-storage' } })
        setIsJSONValid(true)
        setJsonErrors([])
        setLoading(false)
          if (!storage.getGeminiApiKey()) {
          setIsGeminiKeyRequired(true)
          setShowGeminiKeyModal(true)
        }
      } catch (error) {
        console.error('Failed to parse saved custom resume:', error)
        setIsJSONValid(false)
        setJsonErrors(['Stored custom resume is invalid JSON. Please reload or clear it.'])
        setLoading(false)
      }
    }
  }, [dispatch])


  useEffect(() => {
    if (!toast) {
      return undefined
    }
    const timer = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    setPreviewMode('after')
    setShowChangeDetails(false)
    setShowJobDetails(false)
    setShowAdjustmentsPanel(false)
  }, [optimizationSuccess, isDemoMode])

  const generatePDF = () => {
    window.print()
  }

  const exportJSON = () => {
    const jsonString = optimizedResumeJson
      ? (() => {
          try {
            return JSON.stringify(JSON.parse(optimizedResumeJson), null, 2)
          } catch (error) {
            console.error('Failed to parse optimized resume JSON from context:', error)
            return optimizedResumeJson
          }
        })()
      : workspaceResumeData
        ? JSON.stringify(workspaceResumeData, null, 2)
        : null

    if (!jsonString) {
      return
    }

    downloadJSONFile(jsonString, exportFilename)
  }

  const handleSaveGeminiKey = async () => {
    const trimmedKey = geminiKeyInput.trim()
    if (!trimmedKey) {
      setGeminiKeyStatus('error', 'Enter your Gemini API key before saving.')
      return false
    }

    try {
      setGeminiKeyStatus('validating')

      const response = await fetch('/api/check-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ apiKey: trimmedKey })
      })

      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        const message =
          typeof result.error === 'string'
            ? result.error
            : 'Unable to validate Gemini key. Double-check the value and try again.'
        throw new Error(message)
      }

      dispatch({ type: 'SAVE_API_KEY', key: trimmedKey })
      setGeminiKeyInput('')
      return true
    } catch (error) {
      console.error('Gemini key validation error:', error)
      setGeminiKeyStatus(
        'error',
        error instanceof Error
          ? error.message
          : 'Unable to validate Gemini key. Double-check the value and try again.'
      )
      return false
    }
  }
  const handleGeminiKeyInputChange = (value: string) => {
    setGeminiKeyInput(value)
    if (geminiKeyStatus === 'error') {
      setGeminiKeyStatus('idle')
    }
  }

  const handleDeleteGeminiKey = useCallback(() => {
    clearGeminiKey()
    setGeminiKeyInput('')
    setGeminiKeyStatus('idle')
    setShowGeminiKeyModal(false)
    setIsGeminiKeyRequired(false)
    exitDemoMode()
    resetToIntakeView()
    dispatch({ type: 'SET_STEP', step: 'resume' })
    requestAnimationFrame(() => {
      if (intakeSectionRef.current) {
        intakeSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
    setToast({ message: 'Gemini key cleared. Reconnect when you are ready to tailor again.', tone: 'success' })
  }, [clearGeminiKey, exitDemoMode, resetToIntakeView, dispatch, setGeminiKeyStatus])

  const closeGeminiKeyModal = () => {
    if (isGeminiKeyRequired) {
      return
    }
    setShowGeminiKeyModal(false)
    setGeminiKeyInput('')
    setIsGeminiKeyRequired(false)
    if (!storedGeminiKey) {
      setGeminiKeyStatus('idle')
    }
  }

  const handleGeminiModalSave = async () => {
    const success = await handleSaveGeminiKey()
    if (success) {
      setIsGeminiKeyRequired(false)
      setShowGeminiKeyModal(false)
      setToast({ message: 'Gemini key saved locally.', tone: 'success' })
      if (pendingConversion) {
        setPendingConversion(false)
        void convertTextToResume()
      }
    }
    return success
  }

  const handleSavePrompts = () => {
    try {
      setPromptSaveState('saving')
      setPromptError(null)
      storage.savePrompts({
        systemPrompt: draftSystemPrompt,
        adjustmentPrompt: draftAdjustmentPrompt,
        conversionPrompt: draftConversionPrompt
      })
      setSystemPrompt(draftSystemPrompt)
      setAdjustmentPrompt(draftAdjustmentPrompt)
      setConversionPrompt(draftConversionPrompt)
      setPromptSaveState('saved')
      setTimeout(() => setPromptSaveState('idle'), 2000)
    } catch (error) {
      console.error('Failed to save prompts:', error)
      setPromptSaveState('error')
      setPromptError('Unable to save prompts locally. Try again.')
    }
  }

  const handleResetPrompts = () => {
    setDraftSystemPrompt(DEFAULT_OPTIMIZATION_SYSTEM_PROMPT)
    setDraftAdjustmentPrompt(DEFAULT_ADJUSTMENT_SYSTEM_PROMPT)
    setDraftConversionPrompt(DEFAULT_TEXT_CONVERSION_SYSTEM_PROMPT)
    setSystemPrompt(DEFAULT_OPTIMIZATION_SYSTEM_PROMPT)
    setAdjustmentPrompt(DEFAULT_ADJUSTMENT_SYSTEM_PROMPT)
    setConversionPrompt(DEFAULT_TEXT_CONVERSION_SYSTEM_PROMPT)
    storage.savePrompts({
      systemPrompt: DEFAULT_OPTIMIZATION_SYSTEM_PROMPT,
      adjustmentPrompt: DEFAULT_ADJUSTMENT_SYSTEM_PROMPT,
      conversionPrompt: DEFAULT_TEXT_CONVERSION_SYSTEM_PROMPT
    })
    setPromptSaveState('saved')
    setPromptError(null)
    setTimeout(() => setPromptSaveState('idle'), 2000)
  }

  // Handle paste JSON validation
  const handleJSONPaste = (value: string) => {
    exitDemoMode()
    setPastedJSON(value)
    
    if (!value.trim()) {
      setIsJSONValid(null)
      setJsonErrors([])
      return
    }
    
    try {
      const parsed = normalizeResumeJSON(JSON.parse(value))
      const validation = validateResumeJSON(parsed)
      
      setIsJSONValid(validation.isValid)
      setJsonErrors(validation.errors)
    } catch {
      setIsJSONValid(false)
      setJsonErrors(['Invalid JSON format. Please check your syntax.'])
    }
  }

  // Load custom resume from pasted JSON
  const loadCustomResume = () => {
    exitDemoMode()
    if (!isJSONValid || !pastedJSON) return
    
    try {
      const parsed = normalizeResumeJSON(JSON.parse(pastedJSON))
      const validation = validateResumeJSON(parsed)
      if (!validation.isValid) {
        setIsJSONValid(false)
        setJsonErrors(validation.errors)
        return
      }

      dispatch({ type: 'SET_WORKSPACE_RESUME', json: JSON.stringify(parsed) })
      dispatch({ type: 'SET_LOADED_SOURCE', source: { type: 'custom', id: 'pasted-json' } })
      setLoading(false)
      setOriginalResume(null)
      dispatch({ type: 'RESET_OPTIMIZATION' })
      setAdjustmentSuccess(false)
      storage.saveResume('custom', JSON.stringify(parsed, null, 2))
      if (!storedGeminiKey) {
        setIsGeminiKeyRequired(true)
        setShowGeminiKeyModal(true)
      }
    } catch (error) {
      console.error('Error loading custom resume:', error)
    }
  }

  const handleJSONFileDrop = (file: File) => {
    exitDemoMode()
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result
      if (typeof text !== 'string') {
        setIsJSONValid(false)
        setJsonErrors(['Unable to read the file. Please try again or paste the JSON manually.'])
        return
      }

      setPastedJSON(text)

      try {
        const parsed = normalizeResumeJSON(JSON.parse(text))
        const validation = validateResumeJSON(parsed)
        setIsJSONValid(validation.isValid)
        setJsonErrors(validation.errors)

        if (validation.isValid) {
          dispatch({ type: 'SET_WORKSPACE_RESUME', json: JSON.stringify(parsed) })
          dispatch({ type: 'SET_LOADED_SOURCE', source: { type: 'custom', id: 'json-upload' } })
          storage.saveResume('custom', JSON.stringify(parsed, null, 2))
          setLoading(false)
          dispatch({ type: 'RESET_OPTIMIZATION' })
          setAdjustmentSuccess(false)
          setOriginalResume(null)
              if (!storedGeminiKey) {
            setIsGeminiKeyRequired(true)
            setShowGeminiKeyModal(true)
          }
        }
      } catch (error) {
        console.error('Failed to parse uploaded JSON:', error)
        setIsJSONValid(false)
        setJsonErrors(['Invalid JSON file. Double-check the contents or paste it manually.'])
      }
    }

    reader.onerror = () => {
      console.error('Failed to read file')
      setIsJSONValid(false)
      setJsonErrors(['Unable to read the file. Please try again or paste the JSON manually.'])
    }

    reader.readAsText(file)
  }

  const convertTextToResume = async () => {
    if (!resumeText.trim()) {
      setTextConversionError('Paste your resume text before continuing.')
      return
    }
    if (!storedGeminiKey) {
      setPendingConversion(true)
      openGeminiModal(true)
      setTextConversionError('Add your Gemini API key to continue.')
      return
    }

    try {
      setPendingConversion(false)
      setIsConvertingText(true)
      setTextConversionError(null)

      const response = await fetch('/api/convert-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': storedGeminiKey
        },
        body: JSON.stringify({
          resumeText,
          apiKey: storedGeminiKey,
          promptOverrides: {
            systemPrompt: conversionPrompt
          }
        })
      })

      const result = await response.json()

      if (!response.ok) {
        const detailMessage = Array.isArray(result.details)
          ? `${result.error || 'Conversion failed'}\n${result.details.join('\n')}`
          : result.error || 'Conversion failed'
        throw new Error(detailMessage)
      }

      if (result.success && result.resume) {
        const normalizedResume = normalizeResumeJSON(result.resume)
        const serialized = JSON.stringify(normalizedResume, null, 2)

        const validation = validateResumeJSON(normalizedResume)
        if (!validation.isValid) {
          throw new Error(
            `Converted resume is missing required fields:\n${validation.errors.join('\n')}`
          )
        }
        dispatch({ type: 'SET_WORKSPACE_RESUME', json: JSON.stringify(normalizedResume) })
        dispatch({ type: 'SET_LOADED_SOURCE', source: { type: 'custom', id: 'conversion' } })
        setPastedJSON(serialized)
        setIsJSONValid(true)
        setJsonErrors([])
        setLoading(false)
        dispatch({ type: 'RESET_OPTIMIZATION' })
        setOriginalResume(null)
        setAdjustmentSuccess(false)
        storage.saveResume('custom', serialized)
        setToast({ message: 'Your resume is ready for targeting.', tone: 'success' })
      }
    } catch (error) {
      console.error('Text conversion error:', error)
      setTextConversionError(
        error instanceof Error ? error.message : 'Unable to convert resume text.'
      )
    } finally {
      setIsConvertingText(false)
    }
  }

  // Optimize resume with Gemini
  const optimizeResume = async () => {
    const currentResume = resumeForWorkspace
    if (!currentResume || !jobDescription.trim()) return
    if (!storedGeminiKey) {
      dispatch({
        type: 'OPTIMIZE_FAILURE',
        errorMessage: 'Add your API key to run optimization.'
      })
      return
    }

    const validation = validateResumeJSON(currentResume)
    if (!validation.isValid) {
      console.warn('Client-side resume validation failed:', validation.errors)
      dispatch({
        type: 'OPTIMIZE_FAILURE',
        errorMessage: 'Resume JSON is not valid. Check required fields before optimizing.'
      })
      return
    }
    
    try {
      dispatch({ type: 'OPTIMIZE_REQUEST' })

      // Capture baseline resume for diffing
      const baselineResume = originalResume ?? cloneResumeData(currentResume)
      if (!originalResume) {
        setOriginalResume(baselineResume)
      }
      
      const response = await fetch('/api/optimize-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': storedGeminiKey
        },
        body: JSON.stringify({
          resumeData: currentResume,
          jobDescription,
          apiKey: storedGeminiKey,
          promptOverrides: {
            systemPrompt
          }
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Optimization failed')
      }
      
      if (result.success && result.optimizedResume) {
        const normalizedOptimized = normalizeResumeJSON(result.optimizedResume)
        const optimizedValidation = validateResumeJSON(normalizedOptimized)
        if (!optimizedValidation.isValid) {
          throw new Error(
            `Optimized resume is missing required fields:\n${optimizedValidation.errors.join('\n')}`
          )
        }

        // Update resume data with optimized version
        dispatch({ type: 'SET_WORKSPACE_RESUME', json: JSON.stringify(normalizedOptimized) })

        // Update session storage if this was a custom resume
        if (loadedSource.type === 'custom') {
          storage.saveResume('custom', JSON.stringify(normalizedOptimized, null, 2))
        }

        const diff = buildResumeDiff(baselineResume, normalizedOptimized as ResumeData)

        const metadata = normalizeOptimizationMetadata(result.metadata, diff)

        dispatch({
          type: 'OPTIMIZE_SUCCESS',
          payload: {
            optimizedText: JSON.stringify(normalizedOptimized, null, 2),
            optimizedJson: JSON.stringify(normalizedOptimized),
            metadata,
            diffItems: diff
          }
        })
      }
      
    } catch (error) {
      console.error('Optimization error:', error)
      dispatch({
        type: 'OPTIMIZE_FAILURE',
        errorMessage: error instanceof Error ? error.message : 'Optimization failed'
      })
    }
  }
  
  // Apply final adjustments with Gemini Flash
  const applyFinalAdjustments = async () => {
    const currentResume = resumeForWorkspace
    if (!currentResume || !finalAdjustments.trim()) return
    if (!storedGeminiKey) {
      setAdjustmentError('Add your API key to apply adjustments.')
      return
    }

    try {
      setIsAdjusting(true)
      setAdjustmentError(null)
      setAdjustmentSuccess(false)

      // Capture baseline resume for diffing
      const baselineResume = originalResume ?? cloneResumeData(currentResume)
      if (!originalResume) {
        setOriginalResume(baselineResume)
      }

      const response = await fetch('/api/adjust-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': storedGeminiKey
        },
        body: JSON.stringify({
          resumeData: currentResume,
          adjustmentInstructions: finalAdjustments,
          apiKey: storedGeminiKey,
          promptOverrides: {
            systemPrompt: adjustmentPrompt
          }
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Adjustment failed')
      }

      if (result.success && result.adjustedResume) {
        const normalizedAdjusted = normalizeResumeJSON(result.adjustedResume)
        const adjustedValidation = validateResumeJSON(normalizedAdjusted)
        if (!adjustedValidation.isValid) {
          throw new Error(
            `Adjusted resume is missing required fields:\n${adjustedValidation.errors.join('\n')}`
          )
        }

        // Update resume data with adjusted version
        dispatch({ type: 'SET_WORKSPACE_RESUME', json: JSON.stringify(normalizedAdjusted) })

        // Update session storage if this was a custom resume
        if (loadedSource.type === 'custom') {
          storage.saveResume('custom', JSON.stringify(normalizedAdjusted, null, 2))
        }

        const diff = buildResumeDiff(baselineResume, normalizedAdjusted as ResumeData)

        const metadata = normalizeOptimizationMetadata(result.metadata, diff)

        dispatch({
          type: 'OPTIMIZE_SUCCESS',
          payload: {
            optimizedText: JSON.stringify(normalizedAdjusted, null, 2),
            optimizedJson: JSON.stringify(normalizedAdjusted),
            metadata,
            diffItems: diff
          }
        })

        // Set success state
        setAdjustmentSuccess(true)
      }

    } catch (error) {
      console.error('Adjustment error:', error)
      setAdjustmentError(error instanceof Error ? error.message : 'Adjustment failed')
      setAdjustmentSuccess(false)
    } finally {
      setIsAdjusting(false)
    }
  }

  const renderDiffValue = (value: string) => {
    const trimmedValue = value?.trim()

    if (!trimmedValue || trimmedValue === '--') {
      return <p className="text-xs text-gray-500">--</p>
    }

    const containsHTML = /<[a-z][\s\S]*>/i.test(trimmedValue)

    if (containsHTML) {
      const sanitizedValue = typeof window !== 'undefined'
        ? DOMPurify.sanitize(trimmedValue)
        : trimmedValue

      return (
        <div
          className="diff-html text-xs text-gray-700 leading-tight"
          dangerouslySetInnerHTML={{ __html: sanitizedValue }}
        />
      )
    }

    return (
      <p className="text-xs text-gray-700 leading-tight whitespace-pre-line">
        {trimmedValue}
      </p>
    )
  }

  if (loading && loadedSource.type === 'example' && !workspaceResumeData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading resume...</p>
        </div>
      </div>
    )
  }
  
  // Show paste interface if no resume is loaded
  if (!workspaceResumeData) {
    return (
      <>
        <GeminiKeyModal
          isOpen={showGeminiKeyModal}
          onClose={closeGeminiKeyModal}
          geminiKeyInput={geminiKeyInput}
          onInputChange={handleGeminiKeyInputChange}
          onSave={handleGeminiModalSave}
          geminiKeyHelpUrl={GEMINI_KEY_HELP_URL}
          requireKey={isGeminiKeyRequired}
        />
        <main className="mx-auto w-full max-w-5xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
          <LandingHero
            onSeeDemo={handleEnterDemoMode}
            onStartOwn={handleStartYourOwn}
            onOpenVideo={handleOpenDemoVideo}
          />
          <div ref={intakeSectionRef} className="scroll-mt-24">
            <ResumeIntake
              pastedJSON={pastedJSON}
              onJSONChange={handleJSONPaste}
              isJSONValid={isJSONValid}
              jsonErrors={jsonErrors}
              onLoadJSON={loadCustomResume}
              onJSONFileDrop={handleJSONFileDrop}
              isUploadingJSON={false}
              rawResumeText={resumeText}
              onRawTextChange={handleResumeTextChange}
              onConvertText={convertTextToResume}
              isConvertingText={isConvertingText}
              textConversionError={textConversionError}
              onViewDemo={handleEnterDemoMode}
            />
          </div>
        </main>
        <DemoVideoModal
          isOpen={activeVideoId === DEMO_VIDEO_ID}
          onClose={handleCloseDemoVideo}
          videoUrl={DEMO_VIDEO_URL}
          title="BuiltIt Resume Optimizer Demo"
        />
        {toast && (
          <div
            className={`fixed inset-x-0 top-6 z-50 flex justify-center pointer-events-none`}
          >
          <div
            className={`inline-flex items-center gap-3 rounded-2xl px-5 py-3 shadow-xl border pointer-events-auto ${
              toast.tone === 'success'
                ? 'border-emerald-200 bg-emerald-600 text-white'
                : 'border-red-200 bg-red-600 text-white'
            }`}
          >
            {toast.tone === 'success' ? (
              <Check size={18} className="flex-shrink-0" />
            ) : (
              <AlertCircle size={18} className="flex-shrink-0" />
            )}
            <span className="text-sm font-semibold">{toast.message}</span>
          </div>
        </div>
      )}
      </>
    )
  }


  return (
    <>
      <GeminiKeyModal
        isOpen={showGeminiKeyModal}
        onClose={closeGeminiKeyModal}
        geminiKeyInput={geminiKeyInput}
        onInputChange={handleGeminiKeyInputChange}
        onSave={handleGeminiModalSave}
        geminiKeyHelpUrl={GEMINI_KEY_HELP_URL}
        requireKey={isGeminiKeyRequired}
      />
      <DemoVideoModal
        isOpen={activeVideoId === DEMO_VIDEO_ID}
        onClose={handleCloseDemoVideo}
        videoUrl={DEMO_VIDEO_URL}
        title="BuiltIt Resume Optimizer Demo"
      />
      {toast && (
        <div className="fixed inset-x-0 top-6 z-50 flex justify-center pointer-events-none">
          <div
            className={`inline-flex items-center gap-3 rounded-2xl px-5 py-3 shadow-xl border pointer-events-auto ${
              toast.tone === 'success'
                ? 'border-emerald-200 bg-emerald-600 text-white'
                : 'border-red-200 bg-red-600 text-white'
            }`}
          >
            {toast.tone === 'success' ? (
              <Check size={18} className="flex-shrink-0" />
            ) : (
              <AlertCircle size={18} className="flex-shrink-0" />
            )}
            <span className="text-sm font-semibold">{toast.message}</span>
          </div>
        </div>
      )}
      {showPromptSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-3xl rounded-lg bg-white shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Prompt Settings</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Customize the system prompts used for conversion, optimization, and adjustments. Changes are saved locally and applied to future Gemini requests.
                </p>
              </div>
              <button
                onClick={() => setShowPromptSettings(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close prompt settings"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Text → JSON conversion prompt
                </label>
                <textarea
                  value={draftConversionPrompt}
                  onChange={(event) => setDraftConversionPrompt(event.target.value)}
                  className="w-full h-32 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  spellCheck={false}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Applied when converting plain text resumes into JSON.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Optimization prompt
                </label>
                <textarea
                  value={draftSystemPrompt}
                  onChange={(event) => setDraftSystemPrompt(event.target.value)}
                  className="w-full h-32 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  spellCheck={false}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Used when tailoring a resume against a job description.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adjustment prompt
                </label>
                <textarea
                  value={draftAdjustmentPrompt}
                  onChange={(event) => setDraftAdjustmentPrompt(event.target.value)}
                  className="w-full h-32 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  spellCheck={false}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Used for quick follow-up edits (length tweaks, emphasis changes, etc.).
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-gray-500">
                Prompts are saved in your browser. Reset restores the defaults.
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleResetPrompts}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Reset to defaults
                </button>
                <button
                  onClick={() => setShowPromptSettings(false)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePrompts}
                  disabled={promptSaveState === 'saving'}
                  className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
                >
                  {promptSaveState === 'saving' && <Loader2 size={16} className="animate-spin" />}
                  Save prompts
                </button>
              </div>
            </div>

            <div className="mt-2 min-h-[20px]">
              {promptSaveState === 'saved' && (
                <div className="text-xs text-green-600 flex items-center gap-1">
                  <Check size={14} />
                  Prompts saved locally.
                </div>
              )}
              {promptSaveState === 'error' && promptError && (
                <div className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {promptError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/70 to-indigo-50/50">
        <div className="print:hidden">
          {optimizationSuccess
            ? isDemoMode
              ? renderDemoResults()
              : renderUserResults()
            : renderJobSetup()}
        </div>
      </div>

      {isDemoMode && showDemoSticky && !demoStickyDismissed && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4">
          <div className="pointer-events-auto relative flex w-full max-w-3xl flex-col gap-3 rounded-3xl border border-blue-200 bg-white px-5 py-4 shadow-2xl shadow-blue-200/60 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-semibold text-slate-900">Ready to optimize your resume?</div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setDemoStickyDismissed(true)
                  setShowDemoSticky(false)
                  openGeminiModal(false)
                }}
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Get free API key
              </button>
              <button
                type="button"
                onClick={() => {
                  setDemoStickyDismissed(true)
                  setShowDemoSticky(false)
                  handleStartYourOwn()
                }}
                className="inline-flex items-center justify-center rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                Use your resume
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setDemoStickyDismissed(true)
                setShowDemoSticky(false)
              }}
              className="absolute -top-3 -right-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:text-slate-700"
              aria-label="Dismiss demo prompt"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

const ResumeGeneratorPage = () => (
  <OptimizerProvider>
    <ResumeGenerator />
  </OptimizerProvider>
)

export default ResumeGeneratorPage
