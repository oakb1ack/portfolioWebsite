export interface TimelineEntry {
  organization: string;
  role: string;
  location: string;
  period: string;
  summary: string;
  highlights: readonly string[];
}

export interface EducationEntry {
  institution: string;
  location: string;
  credential: string;
  period: string;
}

export interface SkillGroup {
  label: string;
  items: readonly string[];
}

export const education = [
  {
    institution: 'University of Texas at Arlington',
    location: 'Arlington, Texas',
    credential: 'Double major in Mathematics and Electrical Engineering (B.S.)',
    period: 'Expected May 2028',
  },
] as const satisfies readonly EducationEntry[];

export const experience = [
  {
    organization: 'University of Texas at Arlington',
    role: 'NSF RTG Undergraduate Researcher',
    location: 'Arlington, Texas',
    period: 'August 2026 — Present',
    summary:
      'Interdisciplinary research training in mathematical and computational methods for problems in human health.',
    highlights: [
      'Selected for an NSF-funded Research Training Group.',
      'Participate in training spanning mathematical modeling and computational methods.',
    ],
  },
  {
    organization: 'IBM',
    role: 'Software Engineering Intern',
    location: 'Houston, Texas',
    period: 'May 2026 — August 2026',
    summary:
      'Developed a full-stack hardware-monitoring system across seven labs, reducing undetected lab failures by 90%.',
    highlights: [
      'Engineered two custom Prometheus exporters in Python and Go and built more than 20 hardware health checks.',
      'Containerized and deployed six production services with Podman Compose for reproducible lab deployments.',
      'Implemented automated Slack alerts through Prometheus Alertmanager for more than 50 devices.',
      'Detected and resolved two critical temperature incidents through real-time monitoring, preventing hardware damage.',
    ],
  },
] as const satisfies readonly TimelineEntry[];

export const leadership = [
  {
    organization: 'Society of Asian Scientists and Engineers',
    role: 'Research Interest Group Mentor',
    location: 'Arlington, Texas',
    period: '2026 — Present',
    summary:
      'Lead a student research group exploring distributed systems and reliable computing in Go.',
    highlights: [
      'Lead weekly Scrum meetings to coordinate progress, technical priorities, and team deliverables.',
    ],
  },
  {
    organization: 'Association for Computing Machinery',
    role: 'Member of Technical Staff',
    location: 'Arlington, Texas',
    period: '2026 — Present',
    summary:
      'Contribute to technical initiatives and software projects supporting ACM student programs and events.',
    highlights: [
      'Collaborate with student developers to plan, build, and maintain tools for the campus computing community.',
    ],
  },
] as const satisfies readonly TimelineEntry[];

export const skillGroups = [
  {
    label: 'Languages',
    items: [
      'Go',
      'C++',
      'Python',
      'Java',
      'TypeScript / JavaScript',
      'HTML / CSS',
      'SQL',
      'Bash',
    ],
  },
  {
    label: 'Frameworks',
    items: ['Gin', 'Chi', 'FastAPI', 'Flask', 'React', 'Node.js', 'Angular'],
  },
  {
    label: 'Data',
    items: ['PostgreSQL', 'Prometheus TSDB', 'TimescaleDB', 'Redis', 'SQLite'],
  },
  {
    label: 'Infrastructure',
    items: [
      'Linux',
      'Docker',
      'Podman Compose',
      'Prometheus',
      'Grafana',
      'Alertmanager',
      'Nginx',
      'Tailscale',
    ],
  },
  {
    label: 'Tools',
    items: ['Git', 'GitHub Actions', 'CMake', 'GDB', 'curl', 'Neovim'],
  },
] as const satisfies readonly SkillGroup[];
