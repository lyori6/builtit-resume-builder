'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Check, AlertCircle } from 'lucide-react'
import { storage } from '@/lib/local-storage'
import {
  OptimizerProvider,
  useOptimizerContext,
  ApiKeyStatus
} from '@/src/state/optimizer-context'
import { useResumeOptimizer } from '@/src/hooks/useResumeOptimizer'
import { useResumeIO } from '@/src/hooks/useResumeIO'
import { DEMO_OPTIMIZATION } from '@/src/demo/demo-content'

// Components
import IntakeView from '@/components/views/IntakeView'
import JobSetupView from '@/components/views/JobSetupView'
import ResultsView from '@/components/views/ResultsView'
import GeminiKeyModal from '@/components/GeminiKeyModal'
import DemoVideoModal from '@/components/DemoVideoModal'
import APIKeyStatusBadge from '@/components/APIKeyStatusBadge'
import PromptSettingsModal from '@/components/PromptSettingsModal'
import ProcessingModal from '@/components/ProcessingModal'

// Constants
const DEMO_VIDEO_ID = 'landing-demo'

const ResumeGeneratorContent = () => {
  const { state, dispatch } = useOptimizerContext()
  const optimizer = useResumeOptimizer()
  const io = useResumeIO()

  // UI State
  const [showPromptSettings, setShowPromptSettings] = useState(false)
  const [isGeminiKeyRequired, setIsGeminiKeyRequired] = useState(false)
  const [geminiKeyInput, setGeminiKeyInput] = useState('')

  // Initialize prompts and check for auto-load
  useEffect(() => {
    const savedPrompts = storage.getPrompts()
    if (savedPrompts.systemPrompt) optimizer.actions.setSystemPrompt(savedPrompts.systemPrompt)
    if (savedPrompts.adjustmentPrompt) optimizer.actions.setAdjustmentPrompt(savedPrompts.adjustmentPrompt)
    if (savedPrompts.conversionPrompt) io.actions.setConversionPrompt(savedPrompts.conversionPrompt)

    // Auto-load logic
    const savedResumes = storage.getResumes()
    const apiKey = storage.getGeminiApiKey()

    if (apiKey && savedResumes.length > 0) {
      // Sort by updatedAt desc
      const mostRecent = savedResumes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
      if (mostRecent) {
        const resume = storage.getResume(mostRecent.id)
        if (resume) {
          dispatch({ type: 'SET_WORKSPACE_RESUME', json: JSON.stringify(resume.data) })
          dispatch({ type: 'SET_LOADED_SOURCE', source: { type: 'custom', id: mostRecent.id } })
          dispatch({ type: 'SET_STEP', step: 'job' })
          dispatch({ type: 'SAVE_API_KEY', key: apiKey }) // Ensure key is in state
        }
      }
    }
  }, [])

  // Handle API Key Logic
  const handleSaveGeminiKey = async () => {
    const trimmedKey = geminiKeyInput.trim()
    if (!trimmedKey) {
      dispatch({ type: 'SET_API_KEY_STATUS', status: 'error', errorMessage: 'Enter your Gemini API key before saving.' })
      return false
    }

    try {
      dispatch({ type: 'SET_API_KEY_STATUS', status: 'validating' })
      const response = await fetch('/api/check-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: trimmedKey })
      })

      const data = await response.json()
      if (data.ok || data.valid) {
        dispatch({ type: 'SAVE_API_KEY', key: trimmedKey })
        return true
      } else {
        dispatch({ type: 'SET_API_KEY_STATUS', status: 'error', errorMessage: 'Invalid API key. Please check and try again.' })
        return false
      }
    } catch (error) {
      dispatch({ type: 'SET_API_KEY_STATUS', status: 'error', errorMessage: 'Validation failed. Check your connection.' })
      return false
    }
  }

  const handleGeminiModalSave = async () => {
    const success = await handleSaveGeminiKey()
    if (success) {
      setIsGeminiKeyRequired(false)
      dispatch({ type: 'HIDE_API_KEY_MODAL' })
      dispatch({ type: 'HIDE_API_KEY_MODAL' })

      // Resume pending actions
      if (io.state.pendingConversion) {
        console.log('Resuming pending conversion with text length:', state.resume.originalText?.length)
        io.actions.setPendingConversion(false)
        // Pass the new key directly to avoid race condition with state update
        const result = await io.actions.convertTextToResume(state.resume.originalText, geminiKeyInput.trim())
        if (result === true) {
          dispatch({ type: 'SET_STEP', step: 'job' })
        }
      }
    }
    return success
  }

  const closeGeminiKeyModal = () => {
    if (isGeminiKeyRequired) return
    dispatch({ type: 'HIDE_API_KEY_MODAL' })
    setGeminiKeyInput('')
    setIsGeminiKeyRequired(false)
    if (!state.apiKey.value) {
      dispatch({ type: 'SET_API_KEY_STATUS', status: 'idle' })
    }
  }

  // Handlers
  const handleStartYourOwn = () => {
    dispatch({ type: 'SET_STEP', step: 'resume' })
    dispatch({ type: 'SET_DEMO_MODE', isActive: false })
  }

  const handleSeeDemo = () => {
    dispatch({ type: 'SET_ACTIVE_VIDEO', videoId: DEMO_VIDEO_ID })
  }

  const handleDemoMode = () => {
    dispatch({ type: 'SET_DEMO_MODE', isActive: true })
    dispatch({ type: 'SET_STEP', step: 'results' })

    // Load demo data
    // Fix: Ensure we are parsing strings if they are strings, or using objects directly
    const demoResume = typeof DEMO_OPTIMIZATION.originalResume === 'string'
      ? JSON.parse(DEMO_OPTIMIZATION.originalResume)
      : DEMO_OPTIMIZATION.originalResume

    const demoOptimized = typeof DEMO_OPTIMIZATION.optimizedResume === 'string'
      ? JSON.parse(DEMO_OPTIMIZATION.optimizedResume)
      : DEMO_OPTIMIZATION.optimizedResume

    const originalResumeJson = typeof DEMO_OPTIMIZATION.originalResume === 'string'
      ? DEMO_OPTIMIZATION.originalResume
      : JSON.stringify(DEMO_OPTIMIZATION.originalResume)

    const optimizedResumeJson = typeof DEMO_OPTIMIZATION.optimizedResume === 'string'
      ? DEMO_OPTIMIZATION.optimizedResume
      : JSON.stringify(DEMO_OPTIMIZATION.optimizedResume)

    dispatch({ type: 'SET_WORKSPACE_RESUME', json: originalResumeJson })
    optimizer.actions.setOriginalResume(demoResume)

    dispatch({
      type: 'OPTIMIZE_SUCCESS',
      payload: {
        optimizedText: JSON.stringify(demoOptimized, null, 2),
        optimizedJson: optimizedResumeJson,
        metadata: DEMO_OPTIMIZATION.metadata,
        diffItems: DEMO_OPTIMIZATION.diffItems || []
      }
    })

    dispatch({ type: 'SET_JOB_DESCRIPTION', text: DEMO_OPTIMIZATION.jobDescription })
  }

  const handleConvertText = async () => {
    const result = await io.actions.convertTextToResume(state.resume.originalText)
    if (result === 'missing_key') {
      setIsGeminiKeyRequired(false) // Allow dismissal
      dispatch({ type: 'SHOW_API_KEY_MODAL' })
    } else if (result === true) {
      dispatch({ type: 'SET_STEP', step: 'job' })
    }
  }

  const handleLoadJSON = () => {
    const success = io.actions.loadCustomResume()
    if (success) {
      dispatch({ type: 'SET_STEP', step: 'job' })
    }
  }

  const handleFileDrop = (file: File) => {
    io.actions.handleJSONFileDrop(file, (success) => {
      if (success) {
        dispatch({ type: 'SET_STEP', step: 'job' })
      }
    })
  }

  const handleOptimize = () => {
    if (!state.apiKey.value) {
      setIsGeminiKeyRequired(false)
      dispatch({ type: 'SHOW_API_KEY_MODAL' })
      return
    }
    optimizer.actions.optimizeResume()
  }

  // Render Logic
  const renderContent = () => {
    // Demo Mode Override
    if (state.ui.isDemoMode) {
      return (
        <ResultsView
          resumeData={optimizer.state.optimizedResumeData || optimizer.state.resumeForWorkspace}
          originalResume={optimizer.state.originalResume}
          diffItems={state.optimization.diffItems}
          onDownloadPDF={() => window.print()}
          onExportJSON={() => io.actions.downloadJSONFile(state.resume.optimizedJson || '', 'optimized-resume.json')}
          onTryAnotherJob={() => {
            dispatch({ type: 'SET_DEMO_MODE', isActive: false })
            dispatch({ type: 'RESET_OPTIMIZATION' })
            dispatch({ type: 'SET_STEP', step: 'landing' })
          }}
          finalAdjustments={optimizer.state.finalAdjustments}
          onFinalAdjustmentsChange={optimizer.actions.setFinalAdjustments}
          onApplyAdjustments={() => { }} // Disabled in demo
          isAdjusting={false}
          adjustmentError={null}
          adjustmentSuccess={false}
          onClearAdjustments={() => { }}
          renderDiffValue={optimizer.actions.renderDiffValue}
          formatDiffPath={optimizer.actions.formatDiffPath}
          summaryMetrics={[
            { id: 'improvements', value: '12', label: 'Improvements' },
            { id: 'keywords', value: '8', label: 'Keywords Matched' }
          ]}
          jobDescription={state.jobDescription.text}
        />
      )
    }

    switch (state.uiStep) {
      case 'landing':
      case 'resume':
        return (
          <IntakeView
            onStartOwn={handleStartYourOwn}
            onSeeDemo={handleDemoMode}
            onFileDrop={handleFileDrop}
            resumeText={state.resume.originalText}
            onResumeTextChange={(text) => dispatch({ type: 'SET_RESUME_TEXT', text })}
            isConverting={io.state.isConvertingText}
            conversionError={io.state.textConversionError}
            onConvert={handleConvertText}
            pastedJSON={io.state.pastedJSON}
            onJSONChange={io.actions.handleJSONPaste}
            isJSONValid={io.state.isJSONValid}
            jsonErrors={io.state.jsonErrors}
            onLoadJSON={handleLoadJSON}
            showPromptHelper={showPromptSettings}
            onTogglePromptHelper={() => setShowPromptSettings(!showPromptSettings)}
            isUploadingJSON={io.state.isUploadingJSON}
          />
        )

      case 'job':
      case 'optimizing': // Show job setup while optimizing (with loading state handled in WorkspaceActions)
        return (
          <JobSetupView
            resumeData={optimizer.state.resumeForWorkspace}
            jobDescription={state.jobDescription.text}
            onJobDescriptionChange={(text) => dispatch({ type: 'SET_JOB_DESCRIPTION', text })}
            onOptimize={handleOptimize}
            onDownloadPDF={() => window.print()}
            onExportJSON={() => io.actions.downloadJSONFile(state.resume.workspaceJson || '', 'resume.json')}
            hasApiKey={!!state.apiKey.value}
            onOpenApiKeyModal={() => {
              setIsGeminiKeyRequired(false)
              dispatch({ type: 'SHOW_API_KEY_MODAL' })
            }}
            onClearApiKey={() => dispatch({ type: 'CLEAR_API_KEY' })}
            finalAdjustments={optimizer.state.finalAdjustments}
            onFinalAdjustmentsChange={optimizer.actions.setFinalAdjustments}
            onApplyAdjustments={optimizer.actions.applyIntermediateAdjustments}
            isAdjusting={optimizer.state.isAdjusting}
            adjustmentError={optimizer.state.adjustmentError}
            adjustmentSuccess={optimizer.state.adjustmentSuccess}
          />
        )

      case 'results':
        return (
          <ResultsView
            resumeData={optimizer.state.optimizedResumeData}
            originalResume={optimizer.state.originalResume}
            diffItems={state.optimization.diffItems}
            onDownloadPDF={() => window.print()}
            onExportJSON={() => io.actions.downloadJSONFile(state.resume.optimizedJson || '', 'optimized-resume.json')}
            onTryAnotherJob={() => {
              dispatch({ type: 'RESET_OPTIMIZATION' })
              dispatch({ type: 'SET_STEP', step: 'job' })
            }}
            finalAdjustments={optimizer.state.finalAdjustments}
            onFinalAdjustmentsChange={optimizer.actions.setFinalAdjustments}
            onApplyAdjustments={optimizer.actions.applyFinalAdjustments}
            isAdjusting={optimizer.state.isAdjusting}
            adjustmentError={optimizer.state.adjustmentError}
            adjustmentSuccess={optimizer.state.adjustmentSuccess}
            onClearAdjustments={() => {
              optimizer.actions.setFinalAdjustments('')
              // Clear success/error states if exposed
            }}
            renderDiffValue={optimizer.actions.renderDiffValue}
            formatDiffPath={optimizer.actions.formatDiffPath}
            summaryMetrics={[
              {
                id: 'improvements',
                value: state.metadata?.improvementsCount?.toString() || '0',
                label: 'Improvements'
              },
              {
                id: 'keywords',
                value: state.metadata?.keywordsMatched?.length.toString() || '0',
                label: 'Keywords Matched'
              }
            ]}
            jobDescription={state.jobDescription.text}
          />
        )

      default:
        return null
    }
  }

  return (
    <>
      {/* Toasts */}
      {state.toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          {state.toasts.map((toast) => (
            <div
              key={toast.id}
              className={`inline-flex items-center gap-3 rounded-2xl px-5 py-3 shadow-xl border pointer-events-auto ${toast.tone === 'success'
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
          ))}
        </div>
      )}

      {/* Modals */}
      <GeminiKeyModal
        isOpen={state.ui.isApiKeyModalOpen}
        onClose={closeGeminiKeyModal}
        geminiKeyInput={geminiKeyInput}
        onInputChange={setGeminiKeyInput}
        onSave={handleGeminiModalSave}
        geminiKeyHelpUrl="https://aistudio.google.com/app/apikey"
        requireKey={isGeminiKeyRequired}
      />

      <DemoVideoModal
        isOpen={state.ui.activeVideoId === DEMO_VIDEO_ID}
        onClose={() => dispatch({ type: 'SET_ACTIVE_VIDEO', videoId: null })}
        videoUrl="https://www.youtube.com/embed/dQw4w9WgXcQ"
      />

      <PromptSettingsModal
        isOpen={showPromptSettings}
        onClose={() => setShowPromptSettings(false)}
        systemPrompt={optimizer.state.systemPrompt}
        setSystemPrompt={optimizer.actions.setSystemPrompt}
        adjustmentPrompt={optimizer.state.adjustmentPrompt}
        setAdjustmentPrompt={optimizer.actions.setAdjustmentPrompt}
        conversionPrompt={io.state.conversionPrompt}
        setConversionPrompt={io.actions.setConversionPrompt}
      />

      {/* Main Content */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/70 to-indigo-50/50">
        <div className="print:hidden">
          {renderContent()}
        </div>
      </div>

      {/* Processing Modal for Optimization */}
      <ProcessingModal
        isOpen={state.uiStep === 'optimizing' || state.ui.isLoading}
        title="Optimizing your resume..."
        message="We're tailoring your resume to the job description. This usually takes a few seconds, but can take up to 3 minutes."
        loaderText="Optimizing"
      />

      {/* API Key Badge - Hidden as per request */}
      {/* {state.uiStep !== 'landing' && (
        <div className="print:hidden">
          <div
            className={`fixed top-4 z-50 max-sm:w-[calc(100%-2rem)] ${state.ui.isApiKeyModalOpen
              ? 'left-4 right-auto max-sm:left-4 max-sm:translate-x-0'
              : 'left-1/2 -translate-x-1/2'
              }`}
          >
            <APIKeyStatusBadge
              status={
                state.apiKey.status === 'error'
                  ? 'error'
                  : state.apiKey.value
                    ? 'ready'
                    : 'missing'
              }
              onClick={() => dispatch({ type: 'SHOW_API_KEY_MODAL' })}
              message={
                state.apiKey.status === 'error'
                  ? state.apiKey.errorMessage ?? undefined
                  : state.apiKey.value
                    ? undefined
                    : undefined
              }
            />
          </div>
        </div>
      )} */}
    </>
  )
}

const ResumeGeneratorPage = () => (
  <OptimizerProvider>
    <ResumeGeneratorContent />
  </OptimizerProvider>
)

export default ResumeGeneratorPage
