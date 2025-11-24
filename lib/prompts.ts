import { ResumeData } from './resume-types'

export const DEFAULT_TEXT_CONVERSION_SYSTEM_PROMPT = `System: You convert plain-text resumes into structured JSON using the provided schema. Preserve all factual details, dates, companies, and quantifiable outcomes. When content includes bullet points, render them as HTML <ul><li>...</li></ul>. Do not fabricate information or invent new roles.

Constraints:
- Follow the JSON schema exactly. All keys must match.
- Populate required fields for every item. If you cannot infer a value (for example a project name), derive a short descriptive title from the available text or exclude that item entirely.
- If information is missing (e.g., phone, location), use an empty string.
- Remove optional sections (projects, certifications, etc.) if they have no content, or set "visible": false with an empty "items" array.
- Produce valid JSON only - no markdown, commentary, or backticks.
- Keep summaries concise and professional.`

export const DEFAULT_OPTIMIZATION_SYSTEM_PROMPT = `System: You are tailoring a resume. Use only the provided resume content as the source of truth. Align the language with the job description while keeping content believable and concise.`

export const DEFAULT_ADJUSTMENT_SYSTEM_PROMPT = `System: Apply precise edits to the resume according to the instructions. Keep all other content unchanged.`

const RESUME_SCHEMA_SNIPPET = `{
  "basics": {
    "name": "string",
    "headline": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "url": { "label": "string", "href": "string" },
    "profiles": [
      { "network": "string", "username": "string", "url": "string" }
    ]
  },
  "sections": {
    "summary": {
      "id": "summary",
      "name": "Professional Summary",
      "visible": true,
      "content": "<p>Short HTML summary.</p>"
    },
    "experience": {
      "id": "experience",
      "name": "Experience",
      "visible": true,
      "items": [
        {
          "id": "exp-1",
          "visible": true,
          "company": "string",
          "position": "string",
          "location": "string",
          "date": "string",
          "summary": "<ul><li>HTML bullet</li></ul>"
        }
      ]
    },
    "projects": {
      "id": "projects",
      "name": "Projects",
      "visible": false,
      "items": []
    },
    "skills": {
      "id": "skills",
      "name": "Skills",
      "visible": true,
      "items": [
        {
          "id": "skill-1",
          "visible": true,
          "name": "string",
          "keywords": ["string"]
        }
      ]
    },
    "education": {
      "id": "education",
      "name": "Education",
      "visible": true,
      "items": [
        {
          "id": "edu-1",
          "visible": true,
          "institution": "string",
          "studyType": "string",
          "date": "string",
          "location": "string",
          "score": "string",
          "summary": "string"
        }
      ]
    }
  }
}`

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

export const buildCoverLetterPrompt = (resumeData: ResumeData, jobDescription: string) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return `
    You are an expert career coach and professional resume writer.
    Your task is to write a compelling, professional, and SUCCINCT cover letter based on the provided resume and job description.

    Current Date: ${currentDate}

    RESUME DATA:
    ${JSON.stringify(resumeData, null, 2)}

    JOB DESCRIPTION:
    ${jobDescription}

    INSTRUCTIONS:
    1.  **Header**: Include a standard professional header with the candidate's contact info (from resume) and the current date (${currentDate}).
    2.  **Salutation**: Use a professional salutation. If a hiring manager's name is found in the job description, use it; otherwise, use "Dear Hiring Manager".
    3.  **Opening**: Write a strong opening paragraph that hooks the reader and states the position applied for.
    4.  **Body**: Write 1-2 short, punchy paragraphs connecting the candidate's specific skills/experiences (from resume) to the key requirements (from job description). Do NOT simply summarize the resume. Focus on value add.
    5.  **Closing**: A brief closing paragraph expressing enthusiasm and requesting an interview.
    6.  **Sign-off**: Professional sign-off (e.g., "Sincerely,") followed by the candidate's name.
    7.  **Tone**: Professional, confident, and enthusiastic.
    8.  **Length**: Keep it succinct. No more than 300-400 words. Avoid fluff and filler sentences.
    9.  **Format**: Return ONLY the plain text of the cover letter. Do not include markdown formatting or explanations.
  `
}
