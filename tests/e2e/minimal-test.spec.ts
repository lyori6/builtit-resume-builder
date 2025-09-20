import { test, expect } from '@playwright/test';

test('minimal loading investigation', async ({ page }) => {
  // Set up console log capture
  const logs: string[] = [];
  page.on('console', msg => {
    logs.push(`${msg.type()}: ${msg.text()}`);
  });

  // Navigate and wait
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(8000); // Wait 8 seconds

  // Check loading state
  const isLoading = await page.getByText('Loading resume...').isVisible();
  console.log('Still loading after 8 seconds:', isLoading);

  // Take screenshot
  await page.screenshot({ path: 'minimal-test-result.png' });

  // Print logs
  console.log('Console logs:', logs);

  // Simple assertion
  expect(isLoading).toBe(false);
});