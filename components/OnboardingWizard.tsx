"use client"

import { FC, useState } from 'react'
import { X, Sparkles, ShieldCheck, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react'

interface OnboardingWizardProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  geminiKeyHelpUrl: string
}

const OnboardingWizard: FC<OnboardingWizardProps> = ({ isOpen, onClose, onComplete, geminiKeyHelpUrl }) => {
  const [showDetails, setShowDetails] = useState(false)

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 transition-colors"
          aria-label="Close onboarding wizard"
        >
          <X size={20} />
        </button>
        <div className="space-y-6 p-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30">
              <Sparkles size={32} />
            </span>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Two-minute setup</p>
              <h1 className="text-2xl font-bold text-slate-900">Unlock resume tailoring with a free Gemini key</h1>
              <p className="text-sm text-slate-600">
                This resume optimizer runs entirely in your browser. Grab a free Gemini key so you can tailor resumes securely without subscriptions.
              </p>
            </div>
          </div>
          <ol className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left">
            <li className="flex gap-4">
              <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-semibold">
                1
              </span>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800">Open Google AI Studio</p>
                <p className="text-sm text-slate-600">Sign in with a Google account to access Gemini.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-semibold">
                2
              </span>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800">Generate a free API key</p>
                <p className="text-sm text-slate-600">Create or select a project, then choose to create a key. Google provides generous free daily usage.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-semibold">
                3
              </span>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800">Paste it back in BuiltIt</p>
                <p className="text-sm text-slate-600">Save the key in the Gemini panel on the main screen. All conversions run locally and you can delete or update it anytime.</p>
              </div>
            </li>
          </ol>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <button
              onClick={() => setShowDetails((value) => !value)}
              className="flex w-full items-center justify-between bg-white px-5 py-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <span className="inline-flex items-center gap-2">
                {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                Need step-by-step details?
              </span>
            </button>
            {showDetails && (
              <div className="space-y-3 border-t border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
                <p>Here is the detailed flow if you want it:</p>
                <ol className="space-y-2 pl-5 text-left text-sm text-slate-600 list-decimal">
                  <li>Go to Google AI Studio and sign in. If prompted, accept the Gemini terms.</li>
                  <li>Select the project dropdown, choose <strong>+ New project</strong>, and give it a name.</li>
                  <li>Open the API Keys page and click <strong>Create API key</strong>. Copy the value that appears.</li>
                  <li>Return to BuiltIt and paste the key into the Gemini key panel. Click <strong>Save key</strong>.</li>
                  <li>You can revoke the key later inside AI Studio or clear it from BuiltIt with one click.</li>
                </ol>
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <div className="flex items-start gap-3">
              <ShieldCheck size={20} className="text-blue-600" />
              <p>
                This resume optimizer never sends your key or your resume to a server. Everything stays on this device so you can work privately and for free.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
            <a
              href={geminiKeyHelpUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:from-blue-500 hover:to-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-200"
            >
              Get Gemini key
            </a>
            <button
              onClick={onComplete}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-8 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-200"
            >
              I already have a key
            </button>
          </div>
        </div>
        <button
          onClick={onClose}
          className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          I’ll do this later
          <ArrowRight size={12} className="ml-1 inline" />
        </button>
      </div>
    </div>
  )
}

export default OnboardingWizard
