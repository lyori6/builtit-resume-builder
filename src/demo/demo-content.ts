"use client"

import { ResumeData } from '@/lib/resume-types'

export const SAMPLE_RESUME_TEXT = `Jane Smith
Senior Software Engineer
jane.smith@email.com | (555) 123-4567 | Seattle, WA

PROFESSIONAL SUMMARY
Experienced software engineer with 5 years in full-stack development. Specialized in building scalable web applications using React, Node.js, and cloud technologies.

EXPERIENCE

Senior Software Engineer | TechCorp Inc | June 2021 - Present
• Led development of customer dashboard serving 50,000+ users
• Reduced application load time by 40% through performance optimization
• Mentored team of 3 junior developers
• Implemented CI/CD pipeline reducing deployment time by 60%

Software Engineer | StartupXYZ | Jan 2019 - May 2021
• Built RESTful APIs handling 1M+ requests daily
• Collaborated with design team on user interface improvements
• Maintained 99.9% uptime for production services

EDUCATION
B.S. Computer Science | University of Washington | 2018

SKILLS
JavaScript, React, Node.js, Python, AWS, Docker, SQL, Git, Agile`

const DEMO_ORIGINAL_RESUME: ResumeData = {
  basics: {
    name: 'Jane Smith',
    headline: 'Senior Software Engineer',
    email: 'jane.smith@email.com',
    phone: '(555) 123-4567',
    location: 'Seattle, WA'
  },
  sections: {
    summary: {
      id: 'summary',
      name: 'Professional Summary',
      visible: true,
      content:
        '<p>Experienced full-stack engineer delivering reliable web applications with React, Node.js, and AWS. Passionate about clean architecture and collaborating with cross-functional teams.</p>'
    },
    experience: {
      id: 'experience',
      name: 'Experience',
      visible: true,
      items: [
        {
          id: 'exp-techcorp',
          visible: true,
          company: 'TechCorp Inc',
          position: 'Senior Software Engineer',
          location: 'Seattle, WA',
          date: 'June 2021 – Present',
          summary:
            '<ul><li>Lead engineer for customer insights dashboard serving 50K monthly users.</li><li>Partner with design and product to prioritize quarterly roadmap.</li><li>Mentor three junior engineers through pairing and code reviews.</li></ul>'
        },
        {
          id: 'exp-startupxyz',
          visible: true,
          company: 'StartupXYZ',
          position: 'Software Engineer',
          location: 'Seattle, WA',
          date: 'Jan 2019 – May 2021',
          summary:
            '<ul><li>Built RESTful APIs that powered mobile and web clients.</li><li>Improved reliability of core services through monitoring and alerting.</li><li>Supported production incidents as part of on-call rotation.</li></ul>'
        }
      ]
    },
    skills: {
      id: 'skills',
      name: 'Skills',
      visible: true,
      items: [
        {
          id: 'skill-frontend',
          visible: true,
          name: 'Frontend',
          keywords: ['React', 'TypeScript', 'Tailwind CSS']
        },
        {
          id: 'skill-backend',
          visible: true,
          name: 'Backend',
          keywords: ['Node.js', 'Express', 'REST APIs']
        },
        {
          id: 'skill-devops',
          visible: true,
          name: 'DevOps',
          keywords: ['AWS', 'Docker', 'CI/CD']
        }
      ]
    },
    education: {
      id: 'education',
      name: 'Education',
      visible: true,
      items: [
        {
          id: 'edu-uw',
          visible: true,
          institution: 'University of Washington',
          studyType: 'B.S. Computer Science',
          date: '2014 – 2018',
          location: 'Seattle, WA',
          score: 'GPA: 3.7'
        }
      ]
    }
  }
}

