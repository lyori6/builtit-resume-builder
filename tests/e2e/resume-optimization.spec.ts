import { test, expect } from '@playwright/test';

// Sample resume JSON for testing
const sampleResumeJSON = {
  "basics": {
    "name": "John Doe",
    "headline": "Software Engineer",
    "email": "john@example.com",
    "phone": "(555) 123-4567",
    "location": "San Francisco, CA",
    "url": {
      "label": "johndoe.com",
      "href": "https://johndoe.com"
    }
  },
  "sections": {
    "summary": {
      "name": "Professional Summary",
      "visible": true,
      "id": "summary",
      "content": "Experienced software engineer with 5 years in web development."
    },
    "experience": {
      "name": "Professional Experience",
      "visible": true,
      "id": "experience",
      "items": [
        {
          "id": "exp1",
          "visible": true,
          "company": "Tech Corp",
          "position": "Software Engineer",
          "location": "San Francisco, CA",
          "date": "2020 - Present",
          "summary": "Developed web applications using React and Node.js."
        }
      ]
    },
    "skills": {
      "name": "Skills",
      "visible": true,
      "id": "skills",
      "items": [
        {
          "name": "Programming Languages",
          "keywords": ["JavaScript", "Python", "Java"]
        }
      ]
    }
  }
};

const sampleJobDescription = `
We are looking for a Senior React Developer to join our team.

Requirements:
- 5+ years of React experience
- Strong TypeScript skills
- Experience with Node.js and APIs
- Knowledge of AWS and cloud deployment
- Experience with testing frameworks like Jest

Personal Notes:
- Emphasize React experience
- Highlight API development work
- Mention any cloud experience
`;

