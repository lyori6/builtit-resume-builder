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
          <button
            onClick={generatePDF}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download size={16} />
            Download PDF
          </button>
        </div>
      </div>

      {/* Resume content */}
      <div className="max-w-4xl mx-auto bg-white shadow-lg print:shadow-none print:max-w-none resume-content">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-white">
          <h1 className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">
            {resumeData.basics.name}
          </h1>
          <p className="text-base text-gray-700 mb-3 font-medium leading-tight">
            {resumeData.basics.headline}
          </p>
          
          {/* Contact Info - Single Line */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Mail size={12} className="text-blue-600 flex-shrink-0" />
              <a href={`mailto:${resumeData.basics.email}`} className="hover:text-blue-600 transition-colors">
                {resumeData.basics.email}
              </a>
            </div>
            <div className="flex items-center gap-1">
              <Phone size={12} className="text-blue-600 flex-shrink-0" />
              <span>{resumeData.basics.phone}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin size={12} className="text-blue-600 flex-shrink-0" />
              <span>{resumeData.basics.location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Globe size={12} className="text-blue-600 flex-shrink-0" />
              <a href={resumeData.basics.url.href} className="hover:text-blue-600 transition-colors">
                {resumeData.basics.url.label.trim()}
              </a>
            </div>
            {resumeData.basics.customFields && resumeData.basics.customFields.length > 0 && (
              <div className="flex items-center gap-1">
                <Linkedin size={12} className="text-blue-600 flex-shrink-0" />
                <a href={resumeData.basics.customFields[0].value} className="hover:text-blue-600 transition-colors">
                  {resumeData.basics.customFields[0].name}
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Professional Summary */}
          {resumeData.sections.summary && resumeData.sections.summary.visible && (
            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-blue-600 uppercase tracking-wide">
                {resumeData.sections.summary.name}
              </h2>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-gray-700 leading-tight text-sm">
                  {renderSummary(resumeData.sections.summary.content)}
                </div>
              </div>
            </section>
          )}

          {/* Professional Experience */}
          {resumeData.sections.experience && resumeData.sections.experience.visible && resumeData.sections.experience.items && (
            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-blue-600 uppercase tracking-wide">
                {resumeData.sections.experience.name}
              </h2>
              <div className="space-y-3">
                {resumeData.sections.experience.items.map((exp: any, index: number) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-gray-900 mb-0.5 leading-tight">
                          {exp.position}
                        </h3>
                        <div className="text-blue-600 font-semibold text-sm">
                          <span>{exp.company}</span>
                        </div>
                      </div>
                      <div className="text-right text-xs text-gray-500 ml-3 flex-shrink-0">
                        <p className="font-medium whitespace-nowrap">{exp.date}</p>
                        {exp.location && <p className="text-xs">{exp.location}</p>}
                      </div>
                    </div>
                    <div className="text-gray-700 text-sm leading-tight mb-2">
                      {renderSummary(exp.summary)}
                    </div>
                    {exp.url && exp.url.href && exp.url.label && (
                      <div className="mt-1">
                        <a href={exp.url.href} className="text-blue-600 hover:underline text-xs">
                          {exp.url.label.toLowerCase()}
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {resumeData.sections.projects && resumeData.sections.projects.visible && resumeData.sections.projects.items && resumeData.sections.projects.items.length > 0 && (
            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-blue-600 uppercase tracking-wide">
                {resumeData.sections.projects.name}
              </h2>
              <div className="space-y-2">
                {resumeData.sections.projects.items.map((project: any, index: number) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 mb-0.5 leading-tight">
                          {project.name}
                        </h3>
                        {project.description && (
                          <p className="text-gray-600 text-xs mb-1">{project.description}</p>
                        )}
                      </div>
                      <div className="text-right text-xs text-gray-500 ml-3 flex-shrink-0">
                        {project.date && <p className="font-medium whitespace-nowrap">{project.date}</p>}
                      </div>
                    </div>
                    {project.summary && (
                      <div className="text-gray-700 text-sm leading-tight mb-2">
                        {renderSummary(project.summary)}
                      </div>
                    )}
                    {project.keywords && project.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {project.keywords.map((keyword: string, kidx: number) => (
                          <span key={kidx} className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}
                    {project.url && (
                      <div className="mt-1">
                        <a href={project.url.href} className="text-blue-600 hover:underline text-xs">
                          {project.url.label}
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Skills */}
          {resumeData.sections.skills && resumeData.sections.skills.visible && resumeData.sections.skills.items && resumeData.sections.skills.items.length > 0 && (
            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-blue-600 uppercase tracking-wide">
                {resumeData.sections.skills.name}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {resumeData.sections.skills.items.map((skill: any, index: number) => (
                  <div key={index} className="bg-gray-50 p-2 rounded-lg">
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
            </section>
          )}

          {/* Education */}
          {resumeData.sections.education && resumeData.sections.education.visible && resumeData.sections.education.items && resumeData.sections.education.items.length > 0 && (
            <section>
              <h2 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-blue-600 uppercase tracking-wide">
                {resumeData.sections.education.name}
              </h2>
              <div className="space-y-2">
                {resumeData.sections.education.items.map((edu: any, index: number) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 leading-tight">
                          {edu.institution}
                        </h3>
                        <p className="text-blue-600 font-semibold text-sm">
                          {edu.studyType}
                        </p>
                      </div>
                      <div className="text-right text-xs text-gray-500 ml-3 flex-shrink-0">
                        <p className="font-medium whitespace-nowrap">{edu.date}</p>
                        {edu.location && <p className="text-xs">{edu.location}</p>}
                      </div>
                    </div>
                    {edu.score && (
                      <p className="text-xs text-gray-600">GPA: {edu.score}</p>
                    )}
                    {edu.summary && (
                      <div className="mt-2 text-gray-700 text-sm leading-tight">
                        {renderSummary(edu.summary)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResumeGenerator
