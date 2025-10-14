import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { validateResumeJSON } from '@/lib/resume-types'
import { buildAdjustmentPrompt } from '@/lib/prompts'

export async function POST(request: NextRequest) {
  try {
    const headerKey = request.headers.get('x-gemini-api-key') ?? undefined
    // Validate API key
    const body = await request.json()
    const { resumeData, adjustmentInstructions, apiKey: bodyKey, promptOverrides } = body
    const apiKey = bodyKey ?? headerKey ?? process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    const genAI = new GoogleGenerativeAI(apiKey)

    // Validate inputs
    if (!resumeData || !adjustmentInstructions) {
      return NextResponse.json(
        { error: 'Missing required fields: resumeData and adjustmentInstructions' },
        { status: 400 }
      )
    }

    // Validate resume structure
    const validation = validateResumeJSON(resumeData)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invalid resume format', details: validation.errors },
        { status: 400 }
      )
    }

    // Initialize Gemini 2.5 Flash model for quick adjustments
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    // Create focused adjustment prompt
    const prompt = buildAdjustmentPrompt(
      resumeData,
      adjustmentInstructions,
      promptOverrides?.systemPrompt
    )

    // Generate adjusted resume
    console.log('Sending adjustment request to Gemini Flash...')
    const result = await model.generateContent(prompt)
    const response = await result.response
    const adjustedContent = response.text()
    console.log('Received adjustment response from Gemini Flash, length:', adjustedContent.length)

    // Extract JSON from response (handle potential markdown formatting)
    let adjustedResume
    try {
      // Try to extract JSON from markdown code blocks or plain text
      const jsonMatch = adjustedContent.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/)
      const jsonString = jsonMatch ? jsonMatch[1] : adjustedContent.trim()

      adjustedResume = JSON.parse(jsonString)
    } catch (parseError) {
      console.error('Failed to parse Gemini adjustment response:', parseError)
      return NextResponse.json(
        { error: 'Failed to parse AI response', details: adjustedContent },
        { status: 500 }
      )
    }

    // Validate adjusted resume structure
    const adjustedValidation = validateResumeJSON(adjustedResume)
    if (!adjustedValidation.isValid) {
      console.error('Adjusted resume validation failed:', adjustedValidation.errors)
      return NextResponse.json(
        { error: 'AI generated invalid resume format', details: adjustedValidation.errors },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      adjustedResume,
      original: resumeData
    })

  } catch (error) {
    console.error('Resume adjustment error:', error)

    // More specific error handling
    let errorMessage = 'Failed to adjust resume'
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
