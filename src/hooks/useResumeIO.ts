import { useState, useCallback } from 'react'
import { useOptimizerContext } from '@/src/state/optimizer-context'
import { normalizeResumeJSON, validateResumeJSON, ResumeData } from '@/lib/resume-types'
import { storage } from '@/lib/local-storage'
import { DocxGenerator } from '@/lib/docx-generator'
import { saveAs } from 'file-saver'

export const useResumeIO = () => {
    const { state, dispatch } = useOptimizerContext()

    // Paste JSON state
    const [pastedJSON, setPastedJSON] = useState<string>('')
    const [isJSONValid, setIsJSONValid] = useState<boolean | null>(null)
    const [jsonErrors, setJsonErrors] = useState<string[]>([])

    // Text conversion state
    const [isConvertingText, setIsConvertingText] = useState(false)
    const [textConversionError, setTextConversionError] = useState<string | null>(null)
    const [pendingConversion, setPendingConversion] = useState(false)
    const [conversionPrompt, setConversionPrompt] = useState('')

    const handleJSONPaste = useCallback((value: string) => {
        // exitDemoMode() - handled by caller or effect?
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
    }, [])

    const loadCustomResume = useCallback(() => {
        if (!isJSONValid || !pastedJSON) return false

        try {
            const parsed = normalizeResumeJSON(JSON.parse(pastedJSON))
            const validation = validateResumeJSON(parsed)
            if (!validation.isValid) {
                setIsJSONValid(false)
                setJsonErrors(validation.errors)
                return false
            }

            dispatch({ type: 'SET_WORKSPACE_RESUME', json: JSON.stringify(parsed) })
            dispatch({ type: 'SET_LOADED_SOURCE', source: { type: 'custom', id: 'pasted-json' } })
            dispatch({ type: 'RESET_OPTIMIZATION' })

            storage.saveResume('custom', parsed)
            return true
        } catch (error) {
            console.error('Error loading custom resume:', error)
            return false
        }
    }, [isJSONValid, pastedJSON, dispatch])

    const [isUploadingJSON, setIsUploadingJSON] = useState(false)

    const handleJSONFileDrop = useCallback((file: File, onComplete?: (success: boolean) => void) => {
        setIsUploadingJSON(true)
        const reader = new FileReader()
        reader.onload = () => {
            const text = reader.result
            if (typeof text !== 'string') {
                setIsJSONValid(false)
                setJsonErrors(['Unable to read the file. Please try again or paste the JSON manually.'])
                setIsUploadingJSON(false)
                onComplete?.(false)
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
                    storage.saveResume('custom', parsed)
                    dispatch({ type: 'RESET_OPTIMIZATION' })
                    onComplete?.(true)
                } else {
                    onComplete?.(false)
                }
            } catch (error) {
                console.error('Failed to parse uploaded JSON:', error)
                setIsJSONValid(false)
                setJsonErrors(['Invalid JSON file. Double-check the contents or paste it manually.'])
                onComplete?.(false)
            } finally {
                setIsUploadingJSON(false)
            }
        }

        reader.onerror = () => {
            console.error('Failed to read file')
            setIsJSONValid(false)
            setJsonErrors(['Unable to read the file. Please try again or paste the JSON manually.'])
            setIsUploadingJSON(false)
            onComplete?.(false)
        }

        reader.readAsText(file)
    }, [dispatch])

    const convertTextToResume = useCallback(async (text: string, apiKeyOverride?: string) => {
        console.log('convertTextToResume called with text length:', text?.length)
        if (!text || !text.trim()) {
            setTextConversionError('Please enter your resume text first.')
            return false
        }

        // Check for API key
        const apiKey = apiKeyOverride || state.apiKey.value
        console.log('API Key present:', !!apiKey)

        if (!apiKey) {
            setPendingConversion(true)
            // Don't set error here, just return missing_key to trigger modal
            setTextConversionError(null)
            return 'missing_key'
        }

        try {
            setPendingConversion(false)
            setIsConvertingText(true)
            setTextConversionError(null)

            const response = await fetch('/api/convert-resume', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-gemini-api-key': apiKey
                },
                body: JSON.stringify({
                    resumeText: text,
                    systemPrompt: conversionPrompt || undefined
                })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || 'Conversion failed')
            }

            const result = await response.json()
            const serialized = JSON.stringify(result.resume, null, 2)

            setPastedJSON(serialized)
            setIsJSONValid(true)
            setJsonErrors([])

            dispatch({ type: 'SET_WORKSPACE_RESUME', json: serialized })
            dispatch({ type: 'SET_LOADED_SOURCE', source: { type: 'custom', id: 'text-conversion' } })
            dispatch({ type: 'RESET_OPTIMIZATION' })

            storage.saveResume('custom', result.resume)
            return true

        } catch (error) {
            console.error('Text conversion error:', error)
            const errorMessage = error instanceof Error ? error.message : 'Unable to convert resume text.'

            // Provide more helpful message for validation errors
            if (errorMessage.includes('invalid') || errorMessage.includes('validation') || errorMessage.includes('JSON')) {
                setTextConversionError('Something seems off with your resume. Please make sure that you include all your experience and that it\'s a valid resume format.')
            } else {
                setTextConversionError(errorMessage)
            }
            return false
        } finally {
            setIsConvertingText(false)
        }
    }, [state.apiKey.value, conversionPrompt, dispatch])

    const downloadJSONFile = useCallback((jsonString: string, filename: string) => {
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
    }, [])

    const exportToDocx = useCallback(async (data: ResumeData, filename: string) => {
        try {
            const generator = new DocxGenerator(data)
            const blob = await generator.generate()
            saveAs(blob, filename)
        } catch (error) {
            console.error('Failed to export DOCX:', error)
            // You might want to set an error state here if you want to show it in the UI
        }
    }, [])

    return {
        state: {
            pastedJSON,
            isJSONValid,
            jsonErrors,
            isConvertingText,
            textConversionError,
            pendingConversion,
            conversionPrompt,
            isUploadingJSON
        },
        actions: {
            setPastedJSON,
            setConversionPrompt,
            setPendingConversion,
            handleJSONPaste,
            loadCustomResume,
            handleJSONFileDrop,
            convertTextToResume,
            downloadJSONFile,
            exportToDocx
        }
    }
}
