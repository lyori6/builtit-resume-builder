# Storage & Privacy Notes

The resume builder is designed so the most sensitive data (your resume and Gemini API key) stays on your machine.

## Where Data Lives

- **Gemini API key**: stored in the browser’s `localStorage` under the `builtit:resume-builder` namespace. The key is used directly from the client in every AI request and is never sent to our server.
- **Custom resumes**: once you load JSON or convert text to JSON, the serialized resume is saved in `localStorage` (same namespace) so it persists across refreshes.
- **Prompt overrides**: saved locally so your custom instructions persist between sessions.

Clearing your browser storage or clicking “Delete saved key / Clear workspace” inside the app removes the key and cached resume.

## When Data Leaves the Browser

- Built-in example resumes (`/resumes/current.json`) are served by the app and do not contain private data.
- When you run an optimization/adjustment/text conversion, the request travels directly from your browser to Google’s Gemini API using the key you supplied. No intermediate server logs the payload.
- PDF exports are generated inside your browser via the print dialog.

## Recommended Practices

1. **Rotate keys periodically**: revoke the Gemini API key from [AI Studio](https://aistudio.google.com/app/apikey) if you suspect compromise.
2. **Avoid shared machines**: if you must use one, clear the workspace before leaving and do not click “Remember me” in AI Studio.
3. **Back up your resume JSON**: download it after major changes so you always have an offline copy.
4. **Disable extensions that inject scripts**: resume content includes HTML; ensure your browser extensions are trustworthy to prevent injection.

For self-hosters, review environment variable handling and consider adding your own authentication layer to protect hosted instances.
