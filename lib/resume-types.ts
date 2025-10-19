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

  const isObject = (value: unknown): value is Record<string, unknown> =>
    !!value && typeof value === 'object' && !Array.isArray(value)

  const ensureStringField = (
    value: unknown,
    path: string,
    options: { optional?: boolean; allowEmpty?: boolean } = {}
  ) => {
    const { optional = false, allowEmpty = false } = options
    if (value === undefined || value === null) {
      if (!optional) {
        errors.push(`${path} is required.`)
      }
      return
    }
    if (typeof value !== 'string') {
      errors.push(`${path} must be a string.`)
      return
    }
    if (!allowEmpty && value.trim() === '') {
      errors.push(`${path} cannot be empty.`)
    }
  }

  const ensureBooleanField = (
    value: unknown,
    path: string,
    options: { optional?: boolean } = {}
  ) => {
    const { optional = false } = options
    if (value === undefined || value === null) {
      if (!optional) {
        errors.push(`${path} is required.`)
      }
      return
    }
    if (typeof value !== 'boolean') {
      errors.push(`${path} must be a boolean.`)
    }
  }

  const ensureNumberField = (
    value: unknown,
    path: string,
    options: { optional?: boolean } = {}
  ) => {
    const { optional = false } = options
    if (value === undefined || value === null) {
      if (!optional) {
        errors.push(`${path} is required.`)
      }
      return
    }
    if (typeof value !== 'number') {
      errors.push(`${path} must be a number.`)
    }
  }

  const ensureArrayField = (
    value: unknown,
    path: string,
    options: { optional?: boolean } = {}
  ): unknown[] | null => {
    const { optional = false } = options
    if (value === undefined || value === null) {
      if (!optional) {
        errors.push(`${path} is required.`)
      }
      return null
    }
    if (!Array.isArray(value)) {
      errors.push(`${path} must be an array.`)
      return null
    }
    return value
  }

  const ensureArrayOfStrings = (
    value: unknown,
    path: string,
    options: { optional?: boolean; allowEmpty?: boolean } = {}
  ) => {
    const arr = ensureArrayField(value, path, options)
    if (!arr) return

    arr.forEach((entry, index) => {
      if (typeof entry !== 'string') {
        errors.push(`${path}[${index}] must be a string.`)
      } else if (!options.allowEmpty && entry.trim() === '') {
        errors.push(`${path}[${index}] cannot be empty.`)
      }
    })
  }

  const ensureUrlObject = (
    value: unknown,
    path: string,
    options: { optional?: boolean } = {}
  ) => {
    const { optional = false } = options
    if (value === undefined || value === null) {
      if (!optional) {
        errors.push(`${path} is required.`)
      }
      return
    }
    if (!isObject(value)) {
      errors.push(`${path} must be an object.`)
      return
    }
    if ('label' in value) {
      ensureStringField(value.label, `${path}.label`, { optional: true, allowEmpty: true })
    }
    if ('href' in value) {
      ensureStringField(value.href, `${path}.href`, { optional: true, allowEmpty: true })
    }
  }

  const ensureGenericItems = (items: unknown[], sectionKey: string) => {
    items.forEach((item, index) => {
      if (!isObject(item)) {
        errors.push(`sections.${sectionKey}.items[${index}] must be an object.`)
      }
    })
  }

  if (!isObject(json)) {
    errors.push('Resume must be a valid JSON object')
    return { isValid: false, errors }
  }

  const basics = json.basics
  if (!isObject(basics)) {
    errors.push('Missing or invalid field: basics')
  } else {
    ensureStringField(basics.name, 'basics.name')
    ensureStringField(basics.email, 'basics.email')
    ensureStringField(basics.headline, 'basics.headline', { optional: true, allowEmpty: true })
    ensureStringField(basics.phone, 'basics.phone', { optional: true, allowEmpty: true })
    ensureStringField(basics.location, 'basics.location', { optional: true, allowEmpty: true })

    if ('url' in basics) {
      ensureUrlObject(basics.url, 'basics.url', { optional: true })
    }

    if ('customFields' in basics) {
      const fields = ensureArrayField(basics.customFields, 'basics.customFields', { optional: true })
      fields?.forEach((field, index) => {
        if (!isObject(field)) {
          errors.push(`basics.customFields[${index}] must be an object.`)
          return
        }
        ensureStringField(field.id, `basics.customFields[${index}].id`)
        ensureStringField(field.name, `basics.customFields[${index}].name`)
        ensureStringField(field.value, `basics.customFields[${index}].value`)
        ensureStringField(field.icon, `basics.customFields[${index}].icon`, {
          optional: true,
          allowEmpty: true
        })
      })
    }

    if ('profiles' in basics) {
      const profiles = ensureArrayField(basics.profiles, 'basics.profiles', { optional: true })
      profiles?.forEach((profile, index) => {
        if (!isObject(profile)) {
          errors.push(`basics.profiles[${index}] must be an object.`)
          return
        }
        ensureStringField(profile.network, `basics.profiles[${index}].network`)
        ensureStringField(profile.url, `basics.profiles[${index}].url`)
        ensureStringField(profile.username, `basics.profiles[${index}].username`, {
          optional: true,
          allowEmpty: true
        })
      })
    }
  }

  const sections = json.sections
  if (!isObject(sections)) {
    errors.push('Missing or invalid field: sections')
  } else {
    Object.entries(sections).forEach(([key, value]) => {
      if (!isObject(value)) {
        errors.push(`sections.${key} must be an object.`)
        return
      }

      const section = value
      const sectionPath = `sections.${key}`

      ensureStringField(section.name, `${sectionPath}.name`)
      ensureBooleanField(section.visible, `${sectionPath}.visible`)
      ensureStringField(section.id, `${sectionPath}.id`)

      if ('columns' in section) {
        ensureNumberField(section.columns, `${sectionPath}.columns`, { optional: true })
      }
      if ('separateLinks' in section) {
        ensureBooleanField(section.separateLinks, `${sectionPath}.separateLinks`, { optional: true })
      }

      if (key === 'summary') {
        ensureStringField((section as SummarySection).content, `${sectionPath}.content`)
        return
      }

      const items = ensureArrayField(section.items, `${sectionPath}.items`, { optional: key === 'profiles' })
      if (!items) {
        return
      }

      switch (key) {
        case 'experience':
          items.forEach((item, index) => {
            if (!isObject(item)) {
              errors.push(`${sectionPath}.items[${index}] must be an object.`)
              return
            }
            const itemPath = `${sectionPath}.items[${index}]`
            ensureStringField(item.id, `${itemPath}.id`)
            ensureBooleanField(item.visible, `${itemPath}.visible`, { optional: true })
            ensureStringField(item.position, `${itemPath}.position`)
            ensureStringField(item.date, `${itemPath}.date`, { allowEmpty: true })
            ensureStringField(item.summary, `${itemPath}.summary`, { optional: true, allowEmpty: true })
            ensureStringField(item.company, `${itemPath}.company`, { optional: true, allowEmpty: true })
            ensureStringField(item.location, `${itemPath}.location`, { optional: true, allowEmpty: true })
            ensureUrlObject(item.url, `${itemPath}.url`, { optional: true })
          })
          break

        case 'projects':
          items.forEach((item, index) => {
            if (!isObject(item)) {
              errors.push(`${sectionPath}.items[${index}] must be an object.`)
              return
            }
            const itemPath = `${sectionPath}.items[${index}]`
            ensureStringField(item.id, `${itemPath}.id`)
            ensureBooleanField(item.visible, `${itemPath}.visible`, { optional: true })
            ensureStringField(item.name, `${itemPath}.name`)
            ensureStringField(item.description, `${itemPath}.description`, {
              optional: true,
              allowEmpty: true
            })
            ensureStringField(item.summary, `${itemPath}.summary`, { optional: true, allowEmpty: true })
            ensureStringField(item.date, `${itemPath}.date`, { optional: true, allowEmpty: true })
            ensureUrlObject(item.url, `${itemPath}.url`, { optional: true })
            ensureArrayOfStrings(item.keywords, `${itemPath}.keywords`, { optional: true, allowEmpty: true })
          })
          break

        case 'skills':
          items.forEach((item, index) => {
            if (!isObject(item)) {
              errors.push(`${sectionPath}.items[${index}] must be an object.`)
              return
            }
            const itemPath = `${sectionPath}.items[${index}]`
            ensureStringField(item.name, `${itemPath}.name`)
            ensureBooleanField(item.visible, `${itemPath}.visible`, { optional: true })
            ensureArrayOfStrings(item.keywords, `${itemPath}.keywords`, { optional: false })
          })
          break

        case 'education':
          items.forEach((item, index) => {
            if (!isObject(item)) {
              errors.push(`${sectionPath}.items[${index}] must be an object.`)
              return
            }
            const itemPath = `${sectionPath}.items[${index}]`
            ensureStringField(item.id, `${itemPath}.id`)
            ensureBooleanField(item.visible, `${itemPath}.visible`)
            ensureStringField(item.institution, `${itemPath}.institution`)
            ensureStringField(item.studyType, `${itemPath}.studyType`, { optional: true, allowEmpty: true })
            ensureStringField(item.date, `${itemPath}.date`, { optional: true, allowEmpty: true })
            ensureStringField(item.location, `${itemPath}.location`, { optional: true, allowEmpty: true })
            ensureStringField(item.score, `${itemPath}.score`, { optional: true, allowEmpty: true })
            ensureStringField(item.summary, `${itemPath}.summary`, { optional: true, allowEmpty: true })
            ensureUrlObject(item.url, `${itemPath}.url`, { optional: true })
          })
          break

        default:
          ensureGenericItems(items, key)
          break
      }
    })
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
