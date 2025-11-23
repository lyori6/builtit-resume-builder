import React from 'react'
import { X } from 'lucide-react'

interface ContentModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
}

const ContentModal: React.FC<ContentModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>
            </div>
        </div>
    )
}

export default ContentModal
