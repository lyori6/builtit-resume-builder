import { test, expect } from '@playwright/test';

test('final verification of working resume app', async ({ page }) => {
  console.log('🔍 Final verification test...');

  // Navigate to the working app
  await page.goto('http://localhost:3000');

  // Wait for page to load
  await page.waitForTimeout(5000);

  // Take screenshot
  await page.screenshot({ path: 'working-app-screenshot.png', fullPage: true });
  console.log('📸 Screenshot saved as working-app-screenshot.png');

  // Verify app loaded correctly
  const loadingVisible = await page.getByText('Loading resume...').isVisible();
  const pasteVisible = await page.getByText('Paste Resume JSON').isVisible();
  const aiVisible = await page.getByText('AI Resume Optimization').isVisible();
  const finalAdjustmentsVisible = await page.getByText('Final Adjustments').isVisible();

  console.log('📊 App State:');
  console.log('  Loading message visible:', loadingVisible);
  console.log('  Paste Resume JSON visible:', pasteVisible);
  console.log('  AI Resume Optimization visible:', aiVisible);
  console.log('  Final Adjustments visible:', finalAdjustmentsVisible);

  // Check if resume selector is visible
  const resumeSelector = page.locator('select');
  const hasSelectorVisible = await resumeSelector.isVisible();
  console.log('  Resume selector visible:', hasSelectorVisible);

  if (hasSelectorVisible) {
    const options = await resumeSelector.locator('option').allTextContents();
    console.log('  Resume options:', options);
  }

  // Verify that the resume content is displayed
  const resumeTitle = await page.getByRole('heading', { name: /Lyor.*Itzhaki/ }).isVisible();
  console.log('  Resume title visible:', resumeTitle);

  // Final assertions
  expect(loadingVisible).toBe(false);
  expect(pasteVisible).toBe(true);
  expect(aiVisible).toBe(true);
  expect(finalAdjustmentsVisible).toBe(true);

  console.log('✅ App is working correctly!');
});