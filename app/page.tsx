'use client'

import React, { useState, useEffect } from 'react'
import { Download, Mail, Phone, MapPin, Globe, Linkedin, ChevronDown } from 'lucide-react'

interface ResumeOption {
  id: string
  name: string
  filename: string
}

const ResumeGenerator = () => {
  const [resumeData, setResumeData] = useState<any>(null)
  const [availableResumes, setAvailableResumes] = useState<ResumeOption[]>([])
  const [selectedResume, setSelectedResume] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load available resumes on component mount
    fetchAvailableResumes()
  }, [])

  useEffect(() => {
    // Load selected resume data when selection changes
    if (selectedResume) {
      fetchResumeData(selectedResume)
    }
  }, [selectedResume])

  const fetchAvailableResumes = async () => {
    try {
      const response = await fetch('/api/resume')
      const resumes = await response.json()
      setAvailableResumes(resumes)
      
      // Auto-select the first resume (current.json if available)
      const defaultResume = resumes.find((r: ResumeOption) => r.id === 'current') || resumes[0]
      if (defaultResume) {
        setSelectedResume(defaultResume.filename)
      }
    } catch (error) {
      console.error('Error fetching available resumes:', error)
    }
  }

  const fetchResumeData = async (filename: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/resume?filename=${filename}`)
      const data = await response.json()
      setResumeData(data)
    } catch (error) {
      console.error('Error fetching resume data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generatePDF = () => {
    window.print()
  }

  const exportJSON = () => {
    if (!resumeData) return
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(resumeData, null, 2))
    const dlAnchor = document.createElement('a')
    dlAnchor.setAttribute("href", dataStr)
    dlAnchor.setAttribute("download", selectedResume || "CV.json")
    document.body.appendChild(dlAnchor)
    dlAnchor.click()
    dlAnchor.remove()
  }

  const renderHTMLContent = (htmlContent: string) => {
    return (
      <div 
        className="text-gray-700 leading-tight text-xs"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    )
  }

  const renderSummary = (summary: string) => {
    if (summary.includes('<') && summary.includes('>')) {
      return renderHTMLContent(summary)
    }
    
    const points = summary.split('•').filter(point => point.trim())
    if (points.length > 1) {
      return (
        <ul className="space-y-1">
          {points.map((point, index) => (
            <li key={index} className="flex items-start">
              <span className="text-blue-600 mr-2 text-xs">•</span>
              <span className="text-gray-700 leading-tight text-xs">{point.trim()}</span>
            </li>
          ))}
        </ul>
      )
    }
    return <p className="text-gray-700 leading-tight text-xs">{summary}</p>
  }

  if (loading || !resumeData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading resume...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Control Panel - hidden when printing */}
      <div className="print:hidden p-4 bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">Resume Generator</h1>
            
            {/* Resume Version Selector */}
            <div className="relative">
              <select
                value={selectedResume}
                onChange={(e) => setSelectedResume(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded px-3 py-1.5 pr-8 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {availableResumes.map((resume) => (
                  <option key={resume.id} value={resume.filename}>
                    {resume.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={generatePDF}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Download size={14} /> Download PDF
            </button>
            <button
              onClick={exportJSON}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors shadow-sm"
              title="Export JSON"
            >
              <Download size={14} /> Export JSON
            </button>
          </div>
        </div>
      </div>

      {/* Resume Content */}
      <div className="max-w-4xl mx-auto bg-white text-gray-900 leading-tight text-xs resume-content">
        {/* Header */}
        <div className="text-center py-1.5 border-b border-gray-300">
          <h1 className="text-xl font-bold text-gray-900 mb-0.5 tracking-wide">
            {resumeData.basics.name}
          </h1>
          <p className="text-blue-600 font-semibold text-sm mb-1">
            {resumeData.basics.headline}
          </p>
          
          {/* Contact Info */}
          <div className="flex justify-center items-center gap-x-3 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Mail size={8} />
              <a href={`mailto:${resumeData.basics.email}`} className="hover:text-blue-600">
                {resumeData.basics.email}
              </a>
            </div>
            <div className="flex items-center gap-1">
              <Phone size={8} />
              <span>{resumeData.basics.phone}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin size={8} />
              <span>{resumeData.basics.location}</span>
            </div>
            {resumeData.basics.url && resumeData.basics.url.href && (
              <div className="flex items-center gap-1">
                <Globe size={8} />
                <a href={resumeData.basics.url.href} className="hover:text-blue-600">
                  {resumeData.basics.url.label || resumeData.basics.url.href}
                </a>
              </div>
            )}
            {resumeData.basics.customFields && resumeData.basics.customFields.length > 0 && (
              <>
                {resumeData.basics.customFields.map((field: any, index: number) => (
                  <div key={index} className="flex items-center gap-1">
                    <Linkedin size={8} />
                    <a href={field.value} className="hover:text-blue-600">
                      {field.name}
                    </a>
                  </div>
                ))}
              </>
            )}
            {resumeData.basics.profiles && resumeData.basics.profiles.length > 0 && (
              <>
                {resumeData.basics.profiles.map((profile: any, index: number) => (
                  <div key={index} className="flex items-center gap-1">
                    {profile.network === 'LinkedIn' && <Linkedin size={8} />}
                    <a href={profile.url} className="hover:text-blue-600">
                      {profile.username || profile.url}
                    </a>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Summary */}
        {resumeData.sections.summary && resumeData.sections.summary.visible && resumeData.sections.summary.content && (
          <div className="py-1">
            <h2 className="text-base font-bold text-gray-900 mb-1 pb-0.5 border-b border-blue-600 uppercase tracking-wide">
              {resumeData.sections.summary.name}
            </h2>
            <div className="text-gray-700 leading-tight text-xs mt-0.5">
              {renderSummary(resumeData.sections.summary.content)}
            </div>
          </div>
        )}

        {/* Experience */}
        {resumeData.sections.experience && resumeData.sections.experience.visible && resumeData.sections.experience.items && resumeData.sections.experience.items.length > 0 && (
          <div className="py-1">
            <h2 className="text-base font-bold text-gray-900 mb-1 pb-0.5 border-b border-blue-600 uppercase tracking-wide">
              {resumeData.sections.experience.name}
            </h2>
            <div className="space-y-2">
              {resumeData.sections.experience.items.map((exp: any, index: number) => (
                <div key={index}>
                  <div className="flex justify-between items-start mb-0.5">
                    <div className="flex-1">
                      <h3 className="text-sm text-gray-900">
                        {exp.position.includes('|') ? (
                          <>
                            {exp.position.split('|').reverse().map((part: string, idx: number) => (
                              <span key={idx}>
                                {idx === 0 ? (
                                  <span className="font-bold">{part.trim()}</span>
                                ) : (
                                  <>
                                    <span className="text-gray-400 mx-1.5">|</span>
                                    <span className="font-medium">{part.trim()}</span>
                                  </>
                                )}
                              </span>
                            ))}
                          </>
                        ) : (
                          <>
                            {exp.company && (
                              <>
                                <span className="font-bold">{exp.company}</span>
                                <span className="text-gray-400 mx-1.5">|</span>
                              </>
                            )}
                            <span className="font-medium">{exp.position}</span>
                          </>
                        )}
                      </h3>
                    </div>
                    <div className="text-right text-xs text-gray-500 ml-3">
                      <p className="font-medium">{exp.date}</p>
                      {exp.location && <p className="text-xs">{exp.location}</p>}
                    </div>
                  </div>
                  {exp.summary && (
                    <div className="text-gray-700 text-xs leading-tight mt-0.5">
                      {renderSummary(exp.summary)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {resumeData.sections.projects && resumeData.sections.projects.visible && resumeData.sections.projects.items && resumeData.sections.projects.items.length > 0 && (
          <div className="py-1">
            <h2 className="text-base font-bold text-gray-900 mb-1 pb-0.5 border-b border-blue-600 uppercase tracking-wide">
              {resumeData.sections.projects.name}
            </h2>
            <div className="space-y-1.5">
              {resumeData.sections.projects.items.map((project: any, index: number) => (
                <div key={index}>
                  <div className="flex justify-between items-start mb-0.5">
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-gray-900">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-gray-700 font-medium text-xs">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-xs text-gray-500 ml-3">
                      {project.date && <p className="font-medium">{project.date}</p>}
                    </div>
                  </div>
                  {project.summary && (
                    <div className="text-gray-700 text-xs leading-tight mb-0.5">
                      {renderSummary(project.summary)}
                    </div>
                  )}
                  {project.keywords && project.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 mb-0.5">
                      {project.keywords.map((keyword: string, kidx: number) => (
                        <span key={kidx} className="bg-blue-100 text-blue-800 text-xs px-1 py-0.5 rounded">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}
                  {project.url && project.url.href && project.url.label && (
                    <div>
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
          <div className="py-1">
            <h2 className="text-base font-bold text-gray-900 mb-1 pb-0.5 border-b border-blue-600 uppercase tracking-wide">
              {resumeData.sections.skills.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5 skills-grid">
              {resumeData.sections.skills.items.map((skill: any, index: number) => (
                <div key={index}>
                  <h3 className="font-semibold text-gray-900 mb-0.5 text-xs">{skill.name}</h3>
                  <div className="flex flex-wrap gap-0.5">
                    {skill.keywords && skill.keywords.map((keyword: string, kidx: number) => (
                      <span key={kidx} className="bg-blue-100 text-blue-800 text-xs px-1 py-0.5 rounded-full">
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
          <div className="py-1">
            <h2 className="text-base font-bold text-gray-900 mb-1 pb-0.5 border-b border-blue-600 uppercase tracking-wide">
              {resumeData.sections.education.name}
            </h2>
            <div className="space-y-1.5">
              {resumeData.sections.education.items.map((edu: any, index: number) => (
                <div key={index}>
                  <div className="flex justify-between items-start mb-0.5">
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-gray-900">
                        {edu.institution}
                      </h3>
                      <p className="text-blue-600 font-semibold text-xs">
                        {edu.studyType}
                      </p>
                    </div>
                    <div className="text-right text-xs text-gray-500 ml-3">
                      <p className="font-medium">{edu.date}</p>
                      {edu.location && <p className="text-xs">{edu.location}</p>}
                    </div>
                  </div>
                  {edu.score && (
                    <p className="text-xs text-gray-600 mb-0.5">GPA: {edu.score}</p>
                  )}
                  {edu.summary && (
                    <div className="text-gray-700 text-xs leading-tight">
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
  )
}

export default ResumeGenerator
