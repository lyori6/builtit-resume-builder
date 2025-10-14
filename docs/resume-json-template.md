# Resume JSON Template & Prompt Tips

Use this guide to generate resume JSON that matches the schema expected by the app. Share it with any AI assistant (ChatGPT, Gemini, Claude, etc.) or use it as a starting point for manual edits.

## 1. Minimal Schema Reference

```json
{
  "basics": {
    "name": "",
    "headline": "",
    "email": "",
    "phone": "",
    "location": "",
    "url": {
      "label": "",
      "href": ""
    },
    "profiles": [
      {
        "network": "",
        "username": "",
        "url": ""
      }
    ]
  },
  "sections": {
    "summary": {
      "id": "summary",
      "name": "Professional Summary",
      "visible": true,
      "content": "<p>Short HTML-formatted summary.</p>"
    },
    "experience": {
      "id": "experience",
      "name": "Professional Experience",
      "visible": true,
      "items": [
        {
          "id": "exp-1",
          "visible": true,
          "company": "",
          "position": "",
          "location": "",
          "date": "",
          "summary": "<p><ul><li>Impact bullet</li></ul></p>"
        }
      ]
    },
    "projects": {
      "id": "projects",
      "name": "Projects",
      "visible": true,
      "items": [
        {
          "id": "prj-1",
          "visible": true,
          "name": "",
          "description": "",
          "date": "",
          "summary": "",
          "keywords": [],
          "url": {
            "label": "",
            "href": ""
          }
        }
      ]
    },
    "skills": {
      "id": "skills",
      "name": "Core Competencies",
      "visible": true,
      "items": [
        {
          "id": "skill-1",
          "visible": true,
          "name": "Product",
          "keywords": ["Product Strategy", "Roadmaps", "User Research"]
        }
      ]
    },
    "education": {
      "id": "education",
      "name": "Education",
      "visible": true,
      "items": [
        {
          "id": "edu-1",
          "visible": true,
          "institution": "",
          "studyType": "",
          "date": "",
          "location": "",
          "score": "",
          "summary": ""
        }
      ]
    }
  }
}
```

## 2. Prompt Template for AI Assistants

```
You are converting my resume into JSON for the BuiltIt resume builder.

Use this schema:
[paste the JSON template above]

Rules:
- Keep all factual details exactly.
- Use HTML (<p>, <ul><li>) for summaries and bullet points.
- Omit fields that do not apply by leaving them empty strings or removing optional arrays.
- Return ONLY valid JSON. No commentary or markdown code fences.

Here is my resume:
[paste your resume text]
```

## 3. Tips for Best Results

- Gather your current resume text before prompting to avoid missing details.
- Ask the AI to cite quantifiable results in bullet points; review output and tweak values manually if needed.
- The app now validates structure deeply, so keep IDs unique (e.g., `exp-1`, `exp-2`).
- After generating JSON, paste it into the app’s “Paste JSON” tab for validation. You can download the stored version afterward.
