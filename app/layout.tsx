import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
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
      <head>
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-TFJ2WBKQ');
          `}
        </Script>
      </head>
      <body className={inter.className}>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-TFJ2WBKQ"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
