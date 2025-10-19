import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { validateResumeJSON } from '@/lib/resume-types'
import { buildOptimizationPrompt } from '@/lib/prompts'

export async function POST(request: NextRequest) {
  try {
    const headerKey = request.headers.get('x-gemini-api-key') ?? undefined
    // Validate API key
    const body = await request.json()
    const { resumeData, jobDescription, apiKey: bodyKey, promptOverrides } = body
    const apiKey = bodyKey ?? headerKey ?? process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    const genAI = new GoogleGenerativeAI(apiKey)

    // Validate inputs
    if (!resumeData || !jobDescription) {
      return NextResponse.json(
        { error: 'Missing required fields: resumeData and jobDescription' },
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

    // Initialize Gemini Flash latest model
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' })

    // Create sophisticated optimization prompt
    const prompt = buildOptimizationPrompt(
      resumeData,
      jobDescription,
      promptOverrides?.systemPrompt
    )

    // Generate optimized resume
    console.log('Sending request to Gemini...')
    const result = await model.generateContent(prompt)
    const response = await result.response
    const optimizedContent = response.text()
    console.log('Received response from Gemini, length:', optimizedContent.length)

    // Extract JSON from response (handle potential markdown formatting)
    let optimizedResume
    try {
      // Try to extract JSON from markdown code blocks or plain text
      const jsonMatch = optimizedContent.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/)
      const jsonString = jsonMatch ? jsonMatch[1] : optimizedContent.trim()
      
      optimizedResume = JSON.parse(jsonString)
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError)
      return NextResponse.json(
        { error: 'Failed to parse AI response', details: optimizedContent },
        { status: 500 }
      )
    }

    // Validate optimized resume structure
    const optimizedValidation = validateResumeJSON(optimizedResume)
    if (!optimizedValidation.isValid) {
      console.error('Optimized resume validation failed:', optimizedValidation.errors)
      return NextResponse.json(
        { error: 'AI generated invalid resume format', details: optimizedValidation.errors },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      optimizedResume,
      original: resumeData
    })

  } catch (error) {
    console.error('Resume optimization error:', error)
    
    // More specific error handling
    let errorMessage = 'Failed to optimize resume'
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
