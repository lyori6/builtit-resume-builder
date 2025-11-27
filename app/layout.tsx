import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/src/state/theme-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://resume.builtit.ai'), // Placeholder URL
  title: {
    default: 'GResume by BuiltIt',
    template: '%s | GResume by BuiltIt'
  },
  description: 'AI-powered resume optimization with Gemini. Bring your resume JSON or convert plain text with your own API key. Create professional, ATS-optimized resumes in minutes.',
  openGraph: {
    title: 'GResume by BuiltIt',
    description: 'AI-powered resume optimization with Gemini. Create professional, ATS-optimized resumes in minutes.',
    url: 'https://resume.builtit.ai',
    siteName: 'GResume by BuiltIt',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'GResume by BuiltIt - AI Resume Optimization'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GResume by BuiltIt',
    description: 'AI-powered resume optimization with Gemini. Create professional, ATS-optimized resumes in minutes.',
    images: ['/opengraph-image.png'],
    creator: '@builtit'
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
