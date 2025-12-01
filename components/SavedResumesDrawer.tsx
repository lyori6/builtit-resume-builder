import React, { useEffect, useState } from 'react'
import { FileText, Trash2, History, Wand2 } from 'lucide-react'
import { storage, SavedResume } from '@/lib/local-storage'
import { useOptimizerContext } from '@/src/state/optimizer-context'
import ContentModal from '@/components/ContentModal'

interface SavedResumesDrawerProps {
    isOpen: boolean
    onClose: () => void
}

const SavedResumesDrawer: React.FC<SavedResumesDrawerProps> = ({ isOpen, onClose }) => {
    const { dispatch } = useOptimizerContext()
    const [savedResumes, setSavedResumes] = useState<SavedResume[]>([])

    useEffect(() => {
        if (isOpen) {
            setSavedResumes(storage.getResumes())
        }
    }, [isOpen])

    const handleLoad = (id: string) => {
        const resume = storage.getResume(id)
        if (resume) {
            dispatch({ type: 'SET_WORKSPACE_RESUME', json: JSON.stringify(resume.data) })
            dispatch({ type: 'SET_ORIGINAL_RESUME', json: JSON.stringify(resume.data) })
            dispatch({ type: 'SET_LOADED_SOURCE', source: { type: 'custom', id } })

            if (resume.jobDescription) {
                dispatch({ type: 'SET_JOB_DESCRIPTION', text: resume.jobDescription })
            }

            if (resume.coverLetter) {
                dispatch({ type: 'SET_COVER_LETTER', text: resume.coverLetter })
            } else {
                dispatch({ type: 'SET_COVER_LETTER', text: '' })
            }

            if (resume.optimizedData) {
                dispatch({ type: 'SET_OPTIMIZED_DATA', json: JSON.stringify(resume.optimizedData) })
            } else {
                dispatch({ type: 'RESET_OPTIMIZATION' })
            }
            onClose()
        }
    }

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (confirm('Are you sure you want to delete this resume?')) {
            storage.removeResume(id)
            setSavedResumes(storage.getResumes())
        }
    }

    return (
        <ContentModal
            isOpen={isOpen}
            onClose={onClose}
            title="History"
        >
            <div className="space-y-3">
                {savedResumes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="mb-3 rounded-full bg-slate-100 p-3">
                            <History size={24} className="text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-900">No saved resumes yet</p>
                        <p className="mt-1 text-xs text-slate-500">Resumes you optimize will appear here</p>
                    </div>
                ) : (
                    savedResumes.map((resume) => (
                        <div
                            key={resume.id}
                            onClick={() => handleLoad(resume.id)}
                            className="group relative flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-md"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-lg transition ${resume.optimizedData ? 'bg-purple-50 text-purple-600 group-hover:bg-purple-100 group-hover:text-purple-700' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100 group-hover:text-blue-700'}`}>
                                    {resume.optimizedData ? <Wand2 size={20} /> : <FileText size={20} />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-slate-900">{resume.name}</h4>
                                        {resume.optimizedData ? (
                                            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-700">
                                                Optimized
                                            </span>
                                        ) : (
                                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                                                Original
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        {new Date(resume.updatedAt).toLocaleDateString()} • {new Date(resume.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {resume.coverLetter && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleLoad(resume.id)
                                            dispatch({ type: 'SET_STEP', step: 'results' })
                                            dispatch({ type: 'SET_COVER_LETTER_MODAL_OPEN', isOpen: true })
                                        }}
                                        className="flex items-center gap-1.5 rounded-md border border-purple-200 bg-purple-50 px-2.5 py-1.5 text-xs font-medium text-purple-700 transition hover:bg-purple-100 hover:shadow-sm"
                                    >
                                        <Wand2 size={12} />
                                        Cover Letter
                                    </button>
                                )}
                                <button
                                    onClick={(e) => handleDelete(resume.id, e)}
                                    className="rounded-lg p-2 text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                                    title="Delete resume"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </ContentModal>
    )
}

export default SavedResumesDrawer
