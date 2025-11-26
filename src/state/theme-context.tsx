'use client'

import React, { createContext, useContext, useState } from 'react'
import { ResumeTheme, themes, defaultTheme } from '@/lib/themes'

interface ThemeContextType {
    currentTheme: ResumeTheme
    setTheme: (themeId: string) => void
    availableThemes: ResumeTheme[]
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentTheme, setCurrentTheme] = useState<ResumeTheme>(defaultTheme)

    const setTheme = (themeId: string) => {
        const theme = themes[themeId]
        if (theme) {
            setCurrentTheme(theme)
        }
    }

    const value = {
        currentTheme,
        setTheme,
        availableThemes: Object.values(themes),
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
