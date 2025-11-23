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
  items: Array<Record<string, unknown>>
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
  [key: string]: any
}

export interface ResumeData {
  basics: ResumeBasics
  sections: ResumeSections
}

export function normalizeResumeJSON<T extends { sections?: unknown }>(json: T): T {
  if (!json || typeof json !== 'object') {
    return json
  }

  const clone: T = JSON.parse(JSON.stringify(json))

  const coerceUrlValue = (value: unknown) => {
    if (!value) return undefined
    if (typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>
    }
    if (typeof value === 'string') {
      const trimmed = value.trim()
      return trimmed.length > 0 ? { href: trimmed } : undefined
    }
    if (Array.isArray(value)) {
      const firstString = value.find((entry) => typeof entry === 'string' && entry.trim().length > 0)
      return typeof firstString === 'string' ? { href: firstString.trim() } : undefined
    }
    return undefined
  }

  if (clone.sections && typeof clone.sections === 'object' && !Array.isArray(clone.sections)) {
    Object.entries(clone.sections as Record<string, unknown>).forEach(([sectionKey, sectionValue]) => {
      if (
        sectionValue &&
        typeof sectionValue === 'object' &&
        !Array.isArray(sectionValue) &&
        !('name' in sectionValue)
      ) {
        const nestedValues = Object.values(sectionValue as Record<string, unknown>)
        if (nestedValues.length === 1 && typeof nestedValues[0] === 'object' && nestedValues[0] !== null) {
          clone.sections[sectionKey] = nestedValues[0]
        }
      }
    })

    const sectionsRecord = clone.sections as Record<string, unknown>
    const experienceSection = sectionsRecord.experience as Record<string, unknown> | undefined
    if (experienceSection) {
      const items = experienceSection.items
      if (Array.isArray(items)) {
        const normalized = items.map((item) => {
          if (!item || typeof item !== 'object') {
            return item
          }
          const record = { ...(item as Record<string, unknown>) }
          if ('url' in record) {
            const coerced = coerceUrlValue(record.url)
            if (coerced) {
              record.url = coerced
            } else {
              delete record.url
            }
          }
          return record
        })
          ; (experienceSection as Record<string, unknown>).items = normalized
      }
    }

    const projectsSection = sectionsRecord.projects as Record<string, unknown> | undefined
    if (projectsSection) {
      const items = projectsSection.items
      if (Array.isArray(items)) {
        const normalizedItems = items.reduce<unknown[]>((acc, item) => {
          if (!item || typeof item !== 'object') {
            return acc
          }

          const record = { ...(item as Record<string, unknown>) }
          let name = typeof record.name === 'string' ? record.name.trim() : ''

          const candidateFields = ['title', 'project', 'projectName']
          for (const field of candidateFields) {
            if (!name && typeof record[field] === 'string') {
              name = (record[field] as string).trim()
            }
          }

          const stripHtml = (value: string) =>
            value
              .replace(/<[^>]*>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()

          if (!name && typeof record.summary === 'string') {
            const stripped = stripHtml(record.summary)
            if (stripped) {
              name = stripped.slice(0, 80)
            }
          }

          if (!name && typeof record.description === 'string') {
            const stripped = stripHtml(record.description)
            if (stripped) {
              name = stripped.slice(0, 80)
            }
          }

          if (!name && Array.isArray(record.keywords) && record.keywords.length > 0) {
            const firstKeyword = record.keywords.find(
              (keyword) => typeof keyword === 'string' && keyword.trim().length > 0
            )
            if (typeof firstKeyword === 'string') {
              name = `${firstKeyword.trim()} project`
            }
          }

          if (!name) {
            name = `Project ${acc.length + 1}`
          }

          record.name = name

          if (typeof record.id !== 'string' || record.id.trim() === '') {
            const slug = name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '')
            record.id = slug ? `proj-${slug}` : `proj-${acc.length + 1}`
          }

          if (typeof record.visible !== 'boolean') {
            record.visible = true
          }

          if ('url' in record) {
            const coerced = coerceUrlValue(record.url)
            if (coerced) {
              record.url = coerced
            } else {
              delete record.url
            }
          }

          acc.push(record)
          return acc
        }, [])

          ; (projectsSection as Record<string, unknown>).items = normalizedItems

        if (normalizedItems.length === 0) {
          (projectsSection as Record<string, unknown>).visible = false
        }
      }
    }
  }

  return clone
}

// Validation function
export function validateResumeJSON(json: unknown): { isValid: boolean; errors: string[] } {
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
    Object.entries(sections as Record<string, unknown>).forEach(([key, value]) => {
      if (!isObject(value)) {
        errors.push(`sections.${key} must be an object.`)
        return
      }

      const section = value as Record<string, unknown>
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
        ensureStringField(section.content, `${sectionPath}.content`)
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
export function isValidResumeData(json: unknown): json is ResumeData {
  const validation = validateResumeJSON(json)
  return validation.isValid
}

export const cloneResumeData = (data: ResumeData): ResumeData =>
  JSON.parse(JSON.stringify(data)) as ResumeData
