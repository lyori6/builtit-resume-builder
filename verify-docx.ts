import { DocxGenerator } from './lib/docx-generator'
import { ResumeData } from './lib/resume-types'
import fs from 'fs'
import path from 'path'

const mockResume: ResumeData = {
    basics: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        location: 'San Francisco, CA',
        url: { href: 'https://johndoe.com' },
        profiles: [
            { network: 'LinkedIn', url: 'https://linkedin.com/in/johndoe' }
        ]
    },
    sections: {
        summary: {
            id: 'summary',
            name: 'Summary',
            visible: true,
            content: '<p>Experienced software engineer with a passion for building scalable applications.</p>'
        },
        experience: {
            id: 'experience',
            name: 'Experience',
            visible: true,
            items: [
                {
                    id: 'exp-1',
                    visible: true,
                    company: 'Tech Corp',
                    position: 'Senior Engineer',
                    location: 'San Francisco, CA',
                    date: '2020 - Present',
                    summary: '<ul><li>Led development of core platform features.</li><li>Mentored junior engineers.</li></ul>'
                }
            ]
        },
        education: {
            id: 'education',
            name: 'Education',
            visible: true,
            items: [
                {
                    id: 'edu-1',
                    visible: true,
                    institution: 'University of Technology',
                    studyType: 'BS Computer Science',
                    date: '2016 - 2020',
                    location: 'Boston, MA'
                }
            ]
        },
        skills: {
            id: 'skills',
            name: 'Skills',
            visible: true,
            items: [
                {
                    id: 'skill-1',
                    visible: true,
                    name: 'Languages',
                    keywords: ['TypeScript', 'Python', 'Go']
                }
            ]
        },
        projects: {
            id: 'projects',
            name: 'Projects',
            visible: true,
            items: [
                {
                    id: 'proj-1',
                    visible: true,
                    name: 'Resume Builder',
                    description: 'A tool to build resumes.',
                    date: '2023'
                }
            ]
        }
    }
}

async function verify() {
    try {
        console.log('Starting DOCX generation verification...')
        const generator = new DocxGenerator(mockResume)
        const blob = await generator.generate()

        // Convert Blob to Buffer (Node.js environment)
        const buffer = Buffer.from(await blob.arrayBuffer())

        const outputPath = path.join(process.cwd(), 'test-resume.docx')
        fs.writeFileSync(outputPath, buffer)

        console.log(`Successfully generated DOCX file at: ${outputPath}`)
        console.log(`File size: ${buffer.length} bytes`)

        if (buffer.length > 0) {
            console.log('Verification SUCCESS')
        } else {
            console.error('Verification FAILED: File is empty')
            process.exit(1)
        }

    } catch (error) {
        console.error('Verification FAILED:', error)
        process.exit(1)
    }
}

verify()
