import { useMemo } from 'react'
import { ResumeData, normalizeResumeJSON, isValidResumeData } from '@/lib/resume-types'
import { useOptimizerContext } from '@/src/state/optimizer-context'

export const useOptimizedResume = (): ResumeData | null => {
  const {
    state: { resume }
  } = useOptimizerContext()

  return useMemo(() => {
    if (!resume.optimizedJson) return null

    try {
      const parsed = normalizeResumeJSON(JSON.parse(resume.optimizedJson))
      return isValidResumeData(parsed) ? (parsed as ResumeData) : null
    } catch (error) {
      console.error('Failed to parse optimized resume JSON from context:', error)
      return null
    }
  }, [resume.optimizedJson])
}

export const useWorkspaceResume = (): ResumeData | null => {
  const {
    state: { resume }
  } = useOptimizerContext()

  return useMemo(() => {
    if (!resume.workspaceJson) return null

    try {
      const parsed = normalizeResumeJSON(JSON.parse(resume.workspaceJson))
      return isValidResumeData(parsed) ? (parsed as ResumeData) : null
    } catch (error) {
      console.error('Failed to parse workspace resume JSON from context:', error)
      return null
    }
  }, [resume.workspaceJson])
}

export const useOptimizationMetadata = () => {
  const {
    state: { metadata }
  } = useOptimizerContext()

  return metadata
}
