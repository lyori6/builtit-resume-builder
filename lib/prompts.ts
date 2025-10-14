import { ResumeData } from './resume-types'

export const DEFAULT_TEXT_CONVERSION_SYSTEM_PROMPT = `System: You convert plain-text resumes into structured JSON using the provided schema. Preserve all factual details, dates, companies, and quantifiable outcomes. When content includes bullet points, render them as HTML <ul><li>…</li></ul>. Do not fabricate information or invent new roles.

Constraints:
- Follow the JSON schema exactly. All keys must match.
- If information is missing (e.g., phone, location), use an empty string.
- Produce valid JSON only—no markdown, commentary, or backticks.
- Keep summaries concise and professional.`

export const DEFAULT_OPTIMIZATION_SYSTEM_PROMPT = `System: You are tailoring a resume. Use only the provided resume content as the source of truth. Align the language with the job description while keeping content believable and concise.`

export const DEFAULT_ADJUSTMENT_SYSTEM_PROMPT = `System: Apply precise edits to the resume according to the instructions. Keep all other content unchanged.`

const RESUME_SCHEMA_SNIPPET = `
{
  "basics": {
    "name": "string",
    "headline": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "url": { "label": "string", "href": "string" },
    "customFields": [
      { "id": "string", "icon": "string", "name": "string", "value": "string" }
    ],
    "profiles": [
      { "network": "string", "username": "string", "url": "string" }
    ]
  },
  "sections": {
    "summary": {
      "id": "summary",
      "name": "string",
      "visible": true,
      "content": "<p>HTML content</p>"
    },
    "experience": {
      "id": "experience",
      "name": "string",
      "visible": true,
      "items": [
        {
          "id": "string",
          "visible": true,
          "company": "string",
          "position": "string",
          "location": "string",
          "date": "string",
          "summary": "<p>HTML bullet points</p>"
        }
      ]
    }
  }
}
`

export const buildTextToResumeJsonPrompt = (
  resumeText: string,
  override?: string
) => {
  const systemPrompt = override && override.trim().length > 0
    ? override.trim()
    : DEFAULT_TEXT_CONVERSION_SYSTEM_PROMPT

  return `${systemPrompt}
Resume schema:
${RESUME_SCHEMA_SNIPPET}

Resume text:
${resumeText}

Return the JSON now:`
}

export const buildOptimizationPrompt = (
  resumeData: ResumeData,
  jobDescription: string,
  override?: string
) => {
  const systemPrompt = override && override.trim().length > 0
    ? override.trim()
    : DEFAULT_OPTIMIZATION_SYSTEM_PROMPT

  const json = JSON.stringify(resumeData, null, 2)
  return `${systemPrompt}

Rules:
1. Maintain existing structure and keys exactly.
2. Make subtle wording improvements; do not add new sections or experiences.
3. Integrate relevant keywords naturally.
4. Ensure total content length increases by no more than 10%.

Job description:
${jobDescription}

Resume JSON:
${json}

Return ONLY the optimized JSON.`
}

export const buildAdjustmentPrompt = (
  resumeData: ResumeData,
  instructions: string,
  override?: string
) => {
  const systemPrompt = override && override.trim().length > 0
    ? override.trim()
    : DEFAULT_ADJUSTMENT_SYSTEM_PROMPT

  const json = JSON.stringify(resumeData, null, 2)
  return `${systemPrompt}

Instructions:
${instructions}

Resume JSON:
${json}

Rules:
- Maintain exact schema and keys.
- If removing items, delete them cleanly from arrays.
- Do not add commentary.

Return ONLY the adjusted JSON.`
}
