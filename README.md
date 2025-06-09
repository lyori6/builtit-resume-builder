# Modern Resume Generator

A clean, modern resume generator built with Next.js that dynamically renders your resume from a JSON data file.

## Features

- **Dynamic Data Loading**: Automatically imports and renders your `CV.json` file
- **Modern Design**: Clean, professional styling with subtle gradients and shadows
- **Print Optimized**: Perfect PDF generation via browser print functionality
- **Responsive Layout**: Looks great on all screen sizes
- **Easy Updates**: Just update `CV.json` and your resume automatically reflects changes

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

4. **Generate PDF:**
   Click the "Download PDF" button to print/save your resume

## File Structure

```
├── CV.json              # Your resume data (edit this file to update content)
├── app/
│   ├── page.tsx         # Main resume component
│   ├── layout.tsx       # App layout
│   └── globals.css      # Global styles and print optimization
├── package.json         # Dependencies
└── README.md           # This file
```

## Updating Your Resume

Simply edit the `CV.json` file with your updated information. The app will automatically reflect your changes when you refresh the page.

### JSON Structure

The `CV.json` file follows a standard resume schema with sections for:
- **basics**: Personal information and contact details
- **sections**: 
  - `summary`: Professional summary
  - `experience`: Work experience
  - `education`: Educational background
  - `skills`: Technical and professional skills
  - `projects`: Notable projects

## Styling

The resume uses a modern, professional design with:
- Clean typography (Inter font)
- Subtle blue accent color (#3B82F6)
- Card-based layout with soft shadows
- Print-optimized styles for PDF generation
- Responsive design for all screen sizes

## Print/PDF Generation

The app includes optimized print styles that:
- Hide the download button when printing
- Remove shadows and adjust spacing for print
- Use proper page margins and sizing
- Maintain color accuracy in PDFs

## Development

Built with:
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type safety and better development experience
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful, customizable icons

## Customization

To customize the design:
1. Edit the Tailwind classes in `app/page.tsx`
2. Modify colors, spacing, or typography as needed
3. The design maintains the same structure as your original builder.json styling

Your resume data stays completely separate in `CV.json`, making it easy to maintain and update without touching the styling code.
