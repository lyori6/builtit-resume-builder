import { promises as fs } from 'fs'
import path from 'path'

export interface ResumeOption {
  id: string
  name: string
  filename: string
}

export async function getAvailableResumes(): Promise<ResumeOption[]> {
  try {
    const resumesDir = path.join(process.cwd(), 'resumes')
    const files = await fs.readdir(resumesDir)
    
    const jsonFiles = files.filter(file => file.endsWith('.json'))
    
    return jsonFiles.map(filename => ({
      id: filename.replace('.json', ''),
      name: formatResumeName(filename.replace('.json', '')),
      filename
    }))
  } catch (error) {
    console.error('Error reading resumes directory:', error)
    return []
  }
}

export async function getResumeData(filename: string) {
  try {
    const resumePath = path.join(process.cwd(), 'resumes', filename)
    const data = await fs.readFile(resumePath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading resume file:', error)
    return null
  }
}

function formatResumeName(id: string): string {
  // Convert filename to display name
  return id
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
