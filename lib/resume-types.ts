// TypeScript interfaces for resume JSON validation

export interface ResumeBasics {
  name: string
  headline?: string
  email: string
  phone?: string
  location?: string
  url?: {
    label?: string
    href?: string
  }
  customFields?: Array<{
    id: string
    icon?: string
    name: string
    value: string
  }>
  profiles?: Array<{
    network: string
    username?: string
    url: string
  }>
  picture?: {
    url?: string
    size?: number
    aspectRatio?: number
    borderRadius?: number
    effects?: {
      hidden?: boolean
      border?: boolean
      grayscale?: boolean
    }
  }
}

export interface SectionBase {
  name: string
  columns?: number
  separateLinks?: boolean
  visible: boolean
  id: string
}

export interface SummarySection extends SectionBase {
  content: string
}

export interface ExperienceItem {
  id: string
  visible: boolean
  company?: string
  position: string
  location?: string
  date: string
  summary?: string
  url?: {
    label?: string
    href?: string
  }
}

export interface ExperienceSection extends SectionBase {
  items: ExperienceItem[]
}

export interface ProjectItem {
  id: string
  visible: boolean
  name: string
  description?: string
  date?: string
  summary?: string
  keywords?: string[]
  url?: {
    label?: string
    href?: string
  }
}

export interface ProjectsSection extends SectionBase {
  items: ProjectItem[]
}

export interface SkillItem {
  id?: string
  visible?: boolean
  name: string
  keywords?: string[]
  level?: string
}

export interface SkillsSection extends SectionBase {
  items: SkillItem[]
}

export interface EducationItem {
  id: string
  visible: boolean
  institution: string
  studyType?: string
  date?: string
  location?: string
  score?: string
  summary?: string
}

export interface EducationSection extends SectionBase {
  items: EducationItem[]
}

export interface GenericSection extends SectionBase {
  items: any[]
}

export interface ResumeSections {
  summary?: SummarySection
  experience?: ExperienceSection
  projects?: ProjectsSection
  skills?: SkillsSection
  education?: EducationSection
  awards?: GenericSection
  certifications?: GenericSection
  volunteer?: GenericSection
  interests?: GenericSection
  languages?: GenericSection
  profiles?: GenericSection
  [key: string]: SectionBase | undefined
}

export interface ResumeData {
  basics: ResumeBasics
  sections: ResumeSections
}

// Validation function
export function validateResumeJSON(json: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check if it's an object
  if (!json || typeof json !== 'object') {
    errors.push('Resume must be a valid JSON object')
    return { isValid: false, errors }
  }

  // Check required top-level fields
  if (!json.basics) {
    errors.push('Missing required field: basics')
  } else {
    // Check required basics fields
    if (!json.basics.name) errors.push('Missing required field: basics.name')
    if (!json.basics.email) errors.push('Missing required field: basics.email')
  }

  if (!json.sections) {
    errors.push('Missing required field: sections')
  } else {
    // Validate sections structure
    const sections = json.sections
    
    // Check if sections is an object
    if (typeof sections !== 'object') {
      errors.push('sections must be an object')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Type guard
export function isValidResumeData(json: any): json is ResumeData {
  const validation = validateResumeJSON(json)
  return validation.isValid
}