export interface NavigationItem {
  label: string;
  href: string;
}

export interface ExternalProfile {
  label: string;
  href: string;
  handle: string;
}

export const site = {
  name: 'Ali Alfridawi',
  title: 'Ali Alfridawi — Mathematics + Electrical Engineering',
  description:
    'The portfolio of Ali Alfridawi, a Mathematics and Electrical Engineering student exploring mathematics, electronics, and computing.',
  url: 'https://alialfridawi.dev',
  email: 'ali.muhsin.alfridawi@gmail.com',
  resumeHref: '/resume.pdf',
  navigation: [
    { label: 'About', href: '/about' },
    { label: 'Projects', href: '/projects' },
    { label: 'Experience', href: '/experience' },
    { label: 'Contact', href: '/contact' },
  ] satisfies NavigationItem[],
  profiles: [
    {
      label: 'GitHub',
      href: 'https://github.com/AliAlfridawi',
      handle: '@AliAlfridawi',
    },
    {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/alialfridawi/',
      handle: 'alialfridawi',
    },
  ] satisfies ExternalProfile[],
} as const;

export const profile = {
  eyebrow: 'Mathematics + Electrical Engineering',
  headline: 'Curious about mathematics, electronics, and computing.',
  introduction:
    'I’m a double-major student at the University of Texas at Arlington. I explore the ideas that connect mathematical models, physical systems, and reliable software.',
  shortBio:
    'My work spans reliability engineering, infrastructure, mathematical research, and software systems. I care about understanding how things behave, then making that behavior observable and dependable.',
  interests: [
    'Mathematical modeling',
    'Reliable and distributed systems',
    'Electronics and physical computing',
    'Observability and infrastructure',
  ],
} as const;
