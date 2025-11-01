"use client"

import { FC } from 'react'
import { Check, Play } from 'lucide-react'

interface LandingHeroProps {
  onSeeDemo: () => void
  onStartOwn: () => void
  onOpenVideo: () => void
}

const benefits = [
  'Runs locally – your data stays on your device',
  'Powered by Google’s free Gemini AI',
  'No subscription needed'
]

const LandingHero: FC<LandingHeroProps> = ({ onSeeDemo, onStartOwn, onOpenVideo }) => (
  <section className="relative isolate overflow-hidden rounded-[36px] border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-900 px-6 py-16 text-white shadow-2xl shadow-slate-900/20 sm:px-10 lg:px-16 lg:py-20">
    <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/15 via-white/5 to-transparent opacity-70" />
    <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-6 lg:max-w-xl">
        <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
          Tailor with confidence
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
            Tailor Your Resume to Any Job in 30 Seconds
          </h1>
          <p className="text-base text-slate-200 sm:text-lg">
            Watch a live optimization, then tailor your own resume in your browser with a free Gemini API key—no signup, no data sharing.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            onClick={onSeeDemo}
            className="inline-flex items-center justify-center rounded-full bg-blue-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/40 transition hover:bg-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-300"
          >
            See it in action
          </button>
          <button
            onClick={onStartOwn}
            className="inline-flex items-center justify-center rounded-full border border-white/30 px-7 py-3 text-sm font-semibold text-white/90 shadow-lg shadow-slate-900/20 transition hover:border-white/60 hover:text-white focus:outline-none focus:ring-4 focus:ring-white/20"
          >
            Start your own
          </button>
        </div>
        <ul className="space-y-3 text-sm text-slate-200">
          {benefits.map((benefit) => (
            <li key={benefit} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-white shadow-md shadow-blue-500/40">
                <Check size={16} />
              </span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex w-full justify-center lg:w-auto">
        <button
          onClick={onOpenVideo}
          className="group relative inline-flex aspect-[16/9] w-full max-w-[640px] flex-col items-center justify-between overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 p-6 text-left shadow-2xl shadow-blue-900/30 transition hover:scale-[1.01]"
          aria-label="Watch the 30 second demo"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),transparent_65%)] opacity-90 transition group-hover:opacity-100" />
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative flex w-full flex-col items-start gap-6">
            <span className="rounded-full bg-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white">
              Watch demo
            </span>
            <div className="flex w-full flex-1 items-center justify-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/90 text-blue-600 shadow-xl shadow-blue-900/40 transition group-hover:scale-110">
                <Play size={32} className="ml-1" />
              </span>
            </div>
            <div className="text-sm font-semibold uppercase tracking-[0.4em] text-white/90">
              30 seconds
            </div>
          </div>
        </button>
      </div>
    </div>
  </section>
)

export default LandingHero
