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
import { useTheme } from '@/src/state/theme-context'

export interface ResumePreviewProps {
  resumeData: ResumeData
}

const sanitize = (html: string) =>
  typeof window !== 'undefined' ? DOMPurify.sanitize(html) : html

const renderHTMLContent = (html: string, className: string = "") => (
  <div
    className={className}
    dangerouslySetInnerHTML={{ __html: sanitize(html) }}
  />
)

const renderSummary = (summary: string, themeColor: string): ReactNode => {
  if (!summary) return null
  if (summary.includes('<') && summary.includes('>')) {
    return renderHTMLContent(summary, "text-inherit leading-tight text-xs")
  }

  const points = summary.split('•').filter((point) => point.trim())
  if (points.length > 1) {
    return (
      <ul className="space-y-1">
        {points.map((point, index) => (
          <li key={index} className="flex items-start">
            <span className="mr-2 text-xs" style={{ color: themeColor }}>•</span>
            <span className="text-inherit leading-tight text-xs">{point.trim()}</span>
          </li>
        ))}
      </ul>
    )
  }
  return <p className="text-inherit leading-tight text-xs">{summary}</p>
}

const ResumePreview: FC<ResumePreviewProps> = ({ resumeData }) => {
  const { basics, sections } = resumeData
  const { currentTheme } = useTheme()

  const { colors, fonts, spacing } = currentTheme

  return (
    <div
      id="resume-preview-panel"
      className={`max-w-4xl mx-auto ${fonts.body} text-xs resume-content`}
      style={{
        backgroundColor: colors.background,
        color: colors.text
      }}
      data-testid="resume-preview"
    >
      {/* Header */}
      <div
        className="text-center py-4 border-b mb-4"
        style={{ borderColor: colors.border }}
      >
        <h1 className={`text-2xl font-bold mb-1 tracking-wide ${fonts.headings}`} style={{ color: colors.text }}>
          {basics.name}
        </h1>
        {basics.headline && (
          <p className="font-semibold text-sm mb-2" style={{ color: colors.primary }}>{basics.headline}</p>
        )}

        {/* Contact Info */}
        <div className="flex justify-center items-center gap-x-3 text-xs flex-wrap" style={{ color: colors.secondary }}>
          {basics.email && (
            <div className="inline-flex items-center gap-1">
              <Mail size={10} className="flex-shrink-0" />
              <a href={`mailto:${basics.email}`} className="hover:underline" style={{ color: 'inherit' }}>
                {basics.email}
              </a>
            </div>
          )}
          {basics.phone && (
            <div className="inline-flex items-center gap-1">
              <Phone size={10} className="flex-shrink-0" />
              <span>{basics.phone}</span>
            </div>
          )}
          {basics.location && (
            <div className="inline-flex items-center gap-1">
              <MapPin size={10} className="flex-shrink-0" />
              <span>{basics.location}</span>
            </div>
          )}
          {basics.url?.href && (
            <div className="inline-flex items-center gap-1">
              <Globe size={10} className="flex-shrink-0" />
              <a href={basics.url.href} className="hover:underline" style={{ color: 'inherit' }}>
                {basics.url.label || basics.url.href}
              </a>
            </div>
          )}
          {(basics.customFields ?? []).map((field, index) => (
            <div key={`custom-${field.id ?? index}`} className="inline-flex items-center gap-1">
              <Linkedin size={10} className="flex-shrink-0" />
              <a href={field.value} className="hover:underline" style={{ color: 'inherit' }}>
                {field.name}
              </a>
            </div>
          ))}
          {(basics.profiles ?? []).map((profile, index) => (
            <div key={`profile-${profile.url}-${index}`} className="inline-flex items-center gap-1">
              {profile.network === 'LinkedIn' && <Linkedin size={10} className="flex-shrink-0" />}
              <a href={profile.url} className="hover:underline" style={{ color: 'inherit' }}>
                {profile.username || profile.url}
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      {sections.summary?.visible && sections.summary.content && (
        <div className={`mb-4 ${spacing.sectionGap}`}>
          <h2
            className={`text-sm font-bold mb-2 pb-1 border-b uppercase tracking-wide ${fonts.headings}`}
            style={{ color: colors.text, borderColor: colors.primary }}
          >
            {sections.summary.name}
          </h2>
          <div className="leading-relaxed text-xs">
            {renderSummary(sections.summary.content, colors.primary)}
          </div>
        </div>
      )}

      {/* Experience */}
      {sections.experience?.visible && Array.isArray(sections.experience.items) && sections.experience.items.length > 0 && (
        <div className={`mb-4 ${spacing.sectionGap}`}>
          <h2
            className={`text-sm font-bold mb-3 pb-1 border-b uppercase tracking-wide ${fonts.headings}`}
            style={{ color: colors.text, borderColor: colors.primary }}
          >
            {sections.experience.name}
          </h2>
          <div className={spacing.itemGap + " flex flex-col resume-section-content"}>
            {sections.experience.items.map((exp, index) => (
              <div key={exp.id ?? index} className="break-inside-avoid mb-3 last:mb-0">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex-1">
                    <h3 className="text-sm text-gray-900" style={{ color: colors.text }}>
                      {exp.position?.includes('|') ? (
                        <>
                          {exp.position.split('|').reverse().map((part, idx) => (
                            <span key={idx}>
                              {idx === 0 ? (
                                <span className="font-bold">{part.trim()}</span>
                              ) : (
                                <>
                                  <span className="mx-1.5" style={{ color: colors.muted }}>|</span>
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
                              <span className="mx-1.5" style={{ color: colors.muted }}>|</span>
                            </>
                          )}
                          <span className="font-medium">{exp.position}</span>
                        </>
                      )}
                    </h3>
                  </div>
                  <div className="text-right text-xs ml-3" style={{ color: colors.secondary }}>
                    {exp.date && <p className="font-medium">{exp.date}</p>}
                    {exp.location && <p className="text-xs">{exp.location}</p>}
                  </div>
                </div>
                {exp.summary && (
                  <div className="text-xs leading-relaxed mt-1" style={{ color: colors.text }}>
                    {renderSummary(exp.summary, colors.primary)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {sections.projects?.visible && Array.isArray(sections.projects.items) && sections.projects.items.length > 0 && (
        <div className={`mb-4 ${spacing.sectionGap}`}>
          <h2
            className={`text-sm font-bold mb-3 pb-1 border-b uppercase tracking-wide ${fonts.headings}`}
            style={{ color: colors.text, borderColor: colors.primary }}
          >
            {sections.projects.name}
          </h2>
          <div className={spacing.itemGap + " flex flex-col resume-section-content"}>
            {sections.projects.items.map((project, index) => (
              <div key={project.id ?? index} className="break-inside-avoid mb-3 last:mb-0">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold" style={{ color: colors.text }}>
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="font-medium text-xs" style={{ color: colors.secondary }}>{project.description}</p>
                    )}
                  </div>
                  <div className="text-right text-xs ml-3" style={{ color: colors.secondary }}>
                    {project.date && <p className="font-medium">{project.date}</p>}
                  </div>
                </div>
                {project.summary && (
                  <div className="text-xs leading-relaxed mb-1" style={{ color: colors.text }}>
                    {renderSummary(project.summary, colors.primary)}
                  </div>
                )}
                {Array.isArray(project.keywords) && project.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1">
                    {project.keywords.map((keyword, kidx) => (
                      <span
                        key={kidx}
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: colors.border + '40', color: colors.secondary }}
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
                {project.url?.href && project.url.label && (
                  <div>
                    <a href={project.url.href} className="hover:underline text-xs" style={{ color: colors.primary }}>
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
        <div className={`mb-4 ${spacing.sectionGap}`}>
          <h2
            className={`text-sm font-bold mb-3 pb-1 border-b uppercase tracking-wide ${fonts.headings}`}
            style={{ color: colors.text, borderColor: colors.primary }}
          >
            {sections.skills.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 skills-grid">
            {sections.skills.items.map((skill, index) => (
              <div key={skill.id ?? index} className="break-inside-avoid">
                <h3 className="font-semibold mb-1 text-xs" style={{ color: colors.text }}>{skill.name}</h3>
                <div className="flex flex-wrap gap-1">
                  {(skill.keywords ?? []).map((keyword, kidx) => (
                    <span
                      key={kidx}
                      className={`inline-flex items-center text-xs px-1.5 py-0.5 rounded-full ${currentTheme.skillsStyle === 'outline' ? 'border' : ''}`}
                      style={
                        currentTheme.skillsStyle === 'outline'
                          ? { borderColor: colors.border, color: colors.text }
                          : { backgroundColor: colors.border + '60', color: colors.secondary }
                      }
                    >
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
        <div className={`mb-4 ${spacing.sectionGap}`}>
          <h2
            className={`text-sm font-bold mb-3 pb-1 border-b uppercase tracking-wide ${fonts.headings}`}
            style={{ color: colors.text, borderColor: colors.primary }}
          >
            {sections.education.name}
          </h2>
          <div className={spacing.itemGap + " flex flex-col resume-section-content"}>
            {sections.education.items.map((edu, index) => (
              <div key={edu.id ?? index} className="break-inside-avoid mb-3 last:mb-0">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold" style={{ color: colors.text }}>{edu.institution}</h3>
                    {edu.studyType && (
                      <p className="font-semibold text-xs" style={{ color: colors.primary }}>{edu.studyType}</p>
                    )}
                  </div>
                  <div className="text-right text-xs ml-3" style={{ color: colors.secondary }}>
                    {edu.date && <p className="font-medium">{edu.date}</p>}
                    {edu.location && <p className="text-xs">{edu.location}</p>}
                  </div>
                </div>
                {edu.score && (
                  <p className="text-xs mb-1" style={{ color: colors.secondary }}>GPA: {edu.score}</p>
                )}
                {edu.summary && (
                  <div className="text-xs leading-relaxed" style={{ color: colors.text }}>
                    {renderSummary(edu.summary, colors.primary)}
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
