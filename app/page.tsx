'use client'

import React from 'react'
import { Download, Mail, Phone, MapPin, Globe, Linkedin } from 'lucide-react'
import resumeData from '../CV.json'

const ResumeGenerator = () => {
  const generatePDF = () => {
    window.print()
  }

  const renderHTMLContent = (htmlContent: string) => {
    // Parse HTML content and render it properly
    return (
      <div 
        className="text-gray-700 leading-tight text-sm"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    )
  }

  const renderSummary = (summary: string) => {
    // Check if content contains HTML tags
    if (summary.includes('<') && summary.includes('>')) {
      return renderHTMLContent(summary)
    }
    
    // Handle plain text with bullet points
    const points = summary.split('•').filter(point => point.trim())
    if (points.length > 1) {
      return (
        <ul className="space-y-1">
          {points.map((point, index) => (
            <li key={index} className="flex items-start">
              <span className="text-blue-600 mr-2 text-xs">•</span>
              <span className="text-gray-700 leading-tight text-sm">{point.trim()}</span>
            </li>
          ))}
        </ul>
      )
    }
    return <p className="text-gray-700 leading-tight text-sm">{summary}</p>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Print button - hidden when printing */}
      <div className="print:hidden p-4 bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Resume Generator</h1>
          {/* Download PDF & Export JSON Buttons */}
          <div className="print:hidden flex gap-2 mb-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Download size={14} className="mr-1" /> Download PDF
            </button>
            <button
              onClick={() => {
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(resumeData, null, 2));
                const dlAnchor = document.createElement('a');
                dlAnchor.setAttribute("href", dataStr);
                dlAnchor.setAttribute("download", "CV.json");
                document.body.appendChild(dlAnchor);
                dlAnchor.click();
                dlAnchor.remove();
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors shadow-sm"
              title="Export CV.json"
            >
              <Download size={14} className="mr-1" /> Export JSON
            </button>
          </div>
        </div>
      </div>

      {/* Resume Content */}
      <div className="max-w-4xl mx-auto bg-white resume-content">
        {/* Header - Simple and Compact */}
        <div className="text-center py-2">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {resumeData.basics.name}
          </h1>
          <p className="text-base text-gray-600 mb-2">
            {resumeData.basics.headline}
          </p>
          
          {/* Contact Info */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs text-gray-600 mb-2">
            <div className="flex items-center gap-1">
              <Mail size={12} className="text-blue-600" />
              <a href={`mailto:${resumeData.basics.email}`} className="hover:text-blue-600">
                {resumeData.basics.email}
              </a>
            </div>
            <div className="flex items-center gap-1">
              <Phone size={12} className="text-blue-600" />
              <span>{resumeData.basics.phone}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin size={12} className="text-blue-600" />
              <span>{resumeData.basics.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Globe size={12} className="text-blue-600" />
              <a href={resumeData.basics.url.href} className="hover:text-blue-600">
                {resumeData.basics.url.label.trim()}
              </a>
            </div>
            {resumeData.basics.customFields && resumeData.basics.customFields.length > 0 && (
              <div className="flex items-center gap-1">
                <Linkedin size={12} className="text-blue-600" />
                <a href={resumeData.basics.customFields[0].value} className="hover:text-blue-600">
                  {resumeData.basics.customFields[0].name}
                </a>
              </div>
            )}
          </div>
          
          <hr className="border-gray-300" />
        </div>

        {/* Content */}
        <div className="px-4 py-3 space-y-4">
          {/* Professional Summary */}
          {resumeData.sections.summary && resumeData.sections.summary.visible && resumeData.sections.summary.content && (
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-blue-600 uppercase tracking-wide">
                {resumeData.sections.summary.name}
              </h2>
              <div className="text-gray-700 text-sm leading-tight">
                {renderSummary(resumeData.sections.summary.content)}
              </div>
            </div>
          )}

          {/* Professional Experience */}
          {resumeData.sections.experience && resumeData.sections.experience.visible && resumeData.sections.experience.items && (
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-blue-600 uppercase tracking-wide">
                {resumeData.sections.experience.name}
              </h2>
              <div className="space-y-3">
                {resumeData.sections.experience.items.map((exp: any, index: number) => (
                  <div key={index}>
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-gray-900 mb-0.5">
                          {exp.position}
                        </h3>
                        <div className="text-blue-600 font-semibold text-sm">
                          {exp.company}
                        </div>
                      </div>
                      <div className="text-right text-xs text-gray-500 ml-3">
                        <p className="font-medium">{exp.date}</p>
                        {exp.location && <p>{exp.location}</p>}
                      </div>
                    </div>
                    <div className="text-gray-700 text-sm leading-tight mb-1">
                      {renderSummary(exp.summary)}
                    </div>
                    {exp.url && exp.url.href && exp.url.label && (
                      <div className="mb-2">
                        <a href={exp.url.href} className="text-blue-600 hover:underline text-xs">
                          {exp.url.label.toLowerCase()}
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {resumeData.sections.projects && resumeData.sections.projects.visible && resumeData.sections.projects.items && resumeData.sections.projects.items.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-blue-600 uppercase tracking-wide">
                {resumeData.sections.projects.name}
              </h2>
              <div className="space-y-3">
                {resumeData.sections.projects.items.map((project: any, index: number) => (
                  <div key={index}>
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-gray-900">
                          {project.name}
                        </h3>
                        {project.description && (
                          <p className="text-gray-700 font-medium text-sm mt-0.5">
                            {project.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-xs text-gray-500 ml-3">
                        <p className="font-medium">{project.date}</p>
                      </div>
                    </div>
                    {project.summary && (
                      <div className="text-gray-700 text-sm leading-tight mb-1">
                        {renderSummary(project.summary)}
                      </div>
                    )}
                    {project.keywords && project.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1">
                        {project.keywords.map((keyword: string, kidx: number) => (
                          <span key={kidx} className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}
                    {project.url && project.url.href && project.url.label && (
                      <div className="mb-2">
                        <a href={project.url.href} className="text-blue-600 hover:underline text-xs">
                          {project.url.label.toLowerCase()}
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {resumeData.sections.skills && resumeData.sections.skills.visible && resumeData.sections.skills.items && resumeData.sections.skills.items.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-blue-600 uppercase tracking-wide">
                {resumeData.sections.skills.name}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {resumeData.sections.skills.items.map((skill: any, index: number) => (
                  <div key={index}>
                    <h3 className="font-semibold text-gray-900 mb-1 text-sm">{skill.name}</h3>
                    <div className="flex flex-wrap gap-1">
                      {skill.keywords && skill.keywords.map((keyword: string, kidx: number) => (
                        <span key={kidx} className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {resumeData.sections.education && resumeData.sections.education.visible && resumeData.sections.education.items && resumeData.sections.education.items.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-blue-600 uppercase tracking-wide">
                {resumeData.sections.education.name}
              </h2>
              <div className="space-y-3">
                {resumeData.sections.education.items.map((edu: any, index: number) => (
                  <div key={index}>
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-gray-900">
                          {edu.institution}
                        </h3>
                        <p className="text-blue-600 font-semibold text-sm">
                          {edu.studyType}
                        </p>
                      </div>
                      <div className="text-right text-xs text-gray-500 ml-3">
                        <p className="font-medium">{edu.date}</p>
                        {edu.location && <p>{edu.location}</p>}
                      </div>
                    </div>
                    {edu.score && (
                      <p className="text-xs text-gray-600 mb-1">GPA: {edu.score}</p>
                    )}
                    {edu.summary && (
                      <div className="text-gray-700 text-sm leading-tight">
                        {renderSummary(edu.summary)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResumeGenerator
