import React, { useState } from 'react'
import { Download, Loader2, FileText, Wand2, ArrowLeft, History, LayoutTemplate } from 'lucide-react'
import { ResumeData } from '@/lib/resume-types'
import { DiffItem } from '@/src/state/optimizer-context'
import ResumePreview from '@/components/ResumePreview'
import ResumeDiffTable from '@/components/ResumeDiffTable'
import { useTheme } from '@/src/state/theme-context'

import { useOptimizerContext } from '@/src/state/optimizer-context'
import { useResumeIO } from '@/src/hooks/useResumeIO'
import SavedResumesDrawer from '@/components/SavedResumesDrawer'
import ContentModal from '@/components/ContentModal'
import { downloadResumePDF } from '@/lib/pdf-generator'
import CoverLetterGenerator from '@/components/CoverLetterGenerator'

interface ResultsViewProps {
    resumeData: ResumeData | null
    originalResume: ResumeData | null
    diffItems: DiffItem[]
    // Adjustments
    finalAdjustments: string
    onFinalAdjustmentsChange: (value: string) => void
    onApplyAdjustments: () => void
    isAdjusting: boolean
    adjustmentError: string | null
    adjustmentSuccess: boolean
    onClearAdjustments: () => void
    // Diff helpers
    renderDiffValue: (value: unknown) => React.ReactNode
    formatDiffPath: (path: string[]) => string
    // Metrics
    summaryMetrics: Array<{ id: string; value: string; label: string }>
    // Job Description
    jobDescription: string
}

const MAX_DIFF_ITEMS = 50

