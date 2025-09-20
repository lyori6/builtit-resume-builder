import { test, expect } from '@playwright/test';

test('debug loading issue on localhost:3002', async ({ page }) => {
  console.log('🔍 Starting debug test...');

  // Capture console logs and errors
  const logs: string[] = [];
  const errors: string[] = [];

  page.on('console', msg => {
    logs.push(`${msg.type()}: ${msg.text()}`);
  });

  page.on('pageerror', error => {
    errors.push(`Page Error: ${error.message}`);
  });

  // Navigate to the app
  console.log('📍 Navigating to http://localhost:3002...');
  await page.goto('http://localhost:3002', { timeout: 10000 });

  // Take initial screenshot
  await page.screenshot({ path: 'debug-loading-state.png', fullPage: true });
  console.log('📸 Screenshot saved as debug-loading-state.png');

  // Check if stuck on loading
  const loadingText = await page.getByText('Loading resume...').isVisible();
  console.log('❓ Is "Loading resume..." visible?', loadingText);

  if (loadingText) {
    console.log('❌ CONFIRMED: App is stuck on loading screen');
  }

  // Wait a bit longer to see if it loads
  console.log('⏳ Waiting 5 seconds to see if anything changes...');
  await page.waitForTimeout(5000);

  // Check again
  const stillLoading = await page.getByText('Loading resume...').isVisible();
  console.log('❓ Still loading after 5 seconds?', stillLoading);

  // Check for expected elements
  const pasteSection = await page.getByText('Paste Resume JSON').isVisible();
  const aiSection = await page.getByText('AI Resume Optimization').isVisible();

  console.log('📋 Paste Resume JSON visible?', pasteSection);
  console.log('🤖 AI Resume Optimization visible?', aiSection);

  // Print console logs
  console.log('\n📄 Console Logs (' + logs.length + ' total):');
  logs.forEach(log => console.log('  ', log));

  // Print any errors
  if (errors.length > 0) {
    console.log('\n❌ Page Errors (' + errors.length + ' total):');
    errors.forEach(error => console.log('  ', error));
  } else {
    console.log('\n✅ No page errors detected');
  }

  // Take final screenshot
  await page.screenshot({ path: 'debug-final-state.png', fullPage: true });
  console.log('📸 Final screenshot saved as debug-final-state.png');

  // Summary
  console.log('\n📊 SUMMARY:');
  console.log('  App stuck on loading:', stillLoading);
  console.log('  Expected sections visible:', pasteSection && aiSection);
  console.log('  Console errors:', errors.length > 0 ? 'YES' : 'NO');
});