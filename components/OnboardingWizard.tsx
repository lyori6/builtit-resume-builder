"use client"

import { FC, useMemo, useState, useEffect } from 'react'
import {
  X,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  KeyRound,
  ShieldCheck,
  FileCode,
  FileText,
  ExternalLink,
  Download,
  CheckCircle2
} from 'lucide-react'

interface OnboardingWizardProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  geminiKeyHelpUrl: string
}

interface StepContent {
  title: string
  description: string
  bullets: Array<{
    icon: JSX.Element
    text: string
  }>
  footer?: {
    label: string
    href: string
  }
}

const steps: StepContent[] = [
  {
    title: 'Grab your free Gemini API key',
    description:
      "You will use Google's Gemini 1.5 Pro free tier. The key never leaves your browser and you can delete it anytime.",
    bullets: [
      {
        icon: <KeyRound size={16} className="text-blue-600" />,
        text: 'Sign in to Google AI Studio and create a new API key.'
      },
      {
        icon: <ShieldCheck size={16} className="text-blue-600" />,
        text: 'Paste it into the key panel on the main screen so the app stores it locally only.'
      },
      {
        icon: <Sparkles size={16} className="text-blue-600" />,
        text: 'Once saved, you can update or remove the key in one click.'
      }
    ],
    footer: {
      label: 'Open Gemini API key instructions',
      href: 'GEMINI_HELP'
    }
  },
  {
    title: 'Bring in your resume',
    description:
      'Work with whichever format you already have. The intake tabs let you paste JSON or raw text and convert it on the fly.',
    bullets: [
      {
        icon: <FileCode size={16} className="text-blue-600" />,
        text: 'Have structured data? Paste resume JSON and validate it instantly before loading.'
      },
      {
        icon: <FileText size={16} className="text-blue-600" />,
        text: 'Only have a document? Drop the plain text and let Gemini convert it into the right schema.'
      },
      {
        icon: <Sparkles size={16} className="text-blue-600" />,
        text: 'Need a starting point? Ask your favorite AI with the provided prompt or try Rx Resume to export JSON quickly.'
      }
    ],
    footer: {
      label: 'Visit Rx Resume (external)',
      href: 'https://rxresu.me/'
    }
  },
  {
    title: 'Tailor, compare, and export',
    description:
      "After loading your resume, use the workspace to target a job description and review Gemini's suggestions safely.",
    bullets: [
      {
        icon: <Sparkles size={16} className="text-blue-600" />,
        text: 'Paste the job description, run optimization, and capture adjustments in the diff view.'
      },
      {
        icon: <CheckCircle2 size={16} className="text-blue-600" />,
        text: 'Review the summary of changes, revert if something looks off, and iterate with adjustment prompts.'
      },
      {
        icon: <Download size={16} className="text-blue-600" />,
        text: 'Download the optimized JSON or print a polished PDF without sending data to any server.'
      }
    ]
  }
]

const OnboardingWizard: FC<OnboardingWizardProps> = ({ isOpen, onClose, onComplete, geminiKeyHelpUrl }) => {
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    if (isOpen) {
      setStepIndex(0)
    }
  }, [isOpen])

  const activeStep = useMemo(() => steps[stepIndex], [stepIndex])

  if (!isOpen) {
    return null
  }

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((current) => current + 1)
      return
    }

    onComplete()
  }

  const handleBack = () => {
    if (stepIndex === 0) {
      return
    }
    setStepIndex((current) => current - 1)
  }

  const resolveFooterLink = (href: string) => {
    if (href === 'GEMINI_HELP') {
      return geminiKeyHelpUrl
    }
    return href
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-xl border border-gray-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-900 transition-colors"
          aria-label="Close onboarding wizard"
        >
          <X size={20} />
        </button>
        <div className="p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-blue-600 font-semibold">
                Quick Start
              </div>
              <h2 className="text-xl font-bold text-gray-900">{activeStep.title}</h2>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-5">{activeStep.description}</p>
          <div className="space-y-4">
            {activeStep.bullets.map((bullet, index) => (
              <div key={index} className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="mt-1">{bullet.icon}</div>
                <p className="text-sm text-gray-700">{bullet.text}</p>
              </div>
            ))}
          </div>
          {activeStep.footer && (
            <a
              href={resolveFooterLink(activeStep.footer.href)}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <ExternalLink size={16} />
              {activeStep.footer.label}
            </a>
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 rounded-b-2xl">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            Step {stepIndex + 1} of {steps.length}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              disabled={stepIndex === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              {stepIndex < steps.length - 1 ? (
                <>
                  Next
                  <ArrowRight size={16} />
                </>
              ) : (
                <>
                  Finish
                  <CheckCircle2 size={16} className="text-white" />
                </>
              )}
            </button>
          </div>
        </div>
        <button
          onClick={onClose}
          className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}

export default OnboardingWizard
