'use client'

import { FC, useEffect, useRef } from 'react'
import { Printer } from 'lucide-react'
import { ResumeData } from '@/lib/resume-types'
import ResumePreview from './ResumePreview'

interface PrintPreviewModalProps {
    isOpen: boolean
    onClose: () => void
    resumeData: ResumeData | null
}

const PrintPreviewModal: FC<PrintPreviewModalProps> = ({
    isOpen,
    onClose,
    resumeData
}) => {
    const modalRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }

        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
            document.body.style.overflow = 'hidden'
        }

        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = 'unset'
        }
    }, [isOpen, onClose])

    const handlePrint = () => {
        window.print()
    }

    if (!isOpen || !resumeData) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6 print:p-0 print:bg-white print:static">
            <div
                ref={modalRef}
                className="relative flex flex-col w-full max-w-5xl max-h-[90vh] bg-slate-100 rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:max-h-none print:max-w-none print:w-full print:h-full print:rounded-none print:bg-white"
            >
                {/* Header - Hidden when printing */}
                <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 print:hidden">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Print Preview</h2>
                        <p className="text-sm text-slate-500">Check layout before saving as PDF</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                        >
                            <Printer size={16} />
                            Print / Save PDF
                        </button>
                    </div>
                </div>

                {/* Preview Area */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 print:p-0 print:overflow-visible">
                    <div className="max-w-[210mm] mx-auto bg-white shadow-lg print:shadow-none print:max-w-none print:mx-0">
                        <ResumePreview resumeData={resumeData} />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PrintPreviewModal
