import React, { useRef } from 'react'
import LandingHero from '@/components/LandingHero'
import ResumeIntake from '@/components/ResumeIntake'
import { useOptimizerContext } from '@/src/state/optimizer-context'
import ProcessingModal from '@/components/ProcessingModal'

interface IntakeViewProps {
    onStartOwn: () => void
    onSeeDemo: () => void
    onFileDrop: (file: File) => void
    // Props passed down to ResumeIntake
    resumeText: string
    onResumeTextChange: (text: string) => void
    isConverting: boolean
    conversionError: string | null
    onConvert: () => void
    pastedJSON: string
    onJSONChange: (value: string) => void
    isJSONValid: boolean | null
    jsonErrors: string[]
    onLoadJSON: () => void
    showPromptHelper: boolean
    onTogglePromptHelper: () => void
    isUploadingJSON: boolean
}

const IntakeView: React.FC<IntakeViewProps> = ({
    onStartOwn,
    onSeeDemo,
    onFileDrop,
    resumeText,
    onResumeTextChange,
    isConverting,
    conversionError,
    onConvert,
    pastedJSON,
    onJSONChange,
    isJSONValid,
    jsonErrors,
    onLoadJSON,
    showPromptHelper,
    onTogglePromptHelper,
    isUploadingJSON
}) => {
    const intakeSectionRef = useRef<HTMLDivElement>(null)

    const handleStartOwn = () => {
        onStartOwn()
        requestAnimationFrame(() => {
            if (intakeSectionRef.current) {
                intakeSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
        })
    }

    // ... inside component
    return (
        <>
            <ProcessingModal
                isOpen={isConverting}
                title="Converting your resume..."
                message="This usually takes a few seconds, but can take up to 3 minutes."
                loaderText="Converting"
            />
            <LandingHero
                onSeeDemo={onSeeDemo}
                onStartOwn={handleStartOwn}
            />
            <div ref={intakeSectionRef} className="scroll-mt-24">
                <ResumeIntake
                    rawResumeText={resumeText}
                    onRawTextChange={onResumeTextChange}
                    isConvertingText={isConverting}
                    textConversionError={conversionError}
                    onConvertText={onConvert}
                    pastedJSON={pastedJSON}
                    onJSONChange={onJSONChange}
                    isJSONValid={isJSONValid}
                    jsonErrors={jsonErrors}
                    onLoadJSON={onLoadJSON}
                    onJSONFileDrop={onFileDrop}
                    showPromptHelper={showPromptHelper}
                    onTogglePromptHelper={onTogglePromptHelper}
                    isUploadingJSON={isUploadingJSON}
                    onViewDemo={onSeeDemo}
                />
            </div>
        </>
    )
}

export default IntakeView
