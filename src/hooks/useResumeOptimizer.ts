import { useCallback, useState } from 'react'
import { useOptimizerContext, OptimizationMetadata, DiffItem } from '@/src/state/optimizer-context'
import { ResumeData, validateResumeJSON, cloneResumeData } from '@/lib/resume-types'
import { useOptimizedResume, useWorkspaceResume } from '@/src/hooks'
import { storage } from '@/lib/local-storage'

// Helper to calculate diffs (moved from page.tsx)
// We might want to move this to a separate utility file later
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
        const maxLen = Math.max(before.length, after.length)
        for (let i = 0; i < maxLen; i++) {
            const beforeItem = before[i]
            const afterItem = after[i]
            const elementPath = [...path, `[${i}]`]

            if (isPlainObject(beforeItem) && isPlainObject(afterItem)) {
                // If both are objects (e.g. experience items), recurse
                const beforeRecord = beforeItem as Record<string, unknown>
                const afterRecord = afterItem as Record<string, unknown>
                const keys = new Set([...Object.keys(beforeRecord), ...Object.keys(afterRecord)])
                keys.forEach((key) => {
                    collectDiffs(beforeRecord[key], afterRecord[key], [...elementPath, key], diffs)
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
                : diff.length

    const wordCount = typeof meta.wordCount === 'number' ? meta.wordCount : undefined

    const keywordsMatched = Array.isArray(meta.keywordsMatched)
        ? (meta.keywordsMatched as string[])
        : undefined

    const processingTimeSeconds =
        typeof meta.processingTimeSeconds === 'number' ? meta.processingTimeSeconds : undefined

    const changes = Array.isArray(meta.changes)
        ? (meta.changes as Record<string, unknown>[]).map((change) => {
            return {
                type: typeof change.type === 'string' ? change.type : 'update',
                section: typeof change.section === 'string' ? change.section : 'unknown',
                description: typeof change.description === 'string' ? change.description : undefined,
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

export const useResumeOptimizer = () => {
    const { state, dispatch } = useOptimizerContext()

    const resumeForWorkspace = useWorkspaceResume()
    const optimizedResumeData = useOptimizedResume()

    // Local state for adjustments (UI state)
    const [finalAdjustments, setFinalAdjustments] = useState('')
    const [isAdjusting, setIsAdjusting] = useState(false)
    const [adjustmentError, setAdjustmentError] = useState<string | null>(null)
    const [adjustmentSuccess, setAdjustmentSuccess] = useState(false)
    const [originalResume, setOriginalResume] = useState<ResumeData | null>(null)

    // Prompts state (could be moved to context if needed globally, but local is fine for now)
    const [systemPrompt, setSystemPrompt] = useState('')
    const [adjustmentPrompt, setAdjustmentPrompt] = useState('')

    const optimizeResume = useCallback(async () => {
        const currentResume = resumeForWorkspace
        const jobDescription = state.jobDescription.text
        const apiKey = state.apiKey.value

        if (!currentResume || !jobDescription.trim()) return

        if (!apiKey) {
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

            // Capture baseline if not already set
            if (!originalResume) {
                setOriginalResume(cloneResumeData(currentResume))
            }

            const response = await fetch('/api/optimize-resume', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-gemini-api-key': apiKey
                },
                body: JSON.stringify({
                    resumeData: currentResume,
                    jobDescription,
                    promptOverrides: {
                        systemPrompt: systemPrompt || undefined
                    }
                })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || 'Optimization request failed')
            }

            const result = await response.json()
            const normalizedOptimized = result.optimizedResume

            // Calculate diffs
            const diff = buildResumeDiff(currentResume, normalizedOptimized)
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

            // Save optimized state to history
            const sourceId = state.resume.loadedSource.id
            if (sourceId) {
                storage.saveResume(sourceId, currentResume, undefined, normalizedOptimized)
            }

        } catch (error) {
            console.error('Optimization error:', error)
            dispatch({
                type: 'OPTIMIZE_FAILURE',
                errorMessage: error instanceof Error ? error.message : 'Optimization failed'
            })
        }
    }, [resumeForWorkspace, state.jobDescription.text, state.apiKey.value, dispatch, originalResume, systemPrompt, state.resume.loadedSource.id])

    const applyFinalAdjustments = useCallback(async () => {
        const currentResume = resumeForWorkspace
        const apiKey = state.apiKey.value

        if (!currentResume || !finalAdjustments.trim()) return
        if (!apiKey) {
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
                    'x-gemini-api-key': apiKey
                },
                body: JSON.stringify({
                    resumeData: currentResume,
                    adjustmentInstructions: finalAdjustments,
                    promptOverrides: {
                        systemPrompt: adjustmentPrompt || undefined
                    }
                })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || 'Adjustment request failed')
            }

            const result = await response.json()
            const normalizedAdjusted = result.adjustedResume

            // Calculate diffs against the ORIGINAL baseline (not just the previous step)
            // This ensures the "Changes" view shows cumulative edits
            const diff = buildResumeDiff(baselineResume, normalizedAdjusted)
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

            // Save optimized state to history
            const sourceId = state.resume.loadedSource.id
            if (sourceId) {
                storage.saveResume(sourceId, currentResume, undefined, normalizedAdjusted)
            }

            // Set success state
            setAdjustmentSuccess(true)

        } catch (error) {
            console.error('Adjustment error:', error)
            setAdjustmentError(error instanceof Error ? error.message : 'Adjustment failed')
            setAdjustmentSuccess(false)
        } finally {
            setIsAdjusting(false)
        }
    }, [resumeForWorkspace, finalAdjustments, state.apiKey.value, originalResume, adjustmentPrompt, dispatch, state.resume.loadedSource.id])

    const applyIntermediateAdjustments = useCallback(async () => {
        const currentResume = resumeForWorkspace
        const apiKey = state.apiKey.value

        if (!currentResume || !finalAdjustments.trim()) return
        if (!apiKey) {
            setAdjustmentError('Add your API key to apply adjustments.')
            return
        }

        try {
            setIsAdjusting(true)
            setAdjustmentError(null)
            setAdjustmentSuccess(false)

            const response = await fetch('/api/adjust-resume', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-gemini-api-key': apiKey
                },
                body: JSON.stringify({
                    resumeData: currentResume,
                    adjustmentInstructions: finalAdjustments,
                    model: 'gemini-2.5-flash-lite', // Use faster model for intermediate edits
                    promptOverrides: {
                        systemPrompt: adjustmentPrompt || undefined
                    }
                })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || 'Adjustment request failed')
            }

            const result = await response.json()
            const normalizedAdjusted = result.adjustedResume

            // Update workspace resume directly without navigating
            dispatch({ type: 'SET_WORKSPACE_RESUME', json: JSON.stringify(normalizedAdjusted) })

            // Clear adjustments input on success
            setFinalAdjustments('')
            setAdjustmentSuccess(true)

        } catch (error) {
            console.error('Intermediate adjustment error:', error)
            setAdjustmentError(error instanceof Error ? error.message : 'Adjustment failed')
            setAdjustmentSuccess(false)
        } finally {
            setIsAdjusting(false)
        }
    }, [resumeForWorkspace, finalAdjustments, state.apiKey.value, adjustmentPrompt, dispatch])

    const revertToOriginal = useCallback(() => {
        if (originalResume) {
            dispatch({ type: 'SET_WORKSPACE_RESUME', json: JSON.stringify(originalResume) })
            // We don't clear originalResume here so they can toggle back/forth if we implemented that
            // But for "Revert", we usually want to reset the diffs too?
            // For now, let's just restore the content.
        }
    }, [originalResume, dispatch])

    return {
        state: {
            resumeForWorkspace,
            optimizedResumeData,
            finalAdjustments,
            isAdjusting,
            adjustmentError,
            adjustmentSuccess,
            originalResume,
            systemPrompt,
            adjustmentPrompt
        },
        actions: {
            setFinalAdjustments,
            setSystemPrompt,
            setAdjustmentPrompt,
            setOriginalResume,
            optimizeResume,
            applyFinalAdjustments,
            applyIntermediateAdjustments,
            revertToOriginal,
            // Expose diff helpers if needed by UI
            renderDiffValue: toDisplayString,
            formatDiffPath: (path: string[]) => path.join(' › ') // Simplified for now
        }
    }
}
