'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import DOMPurify from 'dompurify'
import { Download, Check, AlertCircle, Loader2, X, Sparkles, RotateCcw } from 'lucide-react'
import { validateResumeJSON, ResumeData, isValidResumeData, normalizeResumeJSON } from '@/lib/resume-types'
import ResumeIntake from '@/components/ResumeIntake'
import WorkspaceActions from '@/components/WorkspaceActions'
import ResumePreview from '@/components/ResumePreview'
import OnboardingWizard from '@/components/OnboardingWizard'
import GeminiKeyModal from '@/components/GeminiKeyModal'
import { storage } from '@/lib/local-storage'
import {
  DEFAULT_OPTIMIZATION_SYSTEM_PROMPT,
  DEFAULT_ADJUSTMENT_SYSTEM_PROMPT,
  DEFAULT_TEXT_CONVERSION_SYSTEM_PROMPT
} from '@/lib/prompts'

interface DiffItem {
  path: string[]
  before: string
  after: string
}

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

const cloneResumeData = (data: ResumeData): ResumeData =>
  JSON.parse(JSON.stringify(data)) as ResumeData

const MAX_DIFF_ITEMS = 50
const GEMINI_KEY_HELP_URL = 'https://aistudio.google.com/app/apikey'
const GEMINI_INSTRUCTIONS_URL = 'https://github.com/lyor/builtit-resume-builder/blob/main/docs/gemini-key-setup.md'

