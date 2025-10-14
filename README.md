# Modern Resume Generator

A dynamic, modern resume generator built with Next.js that supports multiple resume versions, dynamic loading, and optimized PDF generation.

## Features

- **Multi-Resume Support**: Store and switch between multiple resume versions
- **Dynamic Loading**: Select and load different resumes on-the-fly
- **PDF Generation**: Print-optimized PDF output with proper formatting
- **JSON Export**: Export any resume version as JSON
- **Prompt Overrides**: Customize Gemini system prompts locally to fine-tune AI behavior
- **Responsive Design**: Clean, professional layout that works on all devices
- **Modern UI**: Built with Tailwind CSS for a polished experience

## Architecture

### Tech Stack
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Icons**: Lucide React

### Project Structure
```
├── app/
│   ├── api/resume/route.ts    # API endpoint for resume data
│   ├── globals.css            # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main resume component
├── lib/
│   └── resume-utils.ts       # Resume utility functions
├── resumes/                  # Resume JSON files directory
│   ├── current.json          # Current/main resume
│   └── *.json               # Additional resume versions
└── README.md
```

### How It Works

1. **Resume Storage**: All resume JSON files are stored in the `/resumes` directory
2. **Dynamic Loading**: The API route (`/api/resume`) handles:
   - Listing available resume files
   - Loading specific resume data
3. **Frontend**: React component with:
   - Dropdown selector for resume versions
   - Dynamic content rendering
   - PDF generation and JSON export
4. **Responsive Design**: Optimized for both screen and print media

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the resume generator.

### Gemini API Key Setup

The public tool expects each user to bring a free Gemini API key. The key is saved only in the browser and never sent to the server.

1. Visit [AI Studio](https://aistudio.google.com/app/apikey) and create an API key.
2. In the app, open the **Connect your Gemini API key** card and paste the key.
3. Click **Save key** – the app validates the key and unlocks optimization features.

See [`docs/gemini-key-setup.md`](docs/gemini-key-setup.md) for screenshots, deletion instructions, and troubleshooting tips.
See [`docs/storage-and-privacy.md`](docs/storage-and-privacy.md) to understand what data stays local.

### Build for Production

```bash
npm run build
npm start
```

## Managing Resume Versions

If you don’t already have a JSON resume, the app’s onboarding screen lets you:
- Paste existing JSON (generated via ChatGPT, Gemini, Claude, etc.) for validation.
- Paste plain text from your current resume and convert it to JSON using your Gemini key.

Need a template? Check [`docs/resume-json-template.md`](docs/resume-json-template.md) for a schema example and a ready-to-use AI prompt.

### Adding a New Resume

1. Create a new JSON file in the `/resumes` directory (e.g., `v2.json`)
2. Copy the structure from an existing resume file
3. Update the content as needed
4. The new resume will automatically appear in the dropdown selector

### Resume JSON Structure

Each resume JSON file should follow this structure:

```json
{
  "basics": {
    "name": "Your Name",
    "headline": "Your Title",
    "email": "email@example.com",
    "phone": "+1234567890",
    "location": "City, State",
    "url": {
      "label": "Website",
      "href": "https://yourwebsite.com"
    },
    "profiles": [
      {
        "network": "LinkedIn",
        "username": "yourprofile",
        "url": "https://linkedin.com/in/yourprofile"
      }
    ]
  },
  "sections": {
    "summary": {
      "name": "Professional Summary",
      "visible": true,
      "content": "<p>Your professional summary...</p>"
    },
    "experience": {
      "name": "Experience",
      "visible": true,
      "items": [
        {
          "position": "Job Title | Company Name",
          "company": "Company Name",
          "date": "Start - End",
          "location": "City, State",
          "summary": "<p>Job description...</p>"
        }
      ]
    },
    "skills": {
      "name": "Skills",
      "visible": true,
      "items": [
        {
          "name": "Category",
          "keywords": ["Skill1", "Skill2", "Skill3"]
        }
      ]
    },
    "projects": {
      "name": "Projects",
      "visible": true,
      "items": [
        {
          "name": "Project Name",
          "description": "Brief description",
          "date": "Date",
          "summary": "<p>Project details...</p>",
          "keywords": ["Tech1", "Tech2"],
          "url": {
            "label": "View Project",
            "href": "https://project-url.com"
          }
        }
      ]
    },
    "education": {
      "name": "Education",
      "visible": true,
      "items": [
        {
          "institution": "University Name",
          "studyType": "Degree Type",
          "date": "Graduation Date",
          "location": "City, State",
          "score": "GPA (optional)",
          "summary": "<p>Additional details...</p>"
        }
      ]
    }
  }
}
```

### Switching Between Resumes

1. Use the dropdown selector in the top navigation
2. Select any available resume version
3. The content will update dynamically
4. PDF generation and JSON export will use the selected version

## Customization

### Styling

- Modify `app/globals.css` for global styles
- Update Tailwind classes in `app/page.tsx` for component styling
- Print styles are handled with `@media print` CSS rules

### Adding New Sections

1. Add the section to your resume JSON structure
2. Update the rendering logic in `app/page.tsx`
3. Follow the existing pattern for conditional rendering

### PDF Optimization

The resume is optimized for PDF generation with:
- Print-specific CSS media queries
- Proper page break handling
- Optimized margins and spacing
- Hidden UI elements during printing

### Prompt Settings

- Open the **Prompt settings** button in the control bar to edit the system prompts used for text conversion, optimization, and adjustments.
- Changes are stored in your browser via `localStorage`; reset restores the defaults from `lib/prompts.ts`.
- Prompt overrides are sent with every Gemini request, letting you fine-tune tone and constraints without changing the codebase.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (especially PDF output)
5. Submit a pull request

## License

This project is open source and available under the MIT License.
