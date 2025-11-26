import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/src/state/theme-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://resume.builtit.ai'), // Placeholder URL
  title: {
    default: 'BuiltIt Resume Builder',
    template: '%s | BuiltIt Resume Builder'
  },
  description: 'Bring your resume JSON or let BuiltIt convert plain text with your own Gemini key. Create professional, optimized resumes in minutes.',
  openGraph: {
    title: 'BuiltIt Resume Builder',
    description: 'Create professional, optimized resumes in minutes with AI-powered tools.',
    url: 'https://resume.builtit.ai',
    siteName: 'BuiltIt Resume Builder',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'BuiltIt Resume Builder Preview'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BuiltIt Resume Builder',
    description: 'Create professional, optimized resumes in minutes with AI-powered tools.',
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
