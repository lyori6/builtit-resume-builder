import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    TabStopType,
    Tab,
    convertInchesToTwip
} from 'docx'
import { ResumeData } from './resume-types'

const FONTS = {
    HEADING: 'Arial',
    BODY: 'Calibri'
}

const SIZES = {
    NAME: 32, // 16pt
    HEADING: 24, // 12pt
    BODY: 22, // 11pt
    SMALL: 20 // 10pt
}

export class DocxGenerator {
    private resume: ResumeData

    constructor(resume: ResumeData) {
        this.resume = resume
    }

    public async generate(): Promise<Blob> {
        const doc = new Document({
            sections: [
                {
                    properties: {
                        page: {
                            margin: {
                                top: convertInchesToTwip(0.5),
                                right: convertInchesToTwip(0.5),
                                bottom: convertInchesToTwip(0.5),
                                left: convertInchesToTwip(0.5)
                            }
                        }
                    },
                    children: [
                        ...this.createHeader(),
                        ...this.createSummary(),
                        ...this.createExperience(),
                        ...this.createProjects(),
                        ...this.createEducation(),
                        ...this.createSkills()
                    ]
                }
            ]
        })

        return await Packer.toBlob(doc)
    }

    private createHeader(): Paragraph[] {
        const { basics } = this.resume
        const lines: Paragraph[] = []

        // Name
        lines.push(
            new Paragraph({
                text: basics.name,
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
                spacing: { after: 120 },
                run: {
                    font: FONTS.HEADING,
                    size: SIZES.NAME,
                    bold: true
                }
            })
        )

        // Contact Info
        const contactParts: string[] = []
        if (basics.location) contactParts.push(basics.location)
        if (basics.email) contactParts.push(basics.email)
        if (basics.phone) contactParts.push(basics.phone)
        if (basics.url?.href) contactParts.push(basics.url.href)

        if (basics.profiles) {
            basics.profiles.forEach(p => {
                if (p.url) contactParts.push(p.url)
            })
        }

        if (contactParts.length > 0) {
            lines.push(
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 240 },
                    children: [
                        new TextRun({
                            text: contactParts.join(' | '),
                            font: FONTS.BODY,
                            size: SIZES.SMALL
                        })
                    ]
                })
            )
        }

        return lines
    }

    private createSectionHeading(text: string): Paragraph {
        return new Paragraph({
            text: text.toUpperCase(),
            heading: HeadingLevel.HEADING_1,
            border: {
                bottom: {
                    color: '000000',
                    space: 1,
                    style: 'single',
                    size: 6
                }
            },
            spacing: { before: 240, after: 120 },
            run: {
                font: FONTS.HEADING,
                size: SIZES.HEADING,
                bold: true
            }
        })
    }

    private createSummary(): Paragraph[] {
        const { sections } = this.resume
        if (!sections.summary?.visible || !sections.summary.content) return []

        // Strip HTML tags for now
        const text = sections.summary.content.replace(/<[^>]+>/g, '')

        return [
            this.createSectionHeading(sections.summary.name || 'Professional Summary'),
            new Paragraph({
                text: text,
                spacing: { after: 120 },
                run: {
                    font: FONTS.BODY,
                    size: SIZES.BODY
                }
            })
        ]
    }

    private createExperience(): Paragraph[] {
        const { sections } = this.resume
        if (!sections.experience?.visible || !sections.experience.items?.length) return []

        const paragraphs: Paragraph[] = [
            this.createSectionHeading(sections.experience.name || 'Experience')
        ]

        sections.experience.items.forEach((item) => {
            if (!item.visible) return

            // Company & Location line
            paragraphs.push(
                new Paragraph({
                    tabStops: [
                        {
                            type: TabStopType.RIGHT,
                            position: convertInchesToTwip(7.5) // Adjust based on margins
                        }
                    ],
                    children: [
                        new TextRun({
                            text: item.company,
                            bold: true,
                            font: FONTS.HEADING,
                            size: SIZES.BODY
                        }),
                        new TextRun({
                            children: [new Tab(), item.location || '']
                        })
                    ]
                })
            )

            // Position & Date line
            paragraphs.push(
                new Paragraph({
                    spacing: { after: 60 },
                    tabStops: [
                        {
                            type: TabStopType.RIGHT,
                            position: convertInchesToTwip(7.5)
                        }
                    ],
                    children: [
                        new TextRun({
                            text: item.position,
                            italics: true,
                            font: FONTS.BODY,
                            size: SIZES.BODY
                        }),
                        new TextRun({
                            children: [new Tab(), item.date]
                        })
                    ]
                })
            )

            // Summary bullets
            if (item.summary) {
                const bullets = this.parseHtmlBullets(item.summary)
                paragraphs.push(...bullets)
            }

            // Add some spacing after each item
            paragraphs.push(new Paragraph({ text: "", spacing: { after: 120 } }))
        })

        return paragraphs
    }

    private createProjects(): Paragraph[] {
        const { sections } = this.resume
        if (!sections.projects?.visible || !sections.projects.items?.length) return []

        const paragraphs: Paragraph[] = [
            this.createSectionHeading(sections.projects.name || 'Projects')
        ]

        sections.projects.items.forEach((item) => {
            if (!item.visible) return

            paragraphs.push(
                new Paragraph({
                    tabStops: [
                        {
                            type: TabStopType.RIGHT,
                            position: convertInchesToTwip(7.5)
                        }
                    ],
                    children: [
                        new TextRun({
                            text: item.name,
                            bold: true,
                            font: FONTS.HEADING,
                            size: SIZES.BODY
                        }),
                        new TextRun({
                            children: [new Tab(), item.date || '']
                        })
                    ]
                })
            )

            if (item.description) {
                paragraphs.push(
                    new Paragraph({
                        text: item.description.replace(/<[^>]+>/g, ''),
                        spacing: { after: 60 },
                        run: {
                            italics: true,
                            font: FONTS.BODY,
                            size: SIZES.BODY
                        }
                    })
                )
            }

            if (item.summary) {
                const bullets = this.parseHtmlBullets(item.summary)
                paragraphs.push(...bullets)
            }
            // Add some spacing after each item
            paragraphs.push(new Paragraph({ text: "", spacing: { after: 120 } }))
        })

        return paragraphs
    }

    private createEducation(): Paragraph[] {
        const { sections } = this.resume
        if (!sections.education?.visible || !sections.education.items?.length) return []

        const paragraphs: Paragraph[] = [
            this.createSectionHeading(sections.education.name || 'Education')
        ]

        sections.education.items.forEach((item) => {
            if (!item.visible) return

            paragraphs.push(
                new Paragraph({
                    tabStops: [
                        {
                            type: TabStopType.RIGHT,
                            position: convertInchesToTwip(7.5)
                        }
                    ],
                    children: [
                        new TextRun({
                            text: item.institution,
                            bold: true,
                            font: FONTS.HEADING,
                            size: SIZES.BODY
                        }),
                        new TextRun({
                            children: [new Tab(), item.location || '']
                        })
                    ]
                })
            )

            paragraphs.push(
                new Paragraph({
                    spacing: { after: 120 },
                    tabStops: [
                        {
                            type: TabStopType.RIGHT,
                            position: convertInchesToTwip(7.5)
                        }
                    ],
                    children: [
                        new TextRun({
                            text: `${item.studyType} ${item.score ? `• ${item.score}` : ''}`,
                            italics: true,
                            font: FONTS.BODY,
                            size: SIZES.BODY
                        }),
                        new TextRun({
                            children: [new Tab(), item.date || '']
                        })
                    ]
                })
            )
        })

        return paragraphs
    }

    private createSkills(): Paragraph[] {
        const { sections } = this.resume
        if (!sections.skills?.visible || !sections.skills.items?.length) return []

        const paragraphs: Paragraph[] = [
            this.createSectionHeading(sections.skills.name || 'Skills')
        ]

        sections.skills.items.forEach((item) => {
            if (!item.visible) return

            const keywords = item.keywords?.join(', ') || ''

            paragraphs.push(
                new Paragraph({
                    spacing: { after: 60 },
                    children: [
                        new TextRun({
                            text: `${item.name}: `,
                            bold: true,
                            font: FONTS.HEADING,
                            size: SIZES.BODY
                        }),
                        new TextRun({
                            text: keywords,
                            font: FONTS.BODY,
                            size: SIZES.BODY
                        })
                    ]
                })
            )
        })

        return paragraphs
    }

    private parseHtmlBullets(html: string): Paragraph[] {
        // Very basic HTML parsing for <ul><li> structure
        // In a real app, might want a more robust parser
        const cleanHtml = html.replace(/<\/?p>/g, '').replace(/<\/?ul>/g, '')
        const items = cleanHtml.split('<li>').filter(i => i.trim())

        return items.map(item => {
            const text = item.replace('</li>', '').trim()
            return new Paragraph({
                text: text,
                bullet: {
                    level: 0
                },
                spacing: { after: 0 },
                run: {
                    font: FONTS.BODY,
                    size: SIZES.BODY
                }
            })
        })
    }
}
