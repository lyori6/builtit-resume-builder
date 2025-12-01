import { useEffect, useRef } from 'react'
import { storage } from '@/lib/local-storage'
import { OptimizerState, OptimizerAction } from '@/src/state/optimizer-context'

const isBrowser = () => typeof window !== 'undefined'

const parseMetadata = (raw: string | undefined) => {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch (error) {
    console.warn('Failed to parse stored optimization metadata:', error)
    return null
  }
}

export const useOptimizerStorageSync = (
  state: OptimizerState,
  dispatch: React.Dispatch<OptimizerAction>
) => {
  const hasHydrated = useRef(false)

  useEffect(() => {
    if (!isBrowser()) return

    const stored = storage.read()

    const hydratedApiKey = stored.geminiApiKey ?? null
    const maskedApiKey = hydratedApiKey ? `${hydratedApiKey.slice(0, 8)}…${hydratedApiKey.slice(-4)}` : null

    dispatch({
      type: 'HYDRATE_STATE',
      state: {
        resume: {
          originalText: stored.resumeState?.originalText ?? '',
          optimizedText: stored.resumeState?.optimizedText ?? '',
          originalJson: stored.resumeState?.originalJson ?? null,
          optimizedJson: stored.resumeState?.optimizedJson ?? null,
          workspaceJson: stored.resumeState?.workspaceJson ?? null,
          coverLetter: null,
          loadedSource: stored.resumeState?.loadedSource ?? { type: 'none', id: null }
        },
        jobDescription: {
          text: stored.jobState?.text ?? '',
          lastUpdated: stored.jobState?.lastUpdated ?? null
        },
        apiKey: {
          value: hydratedApiKey,
          maskedValue: maskedApiKey,
          status: hydratedApiKey ? 'saved' : 'idle',
          errorMessage: null
        },
        metadata: parseMetadata(stored.optimizationMetadata) ?? null
      }
    })

    hasHydrated.current = true
  }, [dispatch])

  useEffect(() => {
    if (!hasHydrated.current || !isBrowser()) return

    const { resume, jobDescription, apiKey, metadata } = state

    if (apiKey.value) {
      storage.saveGeminiApiKey(apiKey.value)
    } else {
      storage.removeGeminiApiKey()
    }

    storage.saveResumeState({
      originalText: resume.originalText || undefined,
      optimizedText: resume.optimizedText || undefined,
      originalJson: resume.originalJson || undefined,
      optimizedJson: resume.optimizedJson || undefined,
      workspaceJson: resume.workspaceJson || undefined,
      loadedSource: resume.loadedSource
    })

    storage.saveJobState({
      text: jobDescription.text || undefined,
      lastUpdated: jobDescription.lastUpdated || undefined
    })

    storage.saveOptimizationMetadata(metadata ? JSON.stringify(metadata) : null)
  }, [state])
}
