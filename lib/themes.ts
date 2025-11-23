export interface ResumeTheme {
    id: string
    name: string
    description: string
    colors: {
        primary: string
        secondary: string
        text: string
        muted: string
        background: string
        border: string
    }
    fonts: {
        headings: string
        body: string
    }
    spacing: {
        sectionGap: string
        itemGap: string
    }
    skillsStyle: 'filled' | 'outline'
}

export const themes: Record<string, ResumeTheme> = {
    modern: {
        id: 'modern',
        name: 'Modern',
        description: 'Clean and professional with a touch of color.',
        colors: {
            primary: '#2563eb', // blue-600
            secondary: '#64748b', // slate-500
            text: '#0f172a', // slate-900
            muted: '#64748b', // slate-500
            background: '#ffffff',
            border: '#e2e8f0', // slate-200
        },
        fonts: {
            headings: 'font-sans',
            body: 'font-sans',
        },
        spacing: {
            sectionGap: 'gap-6',
            itemGap: 'gap-3',
        },
        skillsStyle: 'filled',
    },
    classic: {
        id: 'classic',
        name: 'Classic',
        description: 'Traditional serif typography for a timeless look.',
        colors: {
            primary: '#1e293b', // slate-800
            secondary: '#475569', // slate-600
            text: '#0f172a', // slate-900
            muted: '#64748b', // slate-500
            background: '#ffffff',
            border: '#cbd5e1', // slate-300
        },
        fonts: {
            headings: 'font-serif',
            body: 'font-serif',
        },
        spacing: {
            sectionGap: 'gap-5',
            itemGap: 'gap-2',
        },
        skillsStyle: 'filled',
    },
    minimal: {
        id: 'minimal',
        name: 'Minimal',
        description: 'High contrast, black and white, focused on content.',
        colors: {
            primary: '#000000',
            secondary: '#404040', // neutral-700
            text: '#000000',
            muted: '#525252', // neutral-600
            background: '#ffffff',
            border: '#000000',
        },
        fonts: {
            headings: 'font-mono',
            body: 'font-sans',
        },
        spacing: {
            sectionGap: 'gap-8',
            itemGap: 'gap-4',
        },
        skillsStyle: 'outline',
    },
}

export const defaultTheme = themes.modern
