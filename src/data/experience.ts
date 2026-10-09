type Experience = {
  id: string;
  company: string;
  organization?: string;
  role: string;
  status?: 'Incoming';
  period?: string;
  description: string;
  focus?: readonly string[];
};

// Additional roles and dates are summarized from public/resume.pdf.
// LinkedIn's public profile does not expose their full experience details.
export const experiences: readonly Experience[] = [
  {
    id: 'ibm',
    company: 'IBM',
    role: 'Hardware Engineering Intern',
    status: 'Incoming',
    description: 'Joining IBM for a hardware engineering internship.',
  },
  {
    id: 'uta-nsf-rtg',
    company: 'UTA',
    organization: 'University of Texas at Arlington',
    role: 'NSF RTG Undergraduate Researcher',
    period: 'Aug 2026 – Present',
    description: 'Participating in NSF-funded research training on mathematical modeling and computational methods for problems in human health.',
    focus: ['Mathematical modeling', 'Computational methods', 'Human health'],
  },
  {
    id: 'sase-research-mentor',
    company: 'SASE',
    organization: 'Society of Asian Scientists and Engineers',
    role: 'Research Interest Group Mentor',
    period: 'Aug 2026 – Present',
    description: 'Leading a student research group on distributed systems and reliable computing in Go, with weekly Scrum meetings to coordinate project work.',
    focus: ['Go', 'Distributed systems', 'Research mentorship'],
  },
  {
    id: 'acm-technical-staff',
    company: 'ACM',
    organization: 'Association for Computing Machinery',
    role: 'Member of Technical Staff',
    period: 'Aug 2026 – Present',
    description: 'Building and maintaining software tools for ACM student programs and events alongside other student developers.',
    focus: ['Software development', 'Student programs', 'Collaboration'],
  },
  {
    id: 'ibm-software-intern',
    company: 'IBM',
    role: 'Software Engineering Intern',
    period: 'May – Aug 2026',
    description: 'Built hardware monitoring across seven labs, with custom Python and Go exporters, containerized services, and automated device alerts.',
    focus: ['Python & Go', 'Hardware monitoring', 'Containerized services'],
  },
];