const ResumeGenerator = () => {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null)
  const [selectedResume, setSelectedResume] = useState<string>('')
  const [loading, setLoading] = useState(true)
  
  // Paste JSON functionality
  const [pastedJSON, setPastedJSON] = useState<string>('')
  const [isJSONValid, setIsJSONValid] = useState<boolean | null>(null)
  const [jsonErrors, setJsonErrors] = useState<string[]>([])
  const [customResumeLoaded, setCustomResumeLoaded] = useState(false)
  const customResumeLoadedRef = useRef(false)
  const [intakeMode, setIntakeMode] = useState<'json' | 'text'>('text')
  const [rawResumeText, setRawResumeText] = useState('')
  const [isConvertingText, setIsConvertingText] = useState(false)
  const [textConversionError, setTextConversionError] = useState<string | null>(null)
  
  // Job description optimization functionality
  const [jobDescription, setJobDescription] = useState<string>('')
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizationError, setOptimizationError] = useState<string | null>(null)
  const [originalResume, setOriginalResume] = useState<ResumeData | null>(null)
  const [optimizationSuccess, setOptimizationSuccess] = useState(false)

  // JSON paste section collapsible state

  // Final adjustments functionality
  const [finalAdjustments, setFinalAdjustments] = useState<string>('')
  const [isAdjusting, setIsAdjusting] = useState(false)
  const [adjustmentError, setAdjustmentError] = useState<string | null>(null)
  const [adjustmentSuccess, setAdjustmentSuccess] = useState(false)
  const [showDiff, setShowDiff] = useState(false)
  const [storedGeminiKey, setStoredGeminiKey] = useState<string | null>(null)
  const [geminiKeyInput, setGeminiKeyInput] = useState('')
  const [isValidatingKey, setIsValidatingKey] = useState(false)
  const [geminiKeyStatus, setGeminiKeyStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [geminiKeyError, setGeminiKeyError] = useState<string | null>(null)
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_OPTIMIZATION_SYSTEM_PROMPT)
  const [adjustmentPrompt, setAdjustmentPrompt] = useState(DEFAULT_ADJUSTMENT_SYSTEM_PROMPT)
  const [conversionPrompt, setConversionPrompt] = useState(DEFAULT_TEXT_CONVERSION_SYSTEM_PROMPT)
  const [draftSystemPrompt, setDraftSystemPrompt] = useState(DEFAULT_OPTIMIZATION_SYSTEM_PROMPT)
  const [draftAdjustmentPrompt, setDraftAdjustmentPrompt] = useState(DEFAULT_ADJUSTMENT_SYSTEM_PROMPT)
  const [draftConversionPrompt, setDraftConversionPrompt] = useState(DEFAULT_TEXT_CONVERSION_SYSTEM_PROMPT)
  const [showPromptSettings, setShowPromptSettings] = useState(false)
  const [promptSaveState, setPromptSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [promptError, setPromptError] = useState<string | null>(null)
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null)
  const [showGeminiKeyModal, setShowGeminiKeyModal] = useState(false)
  const [isGeminiKeyRequired, setIsGeminiKeyRequired] = useState(false)

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

  const diffItems = useMemo(() => buildResumeDiff(originalResume, resumeData), [originalResume, resumeData])
  const hasLoadedResume = Boolean(resumeData)

  useEffect(() => {
    if (diffItems.length === 0) {
      setShowDiff(false)
    }
  }, [diffItems.length])

  useEffect(() => {
    const key = storage.getGeminiApiKey()
    if (key) {
      setStoredGeminiKey(key)
      setGeminiKeyStatus('success')
    }

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
    if (!storage.isOnboardingCompleted()) {
      setIsOnboardingOpen(true)
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
    const savedResumeJSON = storage.getResume('custom')
    if (savedResumeJSON) {
      setPastedJSON(savedResumeJSON)
      try {
        const parsed = JSON.parse(savedResumeJSON)
        setResumeData(parsed)
        setIsJSONValid(true)
        setJsonErrors([])
        setCustomResumeLoaded(true)
        customResumeLoadedRef.current = true
        setSelectedResume('custom')
        setLoading(false)
        setIntakeMode('json')
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
  }, [])

  useEffect(() => {
    if (customResumeLoaded) {
      setSelectedResume('custom')
    }
  }, [customResumeLoaded])

  useEffect(() => {
    if (!toast) {
      return undefined
    }
    const timer = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    // Load selected resume data when selection changes
    if (selectedResume && selectedResume !== 'custom') {
      fetchResumeData(selectedResume)
      setCustomResumeLoaded(false)
      customResumeLoadedRef.current = false
    }
  }, [selectedResume])

  const fetchResumeData = async (filename: string) => {
    try {
      setLoading(true)
      setOriginalResume(null)
      setShowDiff(false)
      setOptimizationSuccess(false)
      setAdjustmentSuccess(false)
      const response = await fetch(`/api/resume?filename=${filename}`)
      const data = await response.json()
      const normalized = normalizeResumeJSON(data)
      if (!isValidResumeData(normalized)) {
        throw new Error('Received resume data is not valid.')
      }
      setResumeData(normalized)
      setCustomResumeLoaded(false)
    } catch (error) {
      console.error('Error fetching resume data:', error)
      setResumeData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleIntakeModeChange = (mode: 'json' | 'text') => {
    setIntakeMode(mode)
  }

  const handleOpenOnboarding = () => {
    setIsOnboardingOpen(true)
  }

  const handleCloseOnboarding = () => {
    setIsOnboardingOpen(false)
  }

  const handleCompleteOnboarding = () => {
    storage.setOnboardingCompleted()
    setIsOnboardingOpen(false)
  }

  const generatePDF = () => {
    window.print()
  }

  const exportJSON = () => {
    if (!resumeData) return

    downloadJSONFile(JSON.stringify(resumeData, null, 2), selectedResume || 'resume.json')
  }

  const handleSaveGeminiKey = async () => {
    const trimmedKey = geminiKeyInput.trim()
    if (!trimmedKey) {
      setGeminiKeyError('Enter your Gemini API key before saving.')
      setGeminiKeyStatus('error')
      return false
    }

    try {
      setIsValidatingKey(true)
      setGeminiKeyError(null)
      setGeminiKeyStatus('idle')

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

      storage.saveGeminiApiKey(trimmedKey)
      setStoredGeminiKey(trimmedKey)
      setGeminiKeyStatus('success')
      setGeminiKeyInput('')
      return true
    } catch (error) {
      console.error('Gemini key validation error:', error)
      setGeminiKeyStatus('error')
      setGeminiKeyError(
        error instanceof Error
          ? error.message
          : 'Unable to validate Gemini key. Double-check the value and try again.'
      )
      return false
    } finally {
      setIsValidatingKey(false)
    }
  }
  const handleGeminiKeyInputChange = (value: string) => {
    setGeminiKeyInput(value)
    if (geminiKeyStatus === 'error') {
      setGeminiKeyStatus('idle')
      setGeminiKeyError(null)
    }
  }

  const handleSaveGeminiKeyClick = () => {
    return handleSaveGeminiKey()
  }

  const handleDeleteGeminiKey = () => {
    storage.removeGeminiApiKey()
    setStoredGeminiKey(null)
    setGeminiKeyInput('')
    setGeminiKeyStatus('idle')
    setGeminiKeyError(null)
  }

  const closeGeminiKeyModal = () => {
    if (isGeminiKeyRequired) {
      return
    }
    setShowGeminiKeyModal(false)
    setGeminiKeyInput('')
    setIsGeminiKeyRequired(false)
    if (!storedGeminiKey) {
      setGeminiKeyStatus('idle')
      setGeminiKeyError(null)
    }
  }

  const handleGeminiModalSave = async () => {
    const success = await handleSaveGeminiKey()
    if (success) {
      setIsGeminiKeyRequired(false)
      setShowGeminiKeyModal(false)
      setToast({ message: 'Gemini key saved locally.', tone: 'success' })
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
    if (!isJSONValid || !pastedJSON) return
    
    try {
      const parsed = normalizeResumeJSON(JSON.parse(pastedJSON))
      const validation = validateResumeJSON(parsed)
      if (!validation.isValid) {
        setIsJSONValid(false)
        setJsonErrors(validation.errors)
        return
      }

      setResumeData(parsed as ResumeData)
      setSelectedResume('custom')
      setCustomResumeLoaded(true)
      customResumeLoadedRef.current = true
      setLoading(false)
      setOriginalResume(null)
      setShowDiff(false)
      setOptimizationSuccess(false)
      setAdjustmentSuccess(false)
      storage.saveResume('custom', JSON.stringify(parsed, null, 2))
      setIntakeMode('json')
      if (!storedGeminiKey) {
        setIsGeminiKeyRequired(true)
        setShowGeminiKeyModal(true)
      }
    } catch (error) {
      console.error('Error loading custom resume:', error)
    }
  }

  const downloadPastedJSON = () => {
    if (!pastedJSON.trim()) return
    downloadJSONFile(pastedJSON, 'resume.json')
  }

  const handleJSONFileDrop = (file: File) => {
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
          setResumeData(parsed as ResumeData)
          setSelectedResume('custom')
          setCustomResumeLoaded(true)
          customResumeLoadedRef.current = true
          storage.saveResume('custom', JSON.stringify(parsed, null, 2))
          setLoading(false)
          setOptimizationSuccess(false)
          setAdjustmentSuccess(false)
          setOriginalResume(null)
          setShowDiff(false)
          setIntakeMode('json')
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

  const handleClearWorkspace = () => {
    storage.clearAll()
    setResumeData(null)
    setCustomResumeLoaded(false)
    customResumeLoadedRef.current = false
    setSelectedResume('')
    setLoading(false)
    setPastedJSON('')
    setIsJSONValid(null)
    setJsonErrors([])
    setRawResumeText('')
    setTextConversionError(null)
    setIsConvertingText(false)
    setJobDescription('')
    setIsOptimizing(false)
    setOptimizationError(null)
    setOriginalResume(null)
    setOptimizationSuccess(false)
    setFinalAdjustments('')
    setIsAdjusting(false)
    setAdjustmentError(null)
    setAdjustmentSuccess(false)
    setShowDiff(false)
    setStoredGeminiKey(null)
    setGeminiKeyInput('')
    setIsValidatingKey(false)
    setGeminiKeyStatus('idle')
    setGeminiKeyError(null)
    setSystemPrompt(DEFAULT_OPTIMIZATION_SYSTEM_PROMPT)
    setAdjustmentPrompt(DEFAULT_ADJUSTMENT_SYSTEM_PROMPT)
    setConversionPrompt(DEFAULT_TEXT_CONVERSION_SYSTEM_PROMPT)
    setDraftSystemPrompt(DEFAULT_OPTIMIZATION_SYSTEM_PROMPT)
    setDraftAdjustmentPrompt(DEFAULT_ADJUSTMENT_SYSTEM_PROMPT)
    setDraftConversionPrompt(DEFAULT_TEXT_CONVERSION_SYSTEM_PROMPT)
    setShowPromptSettings(false)
    setPromptSaveState('idle')
    setPromptError(null)
    setShowGeminiKeyModal(false)
    setIsGeminiKeyRequired(false)
    setIntakeMode('text')
    setToast({ message: 'Workspace cleared. Start fresh with a new resume.', tone: 'success' })
  }

  const convertTextToResume = async () => {
    if (!rawResumeText.trim()) {
      setTextConversionError('Paste your resume text before converting.')
      return
    }
    if (!storedGeminiKey) {
      setTextConversionError('Add your API key to convert resume text.')
      return
    }

    try {
      setIsConvertingText(true)
      setTextConversionError(null)

      const response = await fetch('/api/convert-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': storedGeminiKey
        },
        body: JSON.stringify({
          resumeText: rawResumeText,
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

        setResumeData(normalizedResume as ResumeData)
        setPastedJSON(serialized)
        setIsJSONValid(true)
        setJsonErrors([])
        setCustomResumeLoaded(true)
        customResumeLoadedRef.current = true
        setSelectedResume('custom')
        setLoading(false)
        setOriginalResume(null)
        setShowDiff(false)
        setOptimizationSuccess(false)
        setAdjustmentSuccess(false)
        storage.saveResume('custom', serialized)
        setIntakeMode('json')
        setToast({ message: 'Your JSON resume is ready to optimize.', tone: 'success' })
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
    if (!resumeData || !jobDescription.trim()) return
    if (!storedGeminiKey) {
      setOptimizationError('Add your API key to run optimization.')
      return
    }

    const validation = validateResumeJSON(resumeData)
    if (!validation.isValid) {
      console.warn('Client-side resume validation failed:', validation.errors)
      setOptimizationError('Resume JSON is not valid. Check required fields before optimizing.')
      return
    }
    
    try {
      setIsOptimizing(true)
      setOptimizationError(null)
      setOptimizationSuccess(false)
      
      // Store original resume for comparison
      if (!originalResume && resumeData) {
        setOriginalResume(cloneResumeData(resumeData))
      }
      
      const response = await fetch('/api/optimize-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': storedGeminiKey
        },
        body: JSON.stringify({
          resumeData,
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
        setResumeData(normalizedOptimized as ResumeData)

        // Update session storage if this was a custom resume
        if (customResumeLoadedRef.current || selectedResume === 'custom') {
          storage.saveResume('custom', JSON.stringify(normalizedOptimized, null, 2))
        }

        // Set success state
        setOptimizationSuccess(true)
        setShowDiff(true)
      }
      
    } catch (error) {
      console.error('Optimization error:', error)
      setOptimizationError(error instanceof Error ? error.message : 'Optimization failed')
      setOptimizationSuccess(false)
    } finally {
      setIsOptimizing(false)
    }
  }
  
  // Revert to original resume
  const revertToOriginal = () => {
    if (originalResume) {
      setResumeData(originalResume)

      // Update session storage if this was a custom resume
      if (customResumeLoadedRef.current || selectedResume === 'custom') {
        storage.saveResume('custom', JSON.stringify(originalResume, null, 2))
      }

      setOriginalResume(null)
      setOptimizationSuccess(false)
      setAdjustmentSuccess(false)
      setShowDiff(false)
    }
  }

  // Apply final adjustments with Gemini Flash
  const applyFinalAdjustments = async () => {
    if (!resumeData || !finalAdjustments.trim()) return
    if (!storedGeminiKey) {
      setAdjustmentError('Add your API key to apply adjustments.')
      return
    }

    try {
      setIsAdjusting(true)
      setAdjustmentError(null)
      setAdjustmentSuccess(false)

      // Store original resume if not already stored
      if (!originalResume && resumeData) {
        setOriginalResume(cloneResumeData(resumeData))
      }

      const response = await fetch('/api/adjust-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': storedGeminiKey
        },
        body: JSON.stringify({
          resumeData,
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
        setResumeData(normalizedAdjusted as ResumeData)

        // Update session storage if this was a custom resume
        if (customResumeLoadedRef.current || selectedResume === 'custom') {
          storage.saveResume('custom', JSON.stringify(normalizedAdjusted, null, 2))
        }

        // Set success state
        setAdjustmentSuccess(true)
        setShowDiff(true)
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

  if (loading && !customResumeLoaded && selectedResume && selectedResume !== 'custom') {
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
  if (!resumeData && !customResumeLoaded) {
    return (
      <>
        <OnboardingWizard
          isOpen={isOnboardingOpen}
          onClose={handleCloseOnboarding}
          onComplete={handleCompleteOnboarding}
          geminiKeyHelpUrl={GEMINI_KEY_HELP_URL}
        />
        <GeminiKeyModal
          isOpen={showGeminiKeyModal && !storedGeminiKey}
          onClose={closeGeminiKeyModal}
          geminiKeyInput={geminiKeyInput}
          onInputChange={handleGeminiKeyInputChange}
          onSave={handleGeminiModalSave}
          isSaving={isValidatingKey}
          status={geminiKeyStatus}
          error={geminiKeyError}
          geminiKeyHelpUrl={GEMINI_KEY_HELP_URL}
          instructionsUrl={GEMINI_INSTRUCTIONS_URL}
          requireKey={isGeminiKeyRequired}
        />
        <ResumeIntake
          intakeMode={intakeMode}
          onIntakeModeChange={handleIntakeModeChange}
          pastedJSON={pastedJSON}
          onJSONChange={handleJSONPaste}
          isJSONValid={isJSONValid}
          jsonErrors={jsonErrors}
          onLoadJSON={loadCustomResume}
          onDownloadJSON={downloadPastedJSON}
          onJSONFileDrop={handleJSONFileDrop}
          isUploadingJSON={false}
          rawResumeText={rawResumeText}
          onRawTextChange={setRawResumeText}
          onConvertText={convertTextToResume}
          isConvertingText={isConvertingText}
          textConversionError={textConversionError}
          hasStoredKey={!!storedGeminiKey}
          onOpenOnboarding={handleOpenOnboarding}
          onDeleteGeminiKey={handleDeleteGeminiKey}
          geminiKeyInput={geminiKeyInput}
          geminiKeyStatus={geminiKeyStatus}
          geminiKeyError={geminiKeyError}
          isValidatingGeminiKey={isValidatingKey}
          onGeminiKeyInputChange={handleGeminiKeyInputChange}
          onSaveGeminiKey={handleSaveGeminiKeyClick}
          geminiKeyHelpUrl={GEMINI_KEY_HELP_URL}
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
      <OnboardingWizard
        isOpen={isOnboardingOpen}
        onClose={handleCloseOnboarding}
        onComplete={handleCompleteOnboarding}
        geminiKeyHelpUrl={GEMINI_KEY_HELP_URL}
      />
      <GeminiKeyModal
        isOpen={showGeminiKeyModal && !storedGeminiKey}
        onClose={closeGeminiKeyModal}
        geminiKeyInput={geminiKeyInput}
        onInputChange={handleGeminiKeyInputChange}
        onSave={handleGeminiModalSave}
        isSaving={isValidatingKey}
        status={geminiKeyStatus}
        error={geminiKeyError}
        geminiKeyHelpUrl={GEMINI_KEY_HELP_URL}
        instructionsUrl={GEMINI_INSTRUCTIONS_URL}
        requireKey={isGeminiKeyRequired}
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
          <div className="mx-auto w-full max-w-6xl px-6 py-14 space-y-10">
            <header className="rounded-[28px] border border-blue-100 bg-white/85 p-8 shadow-lg shadow-blue-100/60">
              <div className="space-y-6 md:space-y-5">
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-600/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-blue-700">
                  <Sparkles size={16} className="text-blue-600" />
                  Optimize workspace
                </span>
                <div className="space-y-3">
                  <h1 className="text-3xl font-bold leading-snug text-slate-900">
                    Tune your resume for each role
                  </h1>
                  <p className="text-base text-slate-600 max-w-2xl">
                    Load your JSON resume, target a job description, and approve every change before you export.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-3 text-sm text-blue-900">
                    <Check size={16} className="mt-0.5 flex-shrink-0" />
                    Focused suggestions keep your achievements in your voice while matching each job post.
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-3 text-sm text-blue-900">
                    <Check size={16} className="mt-0.5 flex-shrink-0" />
                    Review the diff, apply quick tweaks, and export when it’s ready.
                  </div>
                </div>
              </div>
            </header>

            <div className="flex flex-col gap-3 rounded-3xl border border-blue-100 bg-white/85 p-4 shadow-sm shadow-blue-100/50 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Sparkles size={16} className="text-blue-600" />
                <span>
                  {hasLoadedResume
                    ? 'Export the tailored resume whenever it feels ready.'
                    : 'Load a resume to unlock export and reset controls.'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={generatePDF}
                  disabled={!hasLoadedResume}
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Download size={16} /> Download PDF
                </button>
                <button
                  type="button"
                  onClick={exportJSON}
                  disabled={!hasLoadedResume}
                  className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                  title="Export JSON"
                >
                  <Download size={16} /> Export JSON
                </button>
                <button
                  type="button"
                  onClick={handleClearWorkspace}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  <RotateCcw size={16} /> Clear workspace + key
                </button>
              </div>
            </div>

            <WorkspaceActions
              resumeData={resumeData}
              jobDescription={jobDescription}
              onJobDescriptionChange={setJobDescription}
              optimizeResume={optimizeResume}
              isOptimizing={isOptimizing}
              optimizationError={optimizationError}
              optimizationSuccess={optimizationSuccess}
              storedGeminiKey={storedGeminiKey}
              finalAdjustments={finalAdjustments}
              onFinalAdjustmentsChange={setFinalAdjustments}
              applyFinalAdjustments={applyFinalAdjustments}
              isAdjusting={isAdjusting}
              adjustmentError={adjustmentError}
              adjustmentSuccess={adjustmentSuccess}
              originalResume={originalResume}
              revertToOriginal={revertToOriginal}
              showDiff={showDiff}
              setShowDiff={setShowDiff}
              diffItems={diffItems}
              maxDiffItems={MAX_DIFF_ITEMS}
              renderDiffValue={renderDiffValue}
              formatDiffPath={createPathLabel}
            />

            <section className="space-y-4 lg:space-y-5">
              <div className="space-y-1.5">
                <h2 className="text-lg font-semibold text-slate-900">Resume preview</h2>
                <p className="text-sm text-slate-600">
                  Make sure every update lands the way you expect before sharing.
                </p>
              </div>

              <div className="overflow-hidden rounded-[24px] border border-slate-200/70 bg-white shadow-lg shadow-slate-200/60">
                {resumeData && <ResumePreview resumeData={resumeData} />}
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  )
}

export default ResumeGenerator
