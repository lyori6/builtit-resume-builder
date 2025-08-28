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
    const { resumeData, jobDescription } = await request.json()

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

    // Initialize Gemini 2.0 Flash model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    // Create sophisticated optimization prompt
    const prompt = createOptimizationPrompt(resumeData, jobDescription)

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

function createOptimizationPrompt(resumeData: any, jobDescription: string): string {
  return `System: You are tailoring the resume of Lyor Itzhaki, a senior product manager with 5+ years in fintech/e-commerce, strong AI/ML product experience, and hands-on full-stack building skills. Use only his resume as the source of facts. Highlight results, experimentation, and builder PM execution. Keep outputs concise, ATS-friendly, and aligned to the job description.

You are an expert resume optimization assistant tailoring for both ATS systems and hiring managers. Your task is to make SUBTLE, NATURAL improvements to a resume based on a job description and personal notes.

CRITICAL REQUIREMENTS:
1. Make MINIMAL changes - only enhance existing content, don't add new sections or experiences
2. Preserve the EXACT JSON structure and format
3. Keep the same professional tone and style
4. Do NOT increase content length by more than 10%
5. Focus on natural keyword integration optimized for both ATS parsing and human reviewers
6. Enhance action verbs and quantifiable results where possible
7. Maintain authenticity - all changes must feel natural and believable

SPECIFIC ALLOWABLE MODIFICATIONS:
- **Title/Headline**: Can lightly enhance "Product Lead & Founder" by adding specialty or focus area after it (e.g., "Product Lead & Founder | AI/Fintech Specialist")
- **Core Competencies**: Can adjust skill keywords and groupings to better match job requirements, reorder for relevance, and add closely related skills
- **Content Enhancement**: Optimize language for both automated screening and manual review by hiring managers

JOB DESCRIPTION + NOTES:
${jobDescription}

CURRENT RESUME JSON:
${JSON.stringify(resumeData, null, 2)}

OPTIMIZATION AREAS:
1. **Summary/Professional Summary**: Align language with job requirements while keeping personal voice
2. **Experience Descriptions**: Enhance bullet points with relevant keywords and stronger action verbs
3. **Skills Section**: Prioritize and refine keywords that match job requirements
4. **Project Descriptions**: Highlight relevant technical skills and outcomes

OUTPUT REQUIREMENTS:
- Return ONLY the optimized JSON (wrapped in \`\`\`json code blocks)
- Maintain exact same structure as input
- All field names, IDs, and formatting must remain identical
- Changes should be subtle and professional
- Do not add placeholder text or comments

Begin optimization now:`
}