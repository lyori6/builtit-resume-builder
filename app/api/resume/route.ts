import { NextRequest, NextResponse } from 'next/server'
import { getAvailableResumes, getResumeData } from '@/lib/resume-utils'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const filename = searchParams.get('filename')
  
  if (filename) {
    // Get specific resume data
    const resumeData = await getResumeData(filename)
    if (!resumeData) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
    }
    return NextResponse.json(resumeData)
  } else {
    // Get list of available resumes
    const resumes = await getAvailableResumes()
    return NextResponse.json(resumes)
  }
}
