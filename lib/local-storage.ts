const STORAGE_KEY = 'builtit:resume-builder'
const STORAGE_VERSION = '1'

export type StoredData = {
  version: string
  geminiApiKey?: string
  resumes?: Record<string, string>
  prompts?: {
    systemPrompt?: string
    adjustmentPrompt?: string
    conversionPrompt?: string
  }
  onboardingCompleted?: boolean
  resumeState?: {
    originalText?: string
    optimizedText?: string
    optimizedJson?: string
    workspaceJson?: string
    loadedSource?: {
      type: 'none' | 'custom' | 'example'
      id: string | null
    }
  }
  jobState?: {
    text?: string
    lastUpdated?: string
  }
  optimizationMetadata?: string
}

const defaultData: StoredData = {
  version: STORAGE_VERSION
}

const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

const readStorage = (): StoredData => {
  if (!isBrowser()) return { ...defaultData }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return { ...defaultData }
  }

  try {
    const parsed = JSON.parse(raw) as StoredData
    if (!parsed.version || parsed.version !== STORAGE_VERSION) {
      return { ...defaultData }
    }
    return {
      ...defaultData,
      ...parsed,
      version: STORAGE_VERSION
    }
  } catch (error) {
    console.warn('Local storage parse error, resetting store:', error)
    return { ...defaultData }
  }
}

const writeStorage = (data: StoredData) => {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...defaultData,
        ...data,
        version: STORAGE_VERSION
      })
    )
  } catch (error) {
    console.error('Failed to write to local storage:', error)
  }
}

const maskEmptyObject = <T extends Record<string, unknown> | undefined>(value: T) =>
  value && Object.keys(value).length === 0 ? undefined : value

export const storage = {
  read(): StoredData {
    return readStorage()
  },

  write(partial: Partial<StoredData>) {
    const current = readStorage()
    writeStorage({
      ...current,
      ...partial,
      version: STORAGE_VERSION
    })
  },

  clear() {
    if (!isBrowser()) return
    writeStorage({ ...defaultData })
  },

  getGeminiApiKey(): string | null {
    const data = readStorage()
    return data.geminiApiKey ?? null
  },

  saveGeminiApiKey(apiKey: string) {
    const data = readStorage()
    writeStorage({
      ...data,
      geminiApiKey: apiKey
    })
  },

  removeGeminiApiKey() {
    const data = readStorage()
    const nextData = { ...data }
    delete nextData.geminiApiKey
    writeStorage(nextData)
  },

  getResume(id: string): string | null {
    const data = readStorage()
    return data.resumes?.[id] ?? null
  },

  saveResume(id: string, resumeJSON: string) {
    const data = readStorage()
    const resumes = { ...(data.resumes ?? {}) }
    resumes[id] = resumeJSON
    writeStorage({
      ...data,
      resumes
    })
  },

  getResumes(): Record<string, string> {
    const data = readStorage()
    return data.resumes ?? {}
  },

  removeResume(id: string) {
    const data = readStorage()
    if (!data.resumes) return
    const resumes = { ...data.resumes }
    delete resumes[id]
    writeStorage({
      ...data,
      resumes: maskEmptyObject(resumes)
    })
  },

  getPrompts() {
    const data = readStorage()
    return data.prompts ?? {}
  },

  savePrompts(prompts: StoredData['prompts']) {
    const data = readStorage()
    writeStorage({
      ...data,
      prompts: {
        ...(data.prompts ?? {}),
        ...(prompts ?? {})
      }
    })
  },

  getResumeState(): StoredData['resumeState'] {
    const data = readStorage()
    return data.resumeState ?? {}
  },

  saveResumeState(resumeState: StoredData['resumeState']) {
    const data = readStorage()
    writeStorage({
      ...data,
      resumeState: maskEmptyObject({
        ...(data.resumeState ?? {}),
        ...(resumeState ?? {})
      })
    })
  },

  getJobState(): StoredData['jobState'] {
    const data = readStorage()
    return data.jobState ?? {}
  },

  saveJobState(jobState: StoredData['jobState']) {
    const data = readStorage()
    writeStorage({
      ...data,
      jobState: maskEmptyObject({
        ...(data.jobState ?? {}),
        ...(jobState ?? {})
      })
    })
  },

  getOptimizationMetadata(): string | undefined {
    const data = readStorage()
    return data.optimizationMetadata
  },

  saveOptimizationMetadata(metadata: string | null) {
    const data = readStorage()
    const nextData = { ...data }
    if (metadata) {
      nextData.optimizationMetadata = metadata
    } else {
      delete nextData.optimizationMetadata
    }
    writeStorage(nextData)
  },

  isOnboardingCompleted(): boolean {
    const data = readStorage()
    return data.onboardingCompleted === true
  },

  setOnboardingCompleted() {
    const data = readStorage()
    writeStorage({
      ...data,
      onboardingCompleted: true
    })
  }
}
