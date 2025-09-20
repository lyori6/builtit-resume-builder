import { test, expect } from '@playwright/test';

test.describe('Debug Loading Issue', () => {

  test('investigate loading state on localhost:3002', async ({ page }) => {
    // Override the base URL to use port 3002 as specified
    await page.goto('http://localhost:3002');

    // Take initial screenshot
    await page.screenshot({ path: 'initial-load.png', fullPage: true });

    // Check the page title
    const title = await page.title();
    console.log('Page title:', title);

    // Wait a bit to see if anything loads
    await page.waitForTimeout(3000);

    // Check if we're stuck on "Loading resume..."
    const loadingText = page.getByText('Loading resume...');
    const isLoading = await loadingText.isVisible();
    console.log('Is "Loading resume..." visible?', isLoading);

    if (isLoading) {
      console.log('❌ CONFIRMED: App is stuck on "Loading resume..."');
    }

    // Check for expected elements that should be visible
    const expectedElements = [
      'Paste Resume JSON',
      'AI Resume Optimization',
      'Final Adjustments'
    ];

    for (const elementText of expectedElements) {
      const element = page.getByText(elementText);
      const isVisible = await element.isVisible();
      console.log(`Is "${elementText}" visible?`, isVisible);
    }

    // Check for resume dropdown/selector
    const resumeSelector = page.locator('select');
    const hasSelectorVisible = await resumeSelector.isVisible();
    console.log('Is resume selector visible?', hasSelectorVisible);

    if (hasSelectorVisible) {
      const options = await resumeSelector.locator('option').allTextContents();
      console.log('Resume selector options:', options);
    }

    // Check for any error elements
    const errorTexts = [
      'Error loading resume',
      'Failed to load',
      'Invalid JSON',
      'Network error'
    ];

    for (const errorText of errorTexts) {
      const errorElement = page.getByText(errorText);
      const hasError = await errorElement.isVisible();
      if (hasError) {
        console.log(`❌ Found error: "${errorText}"`);
      }
    }

    // Check console logs and errors
    const logs: string[] = [];
    const errors: string[] = [];

    page.on('console', msg => {
      logs.push(`${msg.type()}: ${msg.text()}`);
    });

    page.on('pageerror', error => {
      errors.push(`Page Error: ${error.message}`);
    });

    // Reload page to capture console messages from fresh load
    await page.reload();
    await page.waitForTimeout(5000); // Wait for any async operations

    // Take screenshot after reload
    await page.screenshot({ path: 'after-reload.png', fullPage: true });

    // Print console logs
    console.log('\n📄 Console Logs:');
    logs.forEach(log => console.log('  ', log));

    // Print any errors
    if (errors.length > 0) {
      console.log('\n❌ Page Errors:');
      errors.forEach(error => console.log('  ', error));
    } else {
      console.log('\n✅ No page errors detected');
    }

    // Check network requests
    const networkRequests: string[] = [];
    const failedRequests: string[] = [];

    page.on('request', request => {
      networkRequests.push(`${request.method()} ${request.url()}`);
    });

    page.on('requestfailed', request => {
      failedRequests.push(`FAILED: ${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
    });

    // Reload again to capture network activity
    await page.reload();
    await page.waitForTimeout(3000);

    console.log('\n🌐 Network Requests:');
    networkRequests.slice(-10).forEach(req => console.log('  ', req)); // Show last 10 requests

    if (failedRequests.length > 0) {
      console.log('\n❌ Failed Network Requests:');
      failedRequests.forEach(req => console.log('  ', req));
    }

    // Check for any loading indicators or spinners
    const loadingIndicators = [
      '[data-testid="loading"]',
      '.loading',
      '.spinner',
      '[aria-label*="loading"]',
      '[aria-label*="Loading"]'
    ];

    for (const selector of loadingIndicators) {
      const element = page.locator(selector);
      const isVisible = await element.isVisible();
      if (isVisible) {
        console.log(`Found loading indicator: ${selector}`);
      }
    }

    // Take final screenshot
    await page.screenshot({ path: 'final-state.png', fullPage: true });

    // Final status check
    const isStillLoading = await page.getByText('Loading resume...').isVisible();
    const isPasteVisible = await page.getByText('Paste Resume JSON').isVisible();
    const isAIVisible = await page.getByText('AI Resume Optimization').isVisible();

    console.log('\n📊 Final Status:');
    console.log('  Loading message visible:', isStillLoading);
    console.log('  Paste section visible:', isPasteVisible);
    console.log('  AI section visible:', isAIVisible);

    if (isStillLoading && !isPasteVisible && !isAIVisible) {
      console.log('🔍 ISSUE CONFIRMED: App is stuck in loading state');
    } else if (isPasteVisible && isAIVisible) {
      console.log('✅ App appears to be working correctly');
    } else {
      console.log('🤔 Mixed results - partial loading detected');
    }
  });

  test('check if localhost:3002 is accessible', async ({ page }) => {
    try {
      const response = await page.goto('http://localhost:3002', {
        waitUntil: 'networkidle',
        timeout: 10000
      });

      if (response) {
        console.log('Response status:', response.status());
        console.log('Response URL:', response.url());
      }

      const html = await page.content();
      console.log('Page HTML length:', html.length);
      console.log('Page contains "Loading resume...":', html.includes('Loading resume...'));
      console.log('Page contains "Resume Generator":', html.includes('Resume Generator'));

    } catch (error) {
      console.log('❌ Failed to load page:', error);
    }
  });

});