import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

type RequestBody = {
  apiKey?: string
  model?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RequestBody
    const headerKey = request.headers.get('x-gemini-api-key') ?? undefined
    const apiKey = body.apiKey ?? headerKey
    const modelId = body.model ?? 'gemini-2.5-pro'

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing Gemini API key.' },
        { status: 400 }
      )
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: modelId })

    // Use a lightweight prompt to validate authentication.
    await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: 'ping' }]
        }
      ],
      generationConfig: { maxOutputTokens: 1 }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Gemini key validation failed.')

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: 'Unable to validate Gemini key.',
          details: error.message
        },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Unknown error validating Gemini key.' },
      { status: 500 }
    )
  }
}
