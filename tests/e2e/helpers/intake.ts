import { expect, Page } from '@playwright/test'

export const JSON_TEXTAREA_SELECTOR = '[data-testid="json-textarea"]'
export const LOAD_RESUME_BUTTON_TEST_ID = 'load-resume-button'

export const ensureJsonTextareaVisible = async (page: Page) => {
  const decisionButton = page.getByTestId('intake-option-json')
  if ((await decisionButton.count()) > 0) {
    await expect(decisionButton).toBeVisible({ timeout: 10000 })
    await decisionButton.click()
  }

  const panelToggle = page.getByTestId('json-panel-toggle')
  if ((await panelToggle.count()) > 0) {
    await expect(panelToggle).toBeVisible({ timeout: 10000 })
    const expanded = await panelToggle.getAttribute('aria-expanded')
    if (expanded === 'false' || expanded === null) {
      await panelToggle.click()
    }
  }

  const textarea = page.locator(JSON_TEXTAREA_SELECTOR)
  if (!(await textarea.isVisible())) {
    const tabToggle = page.getByTestId('intake-toggle-json')
    if ((await tabToggle.count()) > 0) {
      await expect(tabToggle).toBeVisible({ timeout: 10000 })
      await tabToggle.click()
    }
  }

  await expect(page.locator(JSON_TEXTAREA_SELECTOR)).toBeVisible({ timeout: 10000 })
  return page.locator(JSON_TEXTAREA_SELECTOR)
}
