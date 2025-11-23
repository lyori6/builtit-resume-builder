import React from 'react'
import QuantumPulseLoader from '@/components/ui/QuantumPulseLoader'

interface ProcessingModalProps {
    isOpen: boolean
    title: string
    message: string
    loaderText?: string
}

const ProcessingModal: React.FC<ProcessingModalProps> = ({ isOpen, title, message, loaderText }) => {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
            <div className="flex max-w-md flex-col items-center justify-center p-6 text-center">
                <QuantumPulseLoader text={loaderText} />
                <h3 className="mt-6 text-xl font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm text-slate-600">{message}</p>
            </div>
        </div>
    )
}

export default ProcessingModal