const ResultsView: React.FC<ResultsViewProps> = ({
    resumeData,
    originalResume,
    diffItems,
    finalAdjustments,
    onFinalAdjustmentsChange,
    onApplyAdjustments,
    isAdjusting,
    adjustmentError,
    adjustmentSuccess,
    onClearAdjustments,
    renderDiffValue,
    formatDiffPath,
    summaryMetrics,
    jobDescription
}) => {
    const { state, dispatch } = useOptimizerContext()
    const { actions: { downloadJSONFile, exportToDocx } } = useResumeIO()
    const { currentTheme, setTheme, availableThemes } = useTheme()
    const [showJobDetails, setShowJobDetails] = useState(false)
    const [showDiffs, setShowDiffs] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const [previewMode, setPreviewMode] = useState<'after' | 'before'>('after')

    const handleDownloadPDF = async () => {
        await downloadResumePDF('resume-preview-panel', 'optimized-resume.pdf')
    }

    const renderHeader = () => (
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md print:hidden">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            if (state.ui.isDemoMode) {
                                dispatch({ type: 'RESET_STATE' })
                                dispatch({ type: 'SET_STEP', step: 'landing' })
                            } else {
                                dispatch({ type: 'SET_STEP', step: 'job' })
                            }
                        }}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                        <ArrowLeft size={18} />
                        Back
                    </button>
                </div>

                {/* Demo Mode Indicator */}
                {state.ui.isDemoMode && (
                    <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 transform items-center gap-3 rounded-full bg-blue-50 px-4 py-2 ring-1 ring-blue-200">
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500"></span>
                            </span>
                            <span className="text-sm font-semibold text-blue-700">Demo Mode</span>
                        </div>
                        <div className="h-4 w-px bg-blue-200"></div>
                        <button
                            onClick={() => {
                                dispatch({ type: 'RESET_STATE' })
                                dispatch({ type: 'SET_STEP', step: 'landing' })
                            }}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                            Start your own resume &rarr;
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowHistory(true)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                        <History size={18} />
                        <span className="hidden sm:inline">History</span>
                    </button>
                    <div className="h-6 w-px bg-slate-200" />
                    <button
                        onClick={() => downloadJSONFile(state.resume.optimizedJson || '{}', 'optimized-resume.json')}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                        <Download size={18} />
                        <span className="hidden sm:inline">JSON</span>
                    </button>
                    <button
                        onClick={() => exportToDocx(state.resume.optimizedJson ? JSON.parse(state.resume.optimizedJson) : {}, 'optimized-resume.docx')}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                        <FileText size={18} />
                        <span className="hidden sm:inline">Word</span>
                    </button>
                    <button
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md active:scale-95"
                    >
                        <Download size={18} />
                        <span>Download PDF</span>
                    </button>
                </div>
            </div>
        </header>
    )

    const renderSidebar = () => (
        <aside className="w-full space-y-6 lg:w-80 lg:shrink-0">
            {/* Metrics Card */}
            {summaryMetrics.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-sm font-semibold text-slate-900">Optimization Score</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {summaryMetrics.map((metric) => (
                            <div key={metric.id} className="rounded-xl bg-blue-50 p-3 text-center">
                                <div className="text-2xl font-bold text-blue-600">{metric.value}</div>
                                <div className="text-[10px] font-medium uppercase tracking-wider text-blue-600/80">{metric.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Adjustments Card */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                {state.ui.isDemoMode && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px]">
                        <div className="rounded-xl bg-white p-4 text-center shadow-lg ring-1 ring-slate-200">
                            <p className="text-sm font-semibold text-slate-900">AI Adjustments</p>
                            <p className="mt-1 text-xs text-slate-500">Available in full version</p>
                        </div>
                    </div>
                )}

                <div className="mb-4 flex items-center gap-2">
                    <Wand2 size={16} className="text-purple-500" />
                    <h3 className="text-sm font-semibold text-slate-900">AI Adjustments</h3>
                </div>

                <div className="space-y-3">
                    <textarea
                        value={finalAdjustments}
                        onChange={(e) => onFinalAdjustmentsChange(e.target.value)}
                        placeholder="Ask for specific changes (e.g., 'Make the summary more punchy', 'Emphasize my React skills')..."
                        className="min-h-[100px] w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed"
                    />

                    {adjustmentError && (
                        <p className="text-xs font-medium text-red-600">{adjustmentError}</p>
                    )}
                    {adjustmentSuccess && (
                        <p className="text-xs font-medium text-green-600">Adjustments applied successfully!</p>
                    )}

                    <div className="flex gap-2">
                        <button
                            onClick={onApplyAdjustments}
                            disabled={isAdjusting || !finalAdjustments.trim()}
                            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700 disabled:opacity-50"
                        >
                            {isAdjusting ? <Loader2 size={16} className="animate-spin" /> : 'Apply'}
                        </button>
                        <button
                            onClick={onClearAdjustments}
                            disabled={!finalAdjustments}
                            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
                        >
                            Clear
                        </button>
                    </div>

                    {resumeData && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <CoverLetterGenerator resumeData={resumeData} jobDescription={jobDescription || ''} />
                        </div>
                    )}
                </div>
            </div>

            {/* Job Description Button */}
            <button
                onClick={() => setShowJobDetails(true)}
                className="group flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-md"
            >
                <span className="font-semibold text-slate-700 group-hover:text-blue-700">Job Description</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-colors group-hover:bg-blue-100 group-hover:text-blue-600">
                    <FileText size={16} />
                </div>
            </button>

            {/* Changes Summary Button */}
            <button
                onClick={() => setShowDiffs(true)}
                className="group flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-md"
            >
                <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-700 group-hover:text-blue-700">Changes Summary</span>
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                        {diffItems.length}
                    </span>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-colors group-hover:bg-blue-100 group-hover:text-blue-600">
                    <LayoutTemplate size={16} />
                </div>
            </button>
        </aside>
    )

    const renderPreview = () => {
        const baselineResume = originalResume ?? resumeData
        const previewData = previewMode === 'before' && baselineResume ? baselineResume : resumeData ?? baselineResume

        if (!previewData) return null

        return (
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                    <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
                        <button
                            onClick={() => setPreviewMode('after')}
                            className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${previewMode === 'after'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Optimized
                        </button>
                        <button
                            onClick={() => setPreviewMode('before')}
                            className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${previewMode === 'before'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Original
                        </button>
                    </div>

                    <div className="flex items-center gap-3 px-2">
                        <span className="text-xs font-medium text-slate-400">Theme:</span>
                        <div className="flex gap-1">
                            {availableThemes.map((theme) => (
                                <button
                                    key={theme.id}
                                    onClick={() => setTheme(theme.id)}
                                    className={`rounded-md px-3 py-1 text-xs font-medium transition ${currentTheme.id === theme.id
                                        ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                >
                                    {theme.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="min-h-[800px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="h-full overflow-auto p-8">
                        <ResumePreview resumeData={previewData} />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50/50">
            {renderHeader()}

            <main className="mx-auto max-w-7xl px-6 py-8">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
                    {renderSidebar()}
                    <div className="flex-1">
                        {renderPreview()}
                    </div>
                </div>
            </main>

            {/* Modals */}
            <ContentModal
                isOpen={showJobDetails}
                onClose={() => setShowJobDetails(false)}
                title="Job Description"
            >
                <div className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
                    {jobDescription}
                </div>
            </ContentModal>

            <ContentModal
                isOpen={showDiffs}
                onClose={() => setShowDiffs(false)}
                title="Changes Summary"
            >
                {diffItems.length > 0 ? (
                    <ResumeDiffTable
                        diffs={diffItems}
                        renderValue={renderDiffValue as (value: string) => JSX.Element}
                        formatPath={formatDiffPath}
                        maxVisible={MAX_DIFF_ITEMS}
                    />
                ) : (
                    <p className="text-center text-sm text-slate-500">No changes recorded.</p>
                )}
            </ContentModal>

            <SavedResumesDrawer isOpen={showHistory} onClose={() => setShowHistory(false)} />
        </div>
    )
}


export default ResultsView