const DEMO_OPTIMIZED_RESUME: ResumeData = {
  basics: {
    name: 'Jane Smith',
    headline: 'Senior Software Engineer | Cloud Infrastructure Specialist',
    email: 'jane.smith@email.com',
    phone: '(555) 123-4567',
    location: 'Seattle, WA'
  },
  sections: {
    summary: {
      id: 'summary',
      name: 'Professional Summary',
      visible: true,
      content:
        '<p>Senior software engineer with 5+ years leading cloud infrastructure and full-stack projects. Blends hands-on React and Node.js development with AWS automation, CI/CD ownership, and team leadership. Trusted partner to product and design for delivering resilient features that serve 50K+ users.</p>'
    },
    experience: {
      id: 'experience',
      name: 'Experience',
      visible: true,
      items: [
        {
          id: 'exp-techcorp',
          visible: true,
          company: 'TechCorp Inc',
          position: 'Senior Software Engineer | Cloud Platform Lead',
          location: 'Seattle, WA',
          date: 'June 2021 – Present',
          summary:
            '<ul><li>Owned React and Node.js platform powering customer analytics dashboard for 50K monthly users; improved page load speed by 40% by tuning GraphQL resolvers and React suspense boundaries.</li><li>Automated AWS infrastructure with Terraform and containerized services with Docker + ECS, increasing deployment consistency across dev/stage/prod.</li><li>Redesigned CI/CD pipeline to enable 20-minute releases and introduced blue/green strategy that cut rollback time by 60%.</li><li>Lead and mentor a team of 3 engineers, defining quarterly OKRs and pairing on complex system designs.</li></ul>'
        },
        {
          id: 'exp-startupxyz',
          visible: true,
          company: 'StartupXYZ',
          position: 'Software Engineer',
          location: 'Seattle, WA',
          date: 'Jan 2019 – May 2021',
          summary:
            '<ul><li>Developed Node.js microservices handling 1M+ daily requests with 99.95% uptime; integrated observability stack (Datadog, Grafana) to reduce mean time to recovery by 35%.</li><li>Shipped React component library that unified UI patterns across three customer-facing apps and accelerated feature delivery for the team.</li><li>Partnered with product to translate job requirements into backlog, running weekly grooming and guiding sprint commitments.</li></ul>'
        }
      ]
    },
    skills: {
      id: 'skills',
      name: 'Skills',
      visible: true,
      items: [
        {
          id: 'skill-frontend',
          visible: true,
          name: 'Frontend',
          keywords: ['React', 'TypeScript', 'Next.js', 'Performance Optimization']
        },
        {
          id: 'skill-backend',
          visible: true,
          name: 'Backend',
          keywords: ['Node.js', 'GraphQL', 'REST APIs', 'Microservices']
        },
        {
          id: 'skill-devops',
          visible: true,
          name: 'DevOps & Cloud',
          keywords: ['AWS', 'Docker', 'Terraform', 'CI/CD', 'Monitoring']
        }
      ]
    },
    education: {
      id: 'education',
      name: 'Education',
      visible: true,
      items: [
        {
          id: 'edu-uw',
          visible: true,
          institution: 'University of Washington',
          studyType: 'B.S. Computer Science',
          date: '2014 – 2018',
          location: 'Seattle, WA',
          score: 'GPA: 3.7'
        }
      ]
    }
  }
}

