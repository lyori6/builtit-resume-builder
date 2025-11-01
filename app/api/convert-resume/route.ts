import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { validateResumeJSON } from '@/lib/resume-types'
import { buildTextToResumeJsonPrompt } from '@/lib/prompts'

export async function POST(request: NextRequest) {
  try {
    const headerKey = request.headers.get('x-gemini-api-key') ?? undefined
    const { resumeText, apiKey: bodyKey, promptOverrides } = await request.json()
    const apiKey = bodyKey ?? headerKey ?? process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    if (!resumeText || typeof resumeText !== 'string') {
      return NextResponse.json(
        { error: 'Missing resume text to convert.' },
        { status: 400 }
      )
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' })
    const prompt = buildTextToResumeJsonPrompt(resumeText, promptOverrides?.systemPrompt)

    console.log('Requesting text-to-JSON conversion via Gemini...')
    const result = await model.generateContent(prompt)
    const response = await result.response
    const rawContent = response.text()
    console.log('Conversion response length:', rawContent.length)

    let convertedJSON
    try {
      const jsonMatch = rawContent.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/)
      const jsonString = jsonMatch ? jsonMatch[1] : rawContent.trim()
      convertedJSON = JSON.parse(jsonString)
    } catch (parseError) {
      console.error('Failed to parse conversion response:', parseError)
      return NextResponse.json(
        { error: 'Failed to parse AI response', details: rawContent },
        { status: 500 }
      )
    }

    const ensureBasicsPresence = (json: unknown) => {
      if (!json || typeof json !== 'object') {
        return json
      }

      const clone = JSON.parse(JSON.stringify(json)) as {
        basics?: Record<string, unknown>
        [key: string]: unknown
      }
      const basics: Record<string, unknown> =
        clone.basics && typeof clone.basics === 'object' ? { ...clone.basics } : {}

      if (!basics.name || typeof basics.name !== 'string' || basics.name.trim().length === 0) {
        const lines = resumeText
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
        const candidate = lines.find((line) => {
          if (line.length > 60) return false
          if (line.includes('@')) return false
          if (line.match(/\d/)) return false
          return line.split(/\s+/).length <= 6
        })
        if (candidate) {
          basics.name = candidate
        }
      }

      if (!basics.email || typeof basics.email !== 'string' || basics.email.trim().length === 0) {
        const emailMatch = resumeText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
        if (emailMatch) {
          basics.email = emailMatch[0]
        }
      }

      clone.basics = basics
      return clone
    }

    const patchedJSON = ensureBasicsPresence(convertedJSON)
    const validation = validateResumeJSON(patchedJSON)
    if (!validation.isValid) {
      console.error('Converted resume failed validation:', validation.errors)
      return NextResponse.json(
        { error: 'Converted resume is invalid', details: validation.errors },
        { status: 422 }
      )
    }

    return NextResponse.json({
      success: true,
      resume: patchedJSON
    })
  } catch (error) {
    console.error('Resume conversion error:', error)

    let errorMessage = 'Failed to convert resume text.'
    let statusCode = 500

    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'Invalid API key or authentication failed'
        statusCode = 401
      } else if (error.message.includes('quota')) {
        errorMessage = 'API quota exceeded'
        statusCode = 429
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Network error connecting to AI service'
        statusCode = 502
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    )
  }
}
