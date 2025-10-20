import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { validateResumeJSON, isValidResumeData, ResumeData } from '@/lib/resume-types'

const baseResume: ResumeData = {
  basics: {
    name: 'Taylor Stone',
    email: 'taylor@example.com',
    headline: 'Product Manager'
  },
  sections: {
    summary: {
      name: 'Summary',
      visible: true,
      id: 'summary',
      content: 'Driving customer outcomes through thoughtful product strategy.'
    },
    experience: {
      name: 'Experience',
      visible: true,
      id: 'experience',
      items: [
        {
          id: 'exp-1',
          visible: true,
          position: 'Product Manager',
          company: 'Acme Inc.',
          date: '2022 – Present',
          summary: 'Shipped impactful features with cross-functional teams.'
        }
      ]
    }
  }
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

describe('validateResumeJSON', () => {
  it('accepts a valid resume structure', () => {
    const result = validateResumeJSON(clone(baseResume))
    assert.equal(result.isValid, true)
    assert.deepEqual(result.errors, [])
    assert.equal(isValidResumeData(baseResume), true)
  })

  it('flags missing basics information', () => {
    const invalidResume = clone(baseResume)
    // @ts-expect-error intentionally invalid for test coverage
    delete invalidResume.basics.name

    const result = validateResumeJSON(invalidResume)
    assert.equal(result.isValid, false)
    assert.ok(
      result.errors.includes('basics.name is required.'),
      'includes required field error for basics.name'
    )
    assert.equal(isValidResumeData(invalidResume), false)
  })

  it('reports structural issues for experience items', () => {
    const invalidResume = clone(baseResume)
    invalidResume.sections.experience!.items[0].position = ''

    const result = validateResumeJSON(invalidResume)
    assert.equal(result.isValid, false)
    assert.ok(
      result.errors.some((error) => error.includes('sections.experience.items[0].position')),
      'includes experience position validation error'
    )
  })
})