export const DEMO_OPTIMIZATION = {
  sampleText: SAMPLE_RESUME_TEXT,
  jobDescription: `Senior Software Engineer – Cloud Infrastructure

TechCorp is expanding our cloud infrastructure team and looking for a senior engineer who can lead large-scale initiatives end-to-end. You will design and ship resilient React and Node.js experiences while mentoring a small team.

Must have:
- 5+ years in full-stack JavaScript (React, Node.js, TypeScript)
- Deep experience deploying to AWS with Docker or Kubernetes
- Proven ownership of CI/CD automation and release pipelines
- Track record collaborating with design and product partners
- Comfort leading code reviews and guiding junior engineers

Nice to have:
- Experience with GraphQL or gRPC
- Terraform or similar infrastructure-as-code tooling
- Observability stack ownership (Datadog, Prometheus, Grafana)

What success looks like:
- Ship new analytics capabilities to 50K+ customers without downtime
- Reduce deployment time from hours to minutes
- Coach teammates through complex architectural decisions`,
  originalResume: DEMO_ORIGINAL_RESUME,
  optimizedResume: DEMO_OPTIMIZED_RESUME,
  metadata: {
    improvements_count: 12,
    keywords_matched: [
      'React',
      'Node.js',
      'AWS',
      'Docker',
      'CI/CD',
      'Terraform',
      'GraphQL',
      'Team leadership'
    ],
    word_count: 2475,
    processing_time_seconds: 18,
    changes: [
      {
        type: 'modified',
        section: 'Professional Summary',
        before:
          'Experienced full-stack engineer delivering reliable web applications with React, Node.js, and AWS. Passionate about clean architecture and collaborating with cross-functional teams.',
        after:
          'Senior software engineer with 5+ years leading cloud infrastructure and full-stack projects. Blends hands-on React and Node.js development with AWS automation, CI/CD ownership, and team leadership.',
        reason: 'Aligned summary with cloud infrastructure leadership focus highlighted in the job post.'
      },
      {
        type: 'modified',
        section: 'TechCorp Inc',
        before: 'Lead engineer for customer insights dashboard serving 50K monthly users.',
        after:
          'Owned React and Node.js platform powering customer analytics dashboard for 50K monthly users; improved page load speed by 40% by tuning GraphQL resolvers and React suspense boundaries.',
        reason: 'Showed measurable impact and highlighted React/Node.js stack depth.'
      },
      {
        type: 'added',
        section: 'TechCorp Inc',
        description:
          'Introduced bullet about automating AWS infrastructure with Terraform and Docker to mirror infrastructure-as-code requirement.'
      },
      {
        type: 'modified',
        section: 'StartupXYZ',
        before: 'Built RESTful APIs that powered mobile and web clients.',
        after:
          'Developed Node.js microservices handling 1M+ daily requests with 99.95% uptime; integrated observability stack (Datadog, Grafana) to reduce mean time to recovery by 35%.',
        reason: 'Added scale metrics and observability ownership mentioned in job posting.'
      },
      {
        type: 'modified',
        section: 'Skills',
        before: 'Backend — Node.js, Express, REST APIs',
        after: 'Backend — Node.js, GraphQL, REST APIs, Microservices',
        reason: 'Highlighted GraphQL experience requested in role.'
      }
    ]
  },
  diffItems: [
    {
      path: ['sections', 'summary', 'content'],
      before: 'Experienced full-stack engineer delivering reliable web applications with React, Node.js, and AWS. Passionate about clean architecture and collaborating with cross-functional teams.',
      after: 'Senior software engineer with 5+ years leading cloud infrastructure and full-stack projects. Blends hands-on React and Node.js development with AWS automation, CI/CD ownership, and team leadership. Trusted partner to product and design for delivering resilient features that serve 50K+ users.'
    },
    {
      path: ['sections', 'experience', 'items', '0', 'summary'],
      before: '<ul><li>Lead engineer for customer insights dashboard serving 50K monthly users.</li><li>Partner with design and product to prioritize quarterly roadmap.</li><li>Mentor three junior engineers through pairing and code reviews.</li></ul>',
      after: '<ul><li>Owned React and Node.js platform powering customer analytics dashboard for 50K monthly users; improved page load speed by 40% by tuning GraphQL resolvers and React suspense boundaries.</li><li>Automated AWS infrastructure with Terraform and containerized services with Docker + ECS, increasing deployment consistency across dev/stage/prod.</li><li>Redesigned CI/CD pipeline to enable 20-minute releases and introduced blue/green strategy that cut rollback time by 60%.</li><li>Lead and mentor a team of 3 engineers, defining quarterly OKRs and pairing on complex system designs.</li></ul>'
    },
    {
      path: ['sections', 'skills', 'items', '1', 'keywords'],
      before: 'Node.js, Express, REST APIs',
      after: 'Node.js, GraphQL, REST APIs, Microservices'
    }
  ]
}

export type DemoOptimization = typeof DEMO_OPTIMIZATION
