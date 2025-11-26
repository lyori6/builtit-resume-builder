'use client'

import React, { useState } from 'react'
import { FileText, Copy, Check, Download, Wand2, AlertCircle } from 'lucide-react'
import { ResumeData } from '@/lib/resume-types'
import { generateCoverLetter } from '@/app/actions'
import ContentModal from './ContentModal'
import { useOptimizerContext } from '@/src/state/optimizer-context'
import { useResumeOptimizer } from '@/src/hooks/useResumeOptimizer'
import { saveAs } from 'file-saver'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import QuantumPulseLoader from '@/components/ui/QuantumPulseLoader'
import { pdf } from '@react-pdf/renderer'
import CoverLetterPdf from './CoverLetterPdf'

interface CoverLetterGeneratorProps {
    resumeData: ResumeData
    jobDescription: string
}

const CoverLetterGenerator: React.FC<CoverLetterGeneratorProps> = ({
    resumeData,
    jobDescription
}) => {
    const { state, dispatch } = useOptimizerContext()
    const { actions } = useResumeOptimizer() // Use the hook to access actions
    const [isGenerating, setIsGenerating] = useState(false)
    // Initialize with saved cover letter if available
    const [coverLetter, setCoverLetter] = useState(state.resume.coverLetter || '')
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    // Update local state when global state changes (e.g. when loading a resume)
    React.useEffect(() => {
        if (state.resume.coverLetter) {
            setCoverLetter(state.resume.coverLetter)
        }
    }, [state.resume.coverLetter])

    const handleGenerate = async () => {
        setIsGenerating(true)
        setError(null)
        dispatch({ type: 'SET_COVER_LETTER_MODAL_OPEN', isOpen: true })

        try {
            // Add a minimum delay to show the loading animation (5 seconds to ensure full text animation)
            const minDelay = new Promise(resolve => setTimeout(resolve, 5000))

            const [result] = await Promise.all([
                generateCoverLetter(
                    resumeData,
                    jobDescription,
                    state.apiKey.value || undefined
                ),
                minDelay
            ])

            if (result.success && result.coverLetter) {
                setCoverLetter(result.coverLetter)
                actions.saveCoverLetter(result.coverLetter) // Save to history
            } else {
                setError(result.error || 'Failed to generate cover letter')
            }
        } catch (err) {
            setError('An unexpected error occurred')
            console.error(err)
        } finally {
            setIsGenerating(false)
        }
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(coverLetter)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const getFilename = (extension: string) => {
        const name = resumeData.basics.name || 'Candidate'
        const sanitized = name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
        return `${sanitized}-cover-letter.${extension}`
    }

    const handleDownloadDocx = async () => {
        const doc = new Document({
            sections: [
                {
                    properties: {},
                    children: coverLetter.split('\n').map((line) => new Paragraph({
                        children: [new TextRun(line)],
                        spacing: { after: 200 }
                    })),
                },
            ],
        })

        const blob = await Packer.toBlob(doc)
        saveAs(blob, getFilename('docx'))
    }

    const handleDownloadPDF = async () => {
        try {
            const blob = await pdf(<CoverLetterPdf coverLetter={coverLetter} />).toBlob()
            saveAs(blob, getFilename('pdf'))
        } catch (e) {
            console.error('Error generating PDF:', e)
            setError('Failed to generate PDF')
        }
    }

    return (
        <>
            <button
                onClick={handleGenerate}
                className="group flex w-full items-center justify-between rounded-xl border border-purple-100 bg-purple-50 p-4 transition-all hover:border-purple-200 hover:bg-purple-100 hover:shadow-sm"
            >
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-200 text-purple-700">
                        <Wand2 size={16} />
                    </div>
                    <span className="font-semibold text-purple-900">
                        Generate Cover Letter
                    </span>
                </div>
            </button>

            <ContentModal
                isOpen={state.ui.isCoverLetterModalOpen}
                onClose={() => dispatch({ type: 'SET_COVER_LETTER_MODAL_OPEN', isOpen: false })}
                title="Cover Letter"
            >
                <div className="flex flex-col h-[70vh]">
                    {isGenerating ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-4">
                            <QuantumPulseLoader text="Generating" />
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-4">
                            <p className="text-red-600 font-medium">{error}</p>
                            <button
                                onClick={handleGenerate}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : (
                        <>
                            {!jobDescription && (
                                <div className="mb-4 p-3 bg-yellow-50 text-yellow-800 text-sm rounded-lg border border-yellow-200 flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    <span>No job description provided. The cover letter will be generic.</span>
                                </div>
                            )}
                            <textarea
                                value={coverLetter}
                                onChange={(e) => setCoverLetter(e.target.value)}
                                className="flex-1 w-full p-6 border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-serif text-slate-800 leading-relaxed text-base"
                                placeholder="Your cover letter will appear here..."
                            />
                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
                                >
                                    {copied ? <Check size={18} /> : <Copy size={18} />}
                                    {copied ? 'Copied!' : 'Copy Text'}
                                </button>
                                <button
                                    onClick={handleDownloadDocx}
                                    className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                                >
                                    <FileText size={18} />
                                    Download DOCX
                                </button>
                                <button
                                    onClick={handleDownloadPDF}
                                    className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                                >
                                    <Download size={18} />
                                    Download PDF
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </ContentModal>
        </>
    )
}

export default CoverLetterGenerator
