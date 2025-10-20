import { beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'

type MockStore = Map<string, string>

const createMockLocalStorage = () => {
  const store: MockStore = new Map()

  return {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null
    },
    setItem(key: string, value: string) {
      store.set(key, value)
    },
    removeItem(key: string) {
      store.delete(key)
    },
    clear() {
      store.clear()
    }
  }
}

const installWindow = () => {
  const localStorage = createMockLocalStorage()
  ;(globalThis as any).window = { localStorage }
  return localStorage
}

let storageModule: typeof import('@/lib/local-storage') | undefined
let storageApi: typeof import('@/lib/local-storage').storage
let localStorageMock: ReturnType<typeof createMockLocalStorage>

beforeEach(async () => {
  localStorageMock = installWindow()
  if (!storageModule) {
    storageModule = await import('@/lib/local-storage')
  }
  storageApi = storageModule.storage
  localStorageMock.clear()
})

describe('local storage helpers', () => {
  it('stores and retrieves the Gemini API key', () => {
    storageApi.saveGeminiApiKey('demo-key')
    assert.equal(storageApi.getGeminiApiKey(), 'demo-key')

    storageApi.removeGeminiApiKey()
    assert.equal(storageApi.getGeminiApiKey(), null)
  })

  it('persists custom resumes and manages removal', () => {
    const resumeJSON = JSON.stringify({ basics: { name: 'Taylor Stone', email: 'taylor@example.com' } })
    storageApi.saveResume('custom', resumeJSON)

    assert.equal(storageApi.getResume('custom'), resumeJSON)
    assert.deepEqual(storageApi.getResumes(), { custom: resumeJSON })

    storageApi.removeResume('custom')
    assert.equal(storageApi.getResume('custom'), null)
  })

  it('stores prompt overrides independently', () => {
    storageApi.savePrompts({
      systemPrompt: 'Optimize for product roles',
      adjustmentPrompt: 'Shorten scope',
      conversionPrompt: 'Use markup'
    })

    const savedPrompts = storageApi.getPrompts()
    assert.equal(savedPrompts.systemPrompt, 'Optimize for product roles')
    assert.equal(savedPrompts.adjustmentPrompt, 'Shorten scope')
    assert.equal(savedPrompts.conversionPrompt, 'Use markup')
  })
})
