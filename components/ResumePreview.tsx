"use client"

import { FC, ReactNode } from 'react'
import DOMPurify from 'dompurify'
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  Linkedin
} from 'lucide-react'
import { ResumeData } from '@/lib/resume-types'

export interface ResumePreviewProps {
  resumeData: ResumeData
}

const sanitize = (html: string) =>
  typeof window !== 'undefined' ? DOMPurify.sanitize(html) : html

const renderHTMLContent = (html: string) => (
  <div
    className="text-gray-700 leading-tight text-xs"
    dangerouslySetInnerHTML={{ __html: sanitize(html) }}
  />
)

const renderSummary = (summary: string): ReactNode => {
  if (!summary) return null
  if (summary.includes('<') && summary.includes('>')) {
    return renderHTMLContent(summary)
  }

  const points = summary.split('•').filter((point) => point.trim())
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

const ResumePreview: FC<ResumePreviewProps> = ({ resumeData }) => {
  const { basics, sections } = resumeData

  return (
    <div className="max-w-4xl mx-auto bg-white text-gray-900 leading-tight text-xs resume-content" data-testid="resume-preview">
      {/* Header */}
      <div className="text-center py-1.5 border-b border-gray-300">
        <h1 className="text-xl font-bold text-gray-900 mb-0.5 tracking-wide">
          {basics.name}
        </h1>
        {basics.headline && (
          <p className="text-blue-600 font-semibold text-sm mb-1">{basics.headline}</p>
        )}
        
        {/* Contact Info */}
        <div className="flex justify-center items-center gap-x-3 text-xs text-gray-600 flex-wrap">
          {basics.email && (
            <div className="flex items-center gap-1">
              <Mail size={8} />
              <a href={`mailto:${basics.email}`} className="hover:text-blue-600">
                {basics.email}
              </a>
            </div>
          )}
          {basics.phone && (
            <div className="flex items-center gap-1">
              <Phone size={8} />
              <span>{basics.phone}</span>
            </div>
          )}
          {basics.location && (
            <div className="flex items-center gap-1">
              <MapPin size={8} />
              <span>{basics.location}</span>
            </div>
          )}
          {basics.url?.href && (
            <div className="flex items-center gap-1">
              <Globe size={8} />
              <a href={basics.url.href} className="hover:text-blue-600">
                {basics.url.label || basics.url.href}
              </a>
            </div>
          )}
          {(basics.customFields ?? []).map((field, index) => (
            <div key={`custom-${field.id ?? index}`} className="flex items-center gap-1">
              <Linkedin size={8} />
              <a href={field.value} className="hover:text-blue-600">
                {field.name}
              </a>
            </div>
          ))}
          {(basics.profiles ?? []).map((profile, index) => (
            <div key={`profile-${profile.url}-${index}`} className="flex items-center gap-1">
              {profile.network === 'LinkedIn' && <Linkedin size={8} />}
              <a href={profile.url} className="hover:text-blue-600">
                {profile.username || profile.url}
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      {sections.summary?.visible && sections.summary.content && (
        <div className="py-1">
          <h2 className="text-base font-bold text-gray-900 mb-1 pb-0.5 border-b border-blue-600 uppercase tracking-wide">
            {sections.summary.name}
          </h2>
          <div className="text-gray-700 leading-tight text-xs mt-0.5">
            {renderSummary(sections.summary.content)}
          </div>
        </div>
      )}

      {/* Experience */}
      {sections.experience?.visible && Array.isArray(sections.experience.items) && sections.experience.items.length > 0 && (
        <div className="py-1">
          <h2 className="text-base font-bold text-gray-900 mb-1 pb-0.5 border-b border-blue-600 uppercase tracking-wide">
            {sections.experience.name}
          </h2>
          <div className="space-y-2">
            {sections.experience.items.map((exp, index) => (
              <div key={exp.id ?? index}>
                <div className="flex justify-between items-start mb-0.5">
                  <div className="flex-1">
                    <h3 className="text-sm text-gray-900">
                      {exp.position?.includes('|') ? (
                        <>
                          {exp.position.split('|').reverse().map((part, idx) => (
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
                    {exp.date && <p className="font-medium">{exp.date}</p>}
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
      {sections.projects?.visible && Array.isArray(sections.projects.items) && sections.projects.items.length > 0 && (
        <div className="py-1">
          <h2 className="text-base font-bold text-gray-900 mb-1 pb-0.5 border-b border-blue-600 uppercase tracking-wide">
            {sections.projects.name}
          </h2>
          <div className="space-y-1.5">
            {sections.projects.items.map((project, index) => (
              <div key={project.id ?? index}>
                <div className="flex justify-between items-start mb-0.5">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="text-gray-700 font-medium text-xs">{project.description}</p>
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
                {Array.isArray(project.keywords) && project.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 mb-0.5">
                    {project.keywords.map((keyword, kidx) => (
                      <span key={kidx} className="bg-blue-100 text-blue-800 text-xs px-1 py-0.5 rounded">
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
                {project.url?.href && project.url.label && (
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
      {sections.skills?.visible && Array.isArray(sections.skills.items) && sections.skills.items.length > 0 && (
        <div className="py-1">
          <h2 className="text-base font-bold text-gray-900 mb-1 pb-0.5 border-b border-blue-600 uppercase tracking-wide">
            {sections.skills.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5 skills-grid">
            {sections.skills.items.map((skill, index) => (
              <div key={skill.id ?? index}>
                <h3 className="font-semibold text-gray-900 mb-0.5 text-xs">{skill.name}</h3>
                <div className="flex flex-wrap gap-0.5">
                  {(skill.keywords ?? []).map((keyword, kidx) => (
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
      {sections.education?.visible && Array.isArray(sections.education.items) && sections.education.items.length > 0 && (
        <div className="py-1">
          <h2 className="text-base font-bold text-gray-900 mb-1 pb-0.5 border-b border-blue-600 uppercase tracking-wide">
            {sections.education.name}
          </h2>
          <div className="space-y-1.5">
            {sections.education.items.map((edu, index) => (
              <div key={edu.id ?? index}>
                <div className="flex justify-between items-start mb-0.5">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900">{edu.institution}</h3>
                    {edu.studyType && (
                      <p className="text-blue-600 font-semibold text-xs">{edu.studyType}</p>
                    )}
                  </div>
                  <div className="text-right text-xs text-gray-500 ml-3">
                    {edu.date && <p className="font-medium">{edu.date}</p>}
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
  )
}

export default ResumePreview
