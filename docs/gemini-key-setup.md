# Gemini API Key Setup Guide

Follow these steps to connect your own Gemini API key to the resume builder. The key stays in your browser’s local storage and never leaves your device.

## 1. Create or Sign In to a Google Account
- Visit [AI Studio](https://aistudio.google.com).
- Sign in with the Google account you want to associate with Gemini usage.

## 2. Generate a Free Gemini API Key
1. Open the [API Keys](https://aistudio.google.com/app/apikey) page.
2. Click **Create API key** (or **Create new key** if you already have one).
3. Copy the key that is generated. You can always return to AI Studio to view or revoke keys.

## 3. Add the Key in the Resume Builder
1. Open the app and locate the **Connect your Gemini API key** card at the top of the dashboard.
2. Paste the key into the input field and click **Save key**.
3. The app will validate the key with Gemini. On success you’ll see a confirmation message, and optimization features will unlock.

### Key Storage & Security
- Keys are stored in `localStorage` under the `builtit:resume-builder` namespace.
- The server never sees your key; all AI requests include the key directly from your browser.
- You can delete the key at any time via the **Delete saved key** button in the app or by clearing browser storage.
- To revoke the key globally, return to the [AI Studio API keys](https://aistudio.google.com/app/apikey) page and delete it.

## 4. Troubleshooting
- **Invalid or unauthorized key**: Ensure the key hasn’t been revoked and that you copied it without extra spaces.
- **Quota or rate limit**: Gemini Free tier has daily usage limits. Retry later or generate a new key if necessary.
- **No response from validation**: Check your network connection; the app cannot verify keys while offline.

Once the key is saved, you’re ready for the next steps: importing or converting your resume and using Gemini to tailor it to job descriptions. For those steps, see the main README.
