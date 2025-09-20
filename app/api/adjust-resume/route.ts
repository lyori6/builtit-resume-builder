import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { validateResumeJSON } from '@/lib/resume-types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    // Parse request body
    const { resumeData, adjustmentInstructions } = await request.json()

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
    const prompt = createAdjustmentPrompt(resumeData, adjustmentInstructions)

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

function createAdjustmentPrompt(resumeData: any, adjustmentInstructions: string): string {
  return `System: You are an expert resume editor specializing in QUICK, PRECISE adjustments. You will receive a resume and specific adjustment instructions. Make ONLY the requested changes while preserving all structure and formatting.

CRITICAL REQUIREMENTS:
1. Make ONLY the changes explicitly requested in the instructions
2. Preserve the EXACT JSON structure and format
3. Keep the same professional tone and style
4. Do NOT make unsolicited improvements or additions
5. Focus on speed and precision - this is for final touch-ups only
6. Maintain authenticity - all changes must feel natural

TYPES OF ADJUSTMENTS YOU HANDLE:
- **Length adjustments**: Make content shorter/longer as requested
- **Content removal**: Remove specific sections, experiences, or skills
- **Emphasis changes**: Highlight or de-emphasize certain areas
- **Format tweaks**: Adjust ordering, grouping, or presentation
- **Quick fixes**: Fix typos, improve specific phrases

ADJUSTMENT INSTRUCTIONS:
${adjustmentInstructions}

CURRENT RESUME JSON:
${JSON.stringify(resumeData, null, 2)}

ADJUSTMENT GUIDELINES:
1. Read the instructions carefully and identify exactly what needs to be changed
2. Apply ONLY those specific changes
3. Preserve everything else exactly as it was
4. Ensure the result is still professional and coherent
5. Do not add new content unless explicitly requested

OUTPUT REQUIREMENTS:
- Return ONLY the adjusted JSON (wrapped in \`\`\`json code blocks)
- Maintain exact same structure as input
- All field names, IDs, and formatting must remain identical
- Changes should be surgical and precise
- Do not add placeholder text or comments

Begin adjustment now:`
}