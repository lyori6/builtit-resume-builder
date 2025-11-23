"use client"

import { FC } from 'react'
import { Download, Laptop, Play, ShieldCheck, Target, UploadCloud, Key } from 'lucide-react'

interface LandingHeroProps {
  onSeeDemo: () => void
  onStartOwn: () => void
}

const steps = [
  { title: 'Upload resume', description: 'Paste text or import JSON.', icon: UploadCloud, color: 'primary' },
  { title: 'Add job description', description: 'Tell us the role to target.', icon: Target, color: 'warning' },
  { title: 'Download PDF', description: 'Review and export instantly.', icon: Download, color: 'success' }
]

const indicatorClasses: Record<string, string> = {
  primary: 'bg-primary text-white',
  warning: 'bg-warning text-white',
  success: 'bg-success text-white'
}

const iconClasses: Record<string, string> = {
  primary: 'text-primary',
  warning: 'text-warning',
  success: 'text-success'
}

const LandingHero: FC<LandingHeroProps> = ({ onSeeDemo, onStartOwn }) => (
  <section className="relative isolate overflow-hidden rounded-[40px] border border-slate-200 bg-landing-hero px-6 py-16 text-white shadow-2xl shadow-slate-900/20 sm:px-10 lg:px-28 lg:py-20">
    <div className="absolute inset-x-10 top-0 h-36 rounded-b-[36px] bg-gradient-to-b from-white/15 via-white/5 to-transparent opacity-70" />
    <div className="relative mx-auto flex w-full max-w-[1100px] flex-col gap-8">
      <div className="inline-flex flex-wrap items-center gap-4 self-start rounded-full border border-white/20 bg-white/10 px-6 py-2 text-[0.75rem] font-semibold uppercase tracking-[0.32em] text-white/80">
        <span className="flex items-center gap-2 text-white">
          <Laptop size={16} />
          Runs locally
        </span>
        <span className="text-white/50">•</span>
        <span className="flex items-center gap-2 text-white">
          <Key size={16} />
          Free Gemini key
        </span>
        <span className="text-white/50">•</span>
        <span className="flex items-center gap-2 text-white">
          <ShieldCheck size={16} />
          No signup
        </span>
      </div>
      <div className="space-y-6">
        <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl lg:leading-[1.05]">
          Tailor your resume to any job description in 30 seconds
        </h1>
        <p className="max-w-3xl text-lg text-slate-100">
          Paste your resume, add the job description, and download a polished PDF. Everything runs in your browser using your free Gemini API key.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={onStartOwn}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-10 py-4 text-base font-semibold text-white shadow-xl shadow-primary/40 transition-all hover:bg-primary-hover hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-primary/40"
        >
          <UploadCloud size={16} />
          Upload your resume
        </button>
        <button
          type="button"
          onClick={onSeeDemo}
          className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white/30 px-8 py-3 text-sm font-semibold text-white/85 shadow-lg shadow-slate-900/30 transition hover:border-white/60 hover:text-white focus:outline-none focus:ring-4 focus:ring-white/20"
        >
          <Play size={16} />
          See how it works
        </button>
      </div>
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">3 quick moves</p>
        <div className="mt-4 space-y-4 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-5">
          {steps.map((step, index) => {
            const StepIcon = step.icon
            return (
              <div key={step.title} className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-base font-bold ${indicatorClasses[step.color]}`}>
                  {index + 1}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <StepIcon size={18} className={iconClasses[step.color]} />
                    <p className="text-base font-semibold text-white">{step.title}</p>
                  </div>
                  <p className="text-sm text-white/70">{step.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="rounded-[28px] border border-white/10 bg-gradient-highlight p-6 text-left shadow-2xl shadow-blue-900/30">
        <div className="space-y-4">
          <span className="inline-flex rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-white">
            Live walkthrough
          </span>
          <div className="overflow-hidden rounded-2xl border border-white/20 bg-black/20">
            <div className="relative aspect-video w-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),transparent_70%)]">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center text-white/90">
                <button
                  type="button"
                  onClick={onSeeDemo}
                  className="inline-flex items-center gap-2 rounded-full bg-white/95 px-5 py-2 text-sm font-semibold text-blue-600 shadow-lg shadow-blue-900/30 transition hover:bg-white"
                >
                  <Play size={16} />
                  Watch how it works
                </button>
                <p className="text-xs text-white/80">Video coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="text-sm text-white/80">
        <a
          href="https://github.com/lyor/builtit-resume-builder/blob/main/docs/gemini-key-setup.md"
          target="_blank"
          rel="noreferrer"
          className="underline-offset-4 transition hover:text-white"
        >
          Need a Gemini API key? Here's how
        </a>
      </div>
    </div>
  </section>
)

export default LandingHero
