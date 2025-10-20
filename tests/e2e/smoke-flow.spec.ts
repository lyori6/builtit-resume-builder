import { test, expect } from '@playwright/test'
import { ensureJsonTextareaVisible, LOAD_RESUME_BUTTON_TEST_ID } from './helpers/intake'

const SAMPLE_RESUME = {
  basics: {
    name: 'Smoke Tester',
    email: 'smoke@example.com'
  },
  sections: {
    summary: {
      name: 'Summary',
      visible: true,
      id: 'summary',
      content: 'Quick smoke validation resume.'
    }
  }
}

test.describe('Smoke flow', () => {
  test('launch, load JSON intake, display workspace', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'builtit:resume-builder',
        JSON.stringify({
          version: '1',
          onboardingCompleted: true,
          geminiApiKey: 'test-key'
        })
      )
    })

    await page.goto('/')
    await expect(page.getByText('How do you want to get started?')).toBeVisible()

    const textarea = await ensureJsonTextareaVisible(page)
    await expect(textarea).toBeVisible()

    await textarea.fill(JSON.stringify(SAMPLE_RESUME, null, 2))
    await page.getByTestId(LOAD_RESUME_BUTTON_TEST_ID).click()

    await expect(page.getByText('AI Resume Optimization')).toBeVisible()
    await expect(page.getByText('Final Adjustments')).toBeVisible()
  })
})