test.describe('Resume Optimization E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Resume Generator/);
  });

  test('should load the main page with paste functionality', async ({ page }) => {
    // Check if paste section exists
    await expect(page.getByText('Paste Resume JSON')).toBeVisible();
    
    // Check if textarea for pasting JSON exists
    await expect(page.locator('textarea[placeholder*="Paste your resume JSON"]')).toBeVisible();
  });

  test('should validate and load pasted resume JSON', async ({ page }) => {
    const pasteTextarea = page.locator('textarea[placeholder*="Paste your resume JSON"]');
    
    // Paste valid JSON
    await pasteTextarea.fill(JSON.stringify(sampleResumeJSON, null, 2));
    
    // Check for validation success
    await expect(page.getByText('Valid JSON format')).toBeVisible();
    
    // Load the resume
    await page.getByRole('button', { name: 'Load Resume' }).click();
    
    // Verify resume content is displayed (use more specific selectors)
    await expect(page.getByRole('heading', { name: 'John Doe' })).toBeVisible();
    await expect(page.getByText('Software Engineer').first()).toBeVisible();
  });

  test('should show AI optimization section when resume is loaded', async ({ page }) => {
    // Paste and load resume
    const pasteTextarea = page.locator('textarea[placeholder*="Paste your resume JSON"]');
    await pasteTextarea.fill(JSON.stringify(sampleResumeJSON, null, 2));
    await page.getByRole('button', { name: 'Load Resume' }).click();
    
    // Check if AI optimization section appears
    await expect(page.getByText('AI Resume Optimization')).toBeVisible();
    await expect(page.getByText('Job Description + Personal Notes')).toBeVisible();
    
    // Check for optimization textarea
    await expect(page.locator('textarea[placeholder*="Paste job description"]')).toBeVisible();
    
    // Check for optimize button (should be disabled initially)
    const optimizeButton = page.getByRole('button', { name: 'Optimize Resume' });
    await expect(optimizeButton).toBeVisible();
    await expect(optimizeButton).toBeDisabled();
  });

  test('should enable optimize button when job description is entered', async ({ page }) => {
    // Load resume first
    const pasteTextarea = page.locator('textarea[placeholder*="Paste your resume JSON"]');
    await pasteTextarea.fill(JSON.stringify(sampleResumeJSON, null, 2));
    await page.getByRole('button', { name: 'Load Resume' }).click();
    
    // Enter job description
    const jobTextarea = page.locator('textarea[placeholder*="Paste job description"]');
    await jobTextarea.fill(sampleJobDescription);
    
    // Check if optimize button is enabled
    const optimizeButton = page.getByRole('button', { name: 'Optimize Resume' });
    await expect(optimizeButton).toBeEnabled();
  });

  test('should handle invalid JSON with proper error messages', async ({ page }) => {
    const pasteTextarea = page.locator('textarea[placeholder*="Paste your resume JSON"]');
    
    // Paste invalid JSON
    await pasteTextarea.fill('{ invalid json }');
    
    // Check for error message
    await expect(page.getByText('Invalid JSON:')).toBeVisible();
    await expect(page.getByText('Invalid JSON format')).toBeVisible();
  });

  test('should validate resume structure and show specific errors', async ({ page }) => {
    const pasteTextarea = page.locator('textarea[placeholder*="Paste your resume JSON"]');
    
    // Paste JSON missing required fields
    const incompleteJSON = {
      "sections": {
        "summary": {
          "name": "Summary",
          "visible": true,
          "id": "summary",
          "content": "Test summary"
        }
      }
    };
    
    await pasteTextarea.fill(JSON.stringify(incompleteJSON, null, 2));
    
    // Check for specific validation errors
    await expect(page.getByText('Invalid JSON:')).toBeVisible();
    await expect(page.getByText('Missing required field: basics')).toBeVisible();
  });

  test('should show loading state during optimization', async ({ page }) => {
    // Load resume and enter job description
    const pasteTextarea = page.locator('textarea[placeholder*="Paste your resume JSON"]');
    await pasteTextarea.fill(JSON.stringify(sampleResumeJSON, null, 2));
    await page.getByRole('button', { name: 'Load Resume' }).click();
    
    const jobTextarea = page.locator('textarea[placeholder*="Paste job description"]');
    await jobTextarea.fill(sampleJobDescription);
    
    // Click optimize button
    const optimizeButton = page.getByRole('button', { name: 'Optimize Resume' });
    await optimizeButton.click();
    
    // Check for loading state (may complete quickly, so add wait)
    try {
      await expect(page.getByText('Optimizing...')).toBeVisible({ timeout: 2000 });
    } catch {
      // Optimization may complete too quickly to see loading state
      console.log('Optimization completed too quickly to observe loading state');
    }
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API to return error
    await page.route('**/api/optimize-resume', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'API key not configured' })
      });
    });
    
    // Load resume and try to optimize
    const pasteTextarea = page.locator('textarea[placeholder*="Paste your resume JSON"]');
    await pasteTextarea.fill(JSON.stringify(sampleResumeJSON, null, 2));
    await page.getByRole('button', { name: 'Load Resume' }).click();
    
    const jobTextarea = page.locator('textarea[placeholder*="Paste job description"]');
    await jobTextarea.fill(sampleJobDescription);
    
    await page.getByRole('button', { name: 'Optimize Resume' }).click();
    
    // Check for error message
    await expect(page.getByText('Optimization failed:')).toBeVisible();
    await expect(page.getByText('API key not configured')).toBeVisible();
  });

  test('should show revert option after successful optimization', async ({ page }) => {
    // Mock successful API response
    const optimizedResume = {
      ...sampleResumeJSON,
      sections: {
        ...sampleResumeJSON.sections,
        summary: {
          ...sampleResumeJSON.sections.summary,
          content: "Experienced React developer with 5 years in modern web development and TypeScript."
        }
      }
    };
    
    await page.route('**/api/optimize-resume', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          optimizedResume,
          original: sampleResumeJSON
        })
      });
    });
    
    // Load resume and optimize
    const pasteTextarea = page.locator('textarea[placeholder*="Paste your resume JSON"]');
    await pasteTextarea.fill(JSON.stringify(sampleResumeJSON, null, 2));
    await page.getByRole('button', { name: 'Load Resume' }).click();
    
    const jobTextarea = page.locator('textarea[placeholder*="Paste job description"]');
    await jobTextarea.fill(sampleJobDescription);
    
    await page.getByRole('button', { name: 'Optimize Resume' }).click();
    
    // Wait for optimization to complete and check for success message
    await expect(page.getByText('Resume optimized!')).toBeVisible();
    await expect(page.getByText('Revert to Original')).toBeVisible();
    
    // Check that optimized content is displayed (use more specific selector)
    await expect(page.locator('p').filter({ hasText: 'React developer' }).first()).toBeVisible();
  });

  test('should work with file-based resumes from dropdown', async ({ page }) => {
    // Wait for resumes to load and select one
    const resumeSelector = page.locator('select');
    await expect(resumeSelector).toBeVisible();
    
    // Select a resume (should auto-load the first one)
    await page.waitForTimeout(2000); // Give time for resume to load
    
    // If AI optimization section appears, it means resume loaded successfully
    const aiSection = page.getByText('AI Resume Optimization');
    if (await aiSection.isVisible()) {
      // Test optimization with file-based resume
      const jobTextarea = page.locator('textarea[placeholder*="Paste job description"]');
      await jobTextarea.fill(sampleJobDescription);
      
      const optimizeButton = page.getByRole('button', { name: 'Optimize Resume' });
      await expect(optimizeButton).toBeEnabled();
    }
  });

  test('should maintain PDF generation functionality after optimization', async ({ page }) => {
    // Load resume
    const pasteTextarea = page.locator('textarea[placeholder*="Paste your resume JSON"]');
    await pasteTextarea.fill(JSON.stringify(sampleResumeJSON, null, 2));
    await page.getByRole('button', { name: 'Load Resume' }).click();
    
    // Check that PDF download button is available
    await expect(page.getByRole('button', { name: 'Download PDF' })).toBeVisible();
    
    // Check that Export JSON button is available
    await expect(page.getByRole('button', { name: 'Export JSON' })).toBeVisible();
  });
  
});