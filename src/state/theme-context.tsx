'use client'

import React, { createContext, useContext, useState } from 'react'
import { ResumeTheme, themes, defaultTheme } from '@/lib/themes'

interface ThemeContextType {
    currentTheme: ResumeTheme
    setTheme: (themeId: string) => void
    availableThemes: ResumeTheme[]
    customColor: string | null
    setCustomColor: (color: string | null) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [themeId, setThemeId] = useState<string>(defaultTheme.id)
    const [customColor, setCustomColor] = useState<string | null>(null)

    const setTheme = (id: string) => {
        if (themes[id]) {
            setThemeId(id)
        }
    }

    const baseTheme = themes[themeId] || defaultTheme

    // Merge custom color if present
    const currentTheme: ResumeTheme = React.useMemo(() => {
        if (!customColor) return baseTheme
        return {
            ...baseTheme,
            colors: {
                ...baseTheme.colors,
                primary: customColor,
                // Optional: Adjust secondary/border based on primary if needed, 
                // but for now we just override the primary accent.
            }
        }
    }, [baseTheme, customColor])

    const value = {
        currentTheme,
        setTheme,
        availableThemes: Object.values(themes),
        customColor,
        setCustomColor,
    }

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
    const context = useContext(ThemeContext)
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}
