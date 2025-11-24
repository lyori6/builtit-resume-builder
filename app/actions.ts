'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { ResumeData } from '@/lib/resume-types'
import { buildCoverLetterPrompt } from '@/lib/prompts'

export async function generateCoverLetter(
    resumeData: ResumeData,
    jobDescription: string,
    apiKey?: string
) {
    try {
        const key = apiKey || process.env.GEMINI_API_KEY
        if (!key) {
            throw new Error('Gemini API key not configured')
        }

        const genAI = new GoogleGenerativeAI(key)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

        const prompt = buildCoverLetterPrompt(resumeData, jobDescription)

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        return { success: true, coverLetter: text }
    } catch (error) {
        console.error('Cover letter generation error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate cover letter'
        }
    }
}
