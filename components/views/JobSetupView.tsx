import React from 'react'
import WorkspaceActions from '@/components/WorkspaceActions'
import ResumePreview from '@/components/ResumePreview'
import { ResumeData } from '@/lib/resume-types'
import { Download, History } from 'lucide-react'
import SavedResumesDrawer from '@/components/SavedResumesDrawer'

interface JobSetupViewProps {
    resumeData: ResumeData | null
    jobDescription: string
    onJobDescriptionChange: (text: string) => void
    onOptimize: () => void
    onDownloadPDF: () => void
    onExportJSON: () => void
    // API Key / Auth props
    hasApiKey: boolean
    onOpenApiKeyModal: () => void
    onClearApiKey: () => void
    // Adjustments
    finalAdjustments: string
    onFinalAdjustmentsChange: (value: string) => void
    onApplyAdjustments: () => void
    isAdjusting: boolean
    adjustmentError: string | null
    adjustmentSuccess: boolean
}

const JobSetupView: React.FC<JobSetupViewProps> = ({
    resumeData,
    onOptimize,
    onDownloadPDF,
    onExportJSON,
    finalAdjustments,
    onFinalAdjustmentsChange,
    onApplyAdjustments,
    isAdjusting,
    adjustmentError,
    adjustmentSuccess
}) => {
    const [showHistory, setShowHistory] = React.useState(false)

    return (
        <div className="mx-auto w-full max-w-5xl space-y-8 px-6 py-14">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Optimize Resume</h1>
                    <p className="mt-1 text-sm text-slate-500">Tailor your resume to the job description.</p>
                </div>
                <button
                    onClick={() => setShowHistory(true)}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 shadow-sm"
                >
                    <History size={18} />
                    <span>History</span>
                </button>
            </div>

            <WorkspaceActions
                resumeData={resumeData}
                optimizeResume={onOptimize}
                finalAdjustments={finalAdjustments}
                onFinalAdjustmentsChange={onFinalAdjustmentsChange}
                applyFinalAdjustments={onApplyAdjustments}
                isAdjusting={isAdjusting}
                adjustmentError={adjustmentError}
                adjustmentSuccess={adjustmentSuccess}
                originalResume={null}
                revertToOriginal={() => { }}
                maxDiffItems={0}
                renderDiffValue={() => null}
                formatDiffPath={() => ''}
            />



            {resumeData && (
                <section className="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-sm shadow-slate-200/40">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Current resume snapshot</h2>
                            <p className="mt-1 text-sm text-slate-600">
                                We’ll tailor this version when you run optimization.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={onDownloadPDF}
                                className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
                            >
                                <Download size={16} /> PDF
                            </button>
                            <button
                                type="button"
                                onClick={onExportJSON}
                                className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
                            >
                                <Download size={16} /> JSON
                            </button>
                        </div>
                    </div>
                    <div className="mt-4 overflow-hidden rounded-[24px] border border-slate-200/70 bg-white shadow-inner">
                        <ResumePreview resumeData={resumeData} />
                    </div>
                </section>
            )}

            <SavedResumesDrawer isOpen={showHistory} onClose={() => setShowHistory(false)} />
        </div>
    )
}

export default JobSetupView
