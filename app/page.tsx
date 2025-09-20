'use client'

import React, { useState, useEffect, useMemo } from 'react'
import DOMPurify from 'dompurify'
import { Download, Mail, Phone, MapPin, Globe, Linkedin, ChevronDown, ChevronUp, Upload, Check, AlertCircle, Sparkles, Loader2 } from 'lucide-react'
import { validateResumeJSON, ResumeData } from '@/lib/resume-types'

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
  if (value === null || value === undefined) return '—'
  if (Array.isArray(value)) return value.map((entry) => `${entry}`).join(', ')
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

const collectDiffs = (before: any, after: any, path: string[] = [], diffs: DiffItem[] = []) => {
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
    const primitives = before.every(isPrimitiveValue) && after.every(isPrimitiveValue)
    if (primitives) {
      if (!primitiveArraysEqual(before, after)) {
        diffs.push({ path, before: toDisplayString(before), after: toDisplayString(after) })
      }
      return diffs
    }

    const arrayKey = path[path.length - 1] || 'items'
    const parentPath = path.slice(0, -1)
    const maxLength = Math.max(before.length, after.length)

    for (let i = 0; i < maxLength; i += 1) {
      const beforeItem = before[i]
      const afterItem = after[i]
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
    const keys = new Set([...Object.keys(before), ...Object.keys(after)])
    keys.forEach((key) => {
      collectDiffs((before as any)[key], (after as any)[key], [...path, key], diffs)
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
  JSON.parse(JSON.stringify(data))

const MAX_DIFF_ITEMS = 50

const ResumeGenerator = () => {
  const [resumeData, setResumeData] = useState<any>(null)
  const [availableResumes, setAvailableResumes] = useState<ResumeOption[]>([])
  const [selectedResume, setSelectedResume] = useState<string>('')
  const [loading, setLoading] = useState(true)
  
  // Paste JSON functionality
  const [pastedJSON, setPastedJSON] = useState<string>('')
  const [isJSONValid, setIsJSONValid] = useState<boolean | null>(null)
  const [jsonErrors, setJsonErrors] = useState<string[]>([])
  const [customResumeLoaded, setCustomResumeLoaded] = useState(false)
  
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

  const diffItems = useMemo(
    () => buildResumeDiff(originalResume, (resumeData as ResumeData | null) ?? null),
    [originalResume, resumeData]
  )

  const displayedDiffs = useMemo(() => diffItems.slice(0, MAX_DIFF_ITEMS), [diffItems])

  const hasMoreDiffs = diffItems.length > MAX_DIFF_ITEMS

  useEffect(() => {
    if (diffItems.length === 0) {
      setShowDiff(false)
    }
  }, [diffItems.length])

  useEffect(() => {
    // Load available resumes on component mount
    fetchAvailableResumes()
    
    // Check for saved custom resume
    const savedJSON = sessionStorage.getItem('customResumeJSON')
    if (savedJSON) {
      handleJSONPaste(savedJSON)
    }
  }, [])

  useEffect(() => {
    // Load selected resume data when selection changes
    if (selectedResume && selectedResume !== 'custom') {
      fetchResumeData(selectedResume)
      setCustomResumeLoaded(false)
    }
  }, [selectedResume])

  const fetchAvailableResumes = async () => {
    try {
      const response = await fetch('/api/resume')
      const resumes = await response.json()
      setAvailableResumes(resumes)
      
      // Auto-select the first resume (current.json if available)
      const defaultResume = resumes.find((r: ResumeOption) => r.id === 'current') || resumes[0]
      if (defaultResume) {
        setSelectedResume(defaultResume.filename)
      }
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
      setResumeData(data)
      setCustomResumeLoaded(false)
    } catch (error) {
      console.error('Error fetching resume data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generatePDF = () => {
    window.print()
  }

  const exportJSON = () => {
    if (!resumeData) return
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(resumeData, null, 2))
    const dlAnchor = document.createElement('a')
    dlAnchor.setAttribute("href", dataStr)
    dlAnchor.setAttribute("download", selectedResume || "CV.json")
    document.body.appendChild(dlAnchor)
    dlAnchor.click()
    dlAnchor.remove()
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
      const parsed = JSON.parse(value)
      const validation = validateResumeJSON(parsed)
      
      setIsJSONValid(validation.isValid)
      setJsonErrors(validation.errors)
      
      // Store in sessionStorage
      if (validation.isValid) {
        sessionStorage.setItem('customResumeJSON', value)
      }
    } catch (error) {
      setIsJSONValid(false)
      setJsonErrors(['Invalid JSON format. Please check your syntax.'])
    }
  }

  // Load custom resume from pasted JSON
  const loadCustomResume = () => {
    if (!isJSONValid || !pastedJSON) return
    
    try {
      const parsed = JSON.parse(pastedJSON)
      setResumeData(parsed)
      setSelectedResume('custom')
      setCustomResumeLoaded(true)
      setLoading(false)
      setOriginalResume(null)
      setShowDiff(false)
      setOptimizationSuccess(false)
      setAdjustmentSuccess(false)
    } catch (error) {
      console.error('Error loading custom resume:', error)
    }
  }

  // Clear custom resume
  const clearCustomResume = () => {
    setPastedJSON('')
    setIsJSONValid(null)
    setJsonErrors([])
    setCustomResumeLoaded(false)
    setOptimizationSuccess(false)
    setAdjustmentSuccess(false)
    setFinalAdjustments('')
    setOriginalResume(null)
    setShowDiff(false)
    sessionStorage.removeItem('customResumeJSON')

    // Revert to first available resume
    if (availableResumes.length > 0) {
      const defaultResume = availableResumes.find((r: ResumeOption) => r.id === 'current') || availableResumes[0]
      if (defaultResume) {
        setSelectedResume(defaultResume.filename)
        // This will trigger fetchResumeData via useEffect
      }
    }
  }

  // Optimize resume with Gemini
  const optimizeResume = async () => {
    if (!resumeData || !jobDescription.trim()) return
    
    try {
      setIsOptimizing(true)
      setOptimizationError(null)
      setOptimizationSuccess(false)
      
      // Store original resume for comparison
      if (!originalResume && resumeData) {
        setOriginalResume(cloneResumeData(resumeData as ResumeData))
      }
      
      const response = await fetch('/api/optimize-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeData,
          jobDescription
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Optimization failed')
      }
      
      if (result.success && result.optimizedResume) {
        // Update resume data with optimized version
        setResumeData(result.optimizedResume)

        // Update session storage if this was a custom resume
        if (customResumeLoaded) {
          sessionStorage.setItem('customResumeJSON', JSON.stringify(result.optimizedResume, null, 2))
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
      if (customResumeLoaded) {
        sessionStorage.setItem('customResumeJSON', JSON.stringify(originalResume, null, 2))
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

    try {
      setIsAdjusting(true)
      setAdjustmentError(null)
      setAdjustmentSuccess(false)

      // Store original resume if not already stored
      if (!originalResume && resumeData) {
        setOriginalResume(cloneResumeData(resumeData as ResumeData))
      }

      const response = await fetch('/api/adjust-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeData,
          adjustmentInstructions: finalAdjustments
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Adjustment failed')
      }

      if (result.success && result.adjustedResume) {
        // Update resume data with adjusted version
        setResumeData(result.adjustedResume)

        // Update session storage if this was a custom resume
        if (customResumeLoaded) {
          sessionStorage.setItem('customResumeJSON', JSON.stringify(result.adjustedResume, null, 2))
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

  const renderHTMLContent = (htmlContent: string) => {
    const sanitizedHtml = typeof window !== 'undefined'
      ? DOMPurify.sanitize(htmlContent)
      : htmlContent

    return (
      <div
        className="text-gray-700 leading-tight text-xs"
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    )
  }

  const renderSummary = (summary: string) => {
    if (summary.includes('<') && summary.includes('>')) {
      return renderHTMLContent(summary)
    }
    
    const points = summary.split('•').filter(point => point.trim())
    if (points.length > 1) {
      return (
        <ul className="space-y-1">
          {points.map((point, index) => (
            <li key={index} className="flex items-start">
              <span className="text-blue-600 mr-2 text-xs">•</span>
              <span className="text-gray-700 leading-tight text-xs">{point.trim()}</span>
            </li>
          ))}
        </ul>
      )
    }
    return <p className="text-gray-700 leading-tight text-xs">{summary}</p>
  }

  const renderDiffValue = (value: string) => {
    const trimmedValue = value?.trim()

    if (!trimmedValue || trimmedValue === '—') {
      return <p className="text-xs text-gray-500">—</p>
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

  if ((loading && !customResumeLoaded) || (!resumeData && !customResumeLoaded)) {
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
      <div className="min-h-screen bg-gray-50">
        <div className="print:hidden p-4 bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Resume Generator</h1>
              <p className="text-gray-600 mb-8">Paste your resume JSON below to get started</p>
              
              {/* Paste JSON Section */}
              <div className="max-w-2xl mx-auto bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="space-y-4">
                  <textarea
                    value={pastedJSON}
                    onChange={(e) => handleJSONPaste(e.target.value)}
                    placeholder="Paste your resume JSON here..."
                    className="w-full h-48 px-4 py-3 text-sm font-mono border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    spellCheck={false}
                  />
                  
                  {/* Validation Status */}
                  {pastedJSON && (
                    <div className="text-left">
                      {isJSONValid === true && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-green-600 text-sm">
                            <Check size={16} />
                            <span>Valid JSON format</span>
                          </div>
                          <button
                            onClick={loadCustomResume}
                            className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded hover:bg-green-700 transition-colors shadow-sm"
                          >
                            Load Resume
                          </button>
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Control Panel - hidden when printing */}
      <div className="print:hidden p-4 bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto">
          {/* Top Row - Title and Actions */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">Resume Generator</h1>
              
              {/* Resume Version Selector */}
              <div className="relative">
                <select
                  value={selectedResume}
                  onChange={(e) => setSelectedResume(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded px-3 py-1.5 pr-8 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {customResumeLoaded && (
                    <option value="custom">📋 Custom Resume</option>
                  )}
                  {availableResumes.map((resume) => (
                    <option key={resume.id} value={resume.filename}>
                      {resume.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
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
          
          {/* AI Optimization Section */}
          {(resumeData || customResumeLoaded) && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mt-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                  <Sparkles size={16} />
                  AI Resume Optimization
                </h2>
                {originalResume && (
                  <button
                    onClick={revertToOriginal}
                    className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Revert to Original
                  </button>
                )}
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Job Description
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste job description here..."
                    className="w-full h-32 px-3 py-2 text-xs border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    spellCheck={false}
                  />
                </div>
                
                {/* Optimization Status and Button */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {optimizationError && (
                      <div className="flex items-start gap-2 text-red-600 text-xs mb-2">
                        <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-medium">Optimization failed:</div>
                          <div>{optimizationError}</div>
                        </div>
                      </div>
                    )}
                    
                    {optimizationSuccess && !isOptimizing && (
                      <div className="flex items-center gap-1 text-green-600 text-xs">
                        <Check size={14} />
                        <span>Resume optimized! Generate PDF to see changes.</span>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={optimizeResume}
                    disabled={isOptimizing || !jobDescription.trim() || !resumeData}
                    className="px-4 py-2 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isOptimizing ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Optimizing...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        Optimize Resume
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Final Adjustments Section */}
          {(resumeData || customResumeLoaded) && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200 mt-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-green-700 flex items-center gap-2">
                  <Sparkles size={16} />
                  Final Adjustments
                </h2>
                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                  Powered by Gemini 2.5 Flash
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Quick Adjustments
                  </label>
                  <textarea
                    value={finalAdjustments}
                    onChange={(e) => setFinalAdjustments(e.target.value)}
                    placeholder="Make it shorter, remove certain sections, emphasize specific skills, etc..."
                    className="w-full h-24 px-3 py-2 text-xs border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    spellCheck={false}
                  />
                </div>

                {/* Adjustment Status and Button */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {adjustmentError && (
                      <div className="flex items-start gap-2 text-red-600 text-xs mb-2">
                        <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-medium">Adjustment failed:</div>
                          <div>{adjustmentError}</div>
                        </div>
                      </div>
                    )}

                    {adjustmentSuccess && !isAdjusting && (
                      <div className="flex items-center gap-1 text-green-600 text-xs">
                        <Check size={14} />
                        <span>Adjustments applied! Generate PDF to see changes.</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={applyFinalAdjustments}
                    disabled={isAdjusting || !finalAdjustments.trim() || !resumeData}
                    className="px-4 py-2 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isAdjusting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Adjusting...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        Apply Adjustments
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {diffItems.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-blue-200 mt-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-blue-700">AI Changes Preview</h2>
                  <p className="text-xs text-gray-600 mt-1">
                    Comparing the current resume to your saved original.
                  </p>
                </div>
                <button
                  onClick={() => setShowDiff((prev) => !prev)}
                  className="self-start px-3 py-1.5 text-xs font-medium text-blue-700 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                >
                  {showDiff ? 'Hide Changes' : `View Changes (${diffItems.length})`}
                </button>
              </div>

              {showDiff ? (
                <div className="mt-3 space-y-3 max-h-64 overflow-y-auto pr-1">
                  {displayedDiffs.map((item, index) => (
                    <div
                      key={`${item.path.join('.')}-${index}`}
                      className="border border-blue-100 bg-blue-50 rounded-lg p-3 shadow-sm"
                    >
                      <div className="text-xs font-semibold uppercase tracking-wide text-blue-800">
                        {createPathLabel(item.path)}
                      </div>
                      <div className="mt-2 grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-[11px] font-semibold uppercase text-gray-500">Before</p>
                          <div className="mt-1 rounded border border-white/70 bg-white/80 p-2">
                            {renderDiffValue(item.before)}
                          </div>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase text-gray-500">After</p>
                          <div className="mt-1 rounded border border-white/70 bg-white/80 p-2">
                            {renderDiffValue(item.after)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {hasMoreDiffs && (
                    <p className="text-xs text-gray-500">
                      Showing first {MAX_DIFF_ITEMS} changes. Use JSON export for the full diff.
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-xs text-gray-600">
                  Click “View Changes” to review what Gemini updated before you download or export.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Resume Content */}
      <div className="max-w-4xl mx-auto bg-white text-gray-900 leading-tight text-xs resume-content">
        {/* Header */}
        <div className="text-center py-1.5 border-b border-gray-300">
          <h1 className="text-xl font-bold text-gray-900 mb-0.5 tracking-wide">
            {resumeData.basics.name}
          </h1>
          <p className="text-blue-600 font-semibold text-sm mb-1">
            {resumeData.basics.headline}
          </p>
          
          {/* Contact Info */}
          <div className="flex justify-center items-center gap-x-3 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Mail size={8} />
              <a href={`mailto:${resumeData.basics.email}`} className="hover:text-blue-600">
                {resumeData.basics.email}
              </a>
            </div>
            <div className="flex items-center gap-1">
              <Phone size={8} />
              <span>{resumeData.basics.phone}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin size={8} />
              <span>{resumeData.basics.location}</span>
            </div>
            {resumeData.basics.url && resumeData.basics.url.href && (
              <div className="flex items-center gap-1">
                <Globe size={8} />
                <a href={resumeData.basics.url.href} className="hover:text-blue-600">
                  {resumeData.basics.url.label || resumeData.basics.url.href}
                </a>
              </div>
            )}
            {resumeData.basics.customFields && resumeData.basics.customFields.length > 0 && (
              <>
                {resumeData.basics.customFields.map((field: any, index: number) => (
                  <div key={index} className="flex items-center gap-1">
                    <Linkedin size={8} />
                    <a href={field.value} className="hover:text-blue-600">
                      {field.name}
                    </a>
                  </div>
                ))}
              </>
            )}
            {resumeData.basics.profiles && resumeData.basics.profiles.length > 0 && (
              <>
                {resumeData.basics.profiles.map((profile: any, index: number) => (
                  <div key={index} className="flex items-center gap-1">
                    {profile.network === 'LinkedIn' && <Linkedin size={8} />}
                    <a href={profile.url} className="hover:text-blue-600">
                      {profile.username || profile.url}
                    </a>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Summary */}
        {resumeData.sections.summary && resumeData.sections.summary.visible && resumeData.sections.summary.content && (
          <div className="py-1">
            <h2 className="text-base font-bold text-gray-900 mb-1 pb-0.5 border-b border-blue-600 uppercase tracking-wide">
              {resumeData.sections.summary.name}
            </h2>
            <div className="text-gray-700 leading-tight text-xs mt-0.5">
              {renderSummary(resumeData.sections.summary.content)}
            </div>
          </div>
        )}

        {/* Experience */}
        {resumeData.sections.experience && resumeData.sections.experience.visible && resumeData.sections.experience.items && resumeData.sections.experience.items.length > 0 && (
          <div className="py-1">
            <h2 className="text-base font-bold text-gray-900 mb-1 pb-0.5 border-b border-blue-600 uppercase tracking-wide">
              {resumeData.sections.experience.name}
            </h2>
            <div className="space-y-2">
              {resumeData.sections.experience.items.map((exp: any, index: number) => (
                <div key={index}>
                  <div className="flex justify-between items-start mb-0.5">
                    <div className="flex-1">
                      <h3 className="text-sm text-gray-900">
                        {exp.position.includes('|') ? (
                          <>
                            {exp.position.split('|').reverse().map((part: string, idx: number) => (
                              <span key={idx}>
                                {idx === 0 ? (
                                  <span className="font-bold">{part.trim()}</span>
                                ) : (
                                  <>
                                    <span className="text-gray-400 mx-1.5">|</span>
                                    <span className="font-medium">{part.trim()}</span>
                                  </>
                                )}
                              </span>
                            ))}
                          </>
                        ) : (
                          <>
                            {exp.company && (
                              <>
                                <span className="font-bold">{exp.company}</span>
                                <span className="text-gray-400 mx-1.5">|</span>
                              </>
                            )}
                            <span className="font-medium">{exp.position}</span>
                          </>
                        )}
                      </h3>
                    </div>
                    <div className="text-right text-xs text-gray-500 ml-3">
                      <p className="font-medium">{exp.date}</p>
                      {exp.location && <p className="text-xs">{exp.location}</p>}
                    </div>
                  </div>
                  {exp.summary && (
                    <div className="text-gray-700 text-xs leading-tight mt-0.5">
                      {renderSummary(exp.summary)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {resumeData.sections.projects && resumeData.sections.projects.visible && resumeData.sections.projects.items && resumeData.sections.projects.items.length > 0 && (
          <div className="py-1">
            <h2 className="text-base font-bold text-gray-900 mb-1 pb-0.5 border-b border-blue-600 uppercase tracking-wide">
              {resumeData.sections.projects.name}
            </h2>
            <div className="space-y-1.5">
              {resumeData.sections.projects.items.map((project: any, index: number) => (
                <div key={index}>
                  <div className="flex justify-between items-start mb-0.5">
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-gray-900">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-gray-700 font-medium text-xs">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-xs text-gray-500 ml-3">
                      {project.date && <p className="font-medium">{project.date}</p>}
                    </div>
                  </div>
                  {project.summary && (
                    <div className="text-gray-700 text-xs leading-tight mb-0.5">
                      {renderSummary(project.summary)}
                    </div>
                  )}
                  {project.keywords && project.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 mb-0.5">
                      {project.keywords.map((keyword: string, kidx: number) => (
                        <span key={kidx} className="bg-blue-100 text-blue-800 text-xs px-1 py-0.5 rounded">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}
                  {project.url && project.url.href && project.url.label && (
                    <div>
                      <a href={project.url.href} className="text-blue-600 hover:underline text-xs">
                        {project.url.label.toLowerCase()}
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {resumeData.sections.skills && resumeData.sections.skills.visible && resumeData.sections.skills.items && resumeData.sections.skills.items.length > 0 && (
          <div className="py-1">
            <h2 className="text-base font-bold text-gray-900 mb-1 pb-0.5 border-b border-blue-600 uppercase tracking-wide">
              {resumeData.sections.skills.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5 skills-grid">
              {resumeData.sections.skills.items.map((skill: any, index: number) => (
                <div key={index}>
                  <h3 className="font-semibold text-gray-900 mb-0.5 text-xs">{skill.name}</h3>
                  <div className="flex flex-wrap gap-0.5">
                    {skill.keywords && skill.keywords.map((keyword: string, kidx: number) => (
                      <span key={kidx} className="bg-blue-100 text-blue-800 text-xs px-1 py-0.5 rounded-full">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {resumeData.sections.education && resumeData.sections.education.visible && resumeData.sections.education.items && resumeData.sections.education.items.length > 0 && (
          <div className="py-1">
            <h2 className="text-base font-bold text-gray-900 mb-1 pb-0.5 border-b border-blue-600 uppercase tracking-wide">
              {resumeData.sections.education.name}
            </h2>
            <div className="space-y-1.5">
              {resumeData.sections.education.items.map((edu: any, index: number) => (
                <div key={index}>
                  <div className="flex justify-between items-start mb-0.5">
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-gray-900">
                        {edu.institution}
                      </h3>
                      <p className="text-blue-600 font-semibold text-xs">
                        {edu.studyType}
                      </p>
                    </div>
                    <div className="text-right text-xs text-gray-500 ml-3">
                      <p className="font-medium">{edu.date}</p>
                      {edu.location && <p className="text-xs">{edu.location}</p>}
                    </div>
                  </div>
                  {edu.score && (
                    <p className="text-xs text-gray-600 mb-0.5">GPA: {edu.score}</p>
                  )}
                  {edu.summary && (
                    <div className="text-gray-700 text-xs leading-tight">
                      {renderSummary(edu.summary)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ResumeGenerator
