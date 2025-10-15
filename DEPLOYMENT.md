# Deployment Guide

## Vercel Deployment Configuration

### Environment Variables

The application requires a Gemini API key to function properly. This key should be set as an environment variable in your deployment platform.

**Variable Name**: `GEMINI_API_KEY`
**Model Used**: Gemini 2.0 Flash Experimental (`gemini-2.0-flash-exp`)

### Setting up Environment Variables in Vercel

1. **Via Vercel Dashboard**:
   - Go to your project settings in Vercel dashboard
   - Navigate to "Environment Variables" section  
   - Add new environment variable:
     - **Name**: `GEMINI_API_KEY`
     - **Value**: Your Gemini API key from Google AI Studio
     - **Environments**: Production, Preview, Development

2. **Via Vercel CLI**:
   ```bash
   vercel env add GEMINI_API_KEY
   # Enter your API key when prompted
   ```

### Local Development

For local development, the API key is already configured in `.env.local`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

**Note**: The `.env.local` file is gitignored and should not be committed to the repository.

### API Usage

The optimization feature uses the Gemini 2.0 Flash model for:
- Analyzing job descriptions and personal notes
- Making subtle, natural improvements to resume content
- Preserving JSON structure and professional formatting
- Avoiding obvious keyword stuffing

### Deployment Checklist

- [x] Environment variable configured in Vercel
- [x] Build passes without errors (`npm run build`)
- [x] API endpoint returns proper responses
- [x] UI handles loading states and errors correctly
- [x] End-to-end tests pass (`npx playwright test`)

### Testing in Production

After deployment, verify:
1. Resume paste functionality works (primary method)
2. Current resume loads from dropdown selector
3. Job description input appears when resume is loaded
4. Optimization button enables with valid input
5. Loading state shows "Optimizing..." for ~2-3 seconds
6. Success message appears only after completion
7. API returns optimized resume with personalized improvements
8. PDF generation works with optimized content

### Resume Files Structure

The application now uses a simplified resume structure:
- **`/resumes/current.json`** – Fictional sample resume bundled for demo purposes
- **Primary workflow** – Users paste custom JSON resumes for optimization or convert plain text via Gemini

### API Rate Limits and Costs

- Gemini 2.5 Pro has usage-based pricing
- Monitor API usage through Google Cloud Console
- Consider implementing rate limiting for production use
- Current implementation has basic error handling for API failures

### Troubleshooting

**Common Issues**:
- **"API key not configured"**: Check environment variable is set correctly
- **Optimization timeout**: Gemini API can take 10-30 seconds for complex resumes
- **Invalid JSON response**: API occasionally returns non-JSON content; handled with error fallback
- **Build failures**: Ensure all dependencies are installed with `npm install`

**Debug Tools**:
- Check Vercel function logs in dashboard
- Use browser developer tools for client-side debugging
- Test API endpoint directly with curl or Postman
