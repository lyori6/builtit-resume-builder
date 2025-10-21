'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import DOMPurify from 'dompurify'
import { Download, ChevronDown, ChevronUp, Upload, Check, AlertCircle, Sparkles, Loader2, X } from 'lucide-react'
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

interface ResumeOption {
  id: string
  name: string
  filename: string
}

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
  const [availableResumes, setAvailableResumes] = useState<ResumeOption[]>([])
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
  const [jsonPasteCollapsed, setJsonPasteCollapsed] = useState<boolean>(true)

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
    // Load available resumes on component mount
    fetchAvailableResumes()
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

  const fetchAvailableResumes = async () => {
    try {
      const response = await fetch('/api/resume')
      const resumes = await response.json()
      setAvailableResumes(resumes)
    } catch (error) {
      console.error('Error fetching available resumes:', error)
    }
  }

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
    setShowGeminiKeyModal(false)
    setGeminiKeyInput('')
    if (!storedGeminiKey) {
      setGeminiKeyStatus('idle')
      setGeminiKeyError(null)
    }
  }

  const handleGeminiModalSave = async () => {
    const success = await handleSaveGeminiKey()
    if (success) {
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

  const clearWorkspace = () => {
    storage.clearAll()
    handleDeleteGeminiKey()
    setShowGeminiKeyModal(false)

    setRawResumeText('')
    setTextConversionError(null)
    setIntakeMode('text')
    setPastedJSON('')
    setIsJSONValid(null)
    setJsonErrors([])
    setCustomResumeLoaded(false)
    customResumeLoadedRef.current = false
    setResumeData(null)
    setOriginalResume(null)
    setOptimizationSuccess(false)
    setAdjustmentSuccess(false)
    setFinalAdjustments('')
    setShowDiff(false)
    setSystemPrompt(DEFAULT_OPTIMIZATION_SYSTEM_PROMPT)
    setAdjustmentPrompt(DEFAULT_ADJUSTMENT_SYSTEM_PROMPT)
    setConversionPrompt(DEFAULT_TEXT_CONVERSION_SYSTEM_PROMPT)
    setDraftSystemPrompt(DEFAULT_OPTIMIZATION_SYSTEM_PROMPT)
    setDraftAdjustmentPrompt(DEFAULT_ADJUSTMENT_SYSTEM_PROMPT)
    setDraftConversionPrompt(DEFAULT_TEXT_CONVERSION_SYSTEM_PROMPT)
    setPromptSaveState('idle')
    setPromptError(null)
    setShowPromptSettings(false)
    setSelectedResume('')
    setLoading(true)

    void fetchAvailableResumes()
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

  // Clear custom resume
  const clearCustomResume = () => {
    setPastedJSON('')
    setIsJSONValid(null)
    setJsonErrors([])
    setResumeData(null)
    setCustomResumeLoaded(false)
    customResumeLoadedRef.current = false
    setOptimizationSuccess(false)
    setAdjustmentSuccess(false)
    setFinalAdjustments('')
    setOriginalResume(null)
    setShowDiff(false)
    storage.removeResume('custom')
    setLoading(true)
    setIntakeMode('json')
    setRawResumeText('')
    setTextConversionError(null)

    // Revert to first available resume
    if (availableResumes.length > 0) {
      const defaultResume = availableResumes.find((r: ResumeOption) => r.id === 'current') || availableResumes[0]
      if (defaultResume) {
        setSelectedResume(defaultResume.filename)
        // This will trigger fetchResumeData via useEffect
      }
    }
  }

  const convertTextToResume = async () => {
    if (!rawResumeText.trim()) {
      setTextConversionError('Paste your resume text before converting.')
      return
    }
    if (!storedGeminiKey) {
      setTextConversionError('Add your Gemini API key to convert resume text.')
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
      setOptimizationError('Add your Gemini API key to run optimization.')
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
      setAdjustmentError('Add your Gemini API key to apply adjustments.')
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

      <div className="min-h-screen bg-gray-50">
      {/* Control Panel - hidden when printing */}
      <div className="print:hidden p-4 bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto">
          {/* Top Row - Title and Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">Resume Generator</h1>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {availableResumes.length > 0 && (
                <button
                  onClick={() => setSelectedResume(availableResumes[0].filename)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-white text-gray-700 border border-gray-300 rounded hover:border-gray-400 hover:text-gray-900 transition-colors shadow-sm"
                >
                  <Upload size={14} /> Load sample resume
                </button>
              )}
              <button
                onClick={() => setShowPromptSettings(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors shadow-sm"
              >
                <Sparkles size={14} /> Prompt settings
              </button>
              <button
                onClick={generatePDF}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Download size={14} /> Download PDF
              </button>
              <button
                onClick={exportJSON}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors shadow-sm"
                title="Export JSON"
              >
                <Download size={14} /> Export JSON
              </button>
            </div>
          </div>
          
          {/* Paste JSON Section */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setJsonPasteCollapsed(!jsonPasteCollapsed)}
                data-testid="json-panel-toggle"
                aria-expanded={!jsonPasteCollapsed}
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
              >
                <Upload size={16} />
                Paste Resume JSON
                {jsonPasteCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>
              {customResumeLoaded && (
                <button
                  onClick={clearCustomResume}
                  className="text-xs text-red-600 hover:text-red-800 transition-colors"
                >
                  Clear Custom Resume
                </button>
              )}
            </div>

            {!jsonPasteCollapsed && (
              <div className="space-y-3">
              <textarea
                value={pastedJSON}
                onChange={(e) => handleJSONPaste(e.target.value)}
                placeholder="Paste your resume JSON here..."
                data-testid="json-textarea"
                className="w-full h-32 px-3 py-2 text-xs font-mono border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                spellCheck={false}
              />
              
              {/* Validation Status */}
              {pastedJSON && (
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    {isJSONValid === true && (
                      <div className="flex items-center gap-1 text-green-600 text-xs">
                        <Check size={14} />
                        <span>Valid JSON format</span>
                      </div>
                    )}
                    {isJSONValid === false && (
                      <div className="flex items-start gap-1 text-red-600 text-xs">
                        <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-medium">Invalid JSON:</div>
                          <ul className="list-disc list-inside mt-1 space-y-0.5">
                            {jsonErrors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {isJSONValid === true && !customResumeLoaded && (
                    <button
                      onClick={loadCustomResume}
                      data-testid="load-resume-button"
                      className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 transition-colors shadow-sm"
                    >
                      Load Resume
                    </button>
                  )}
                </div>
              )}
              </div>
            )}
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
        </div>
      </div>

      {resumeData && <ResumePreview resumeData={resumeData} />}
    </div>
    </>
  )
}

export default ResumeGenerator
