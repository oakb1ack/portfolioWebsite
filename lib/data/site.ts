interface NavigationItem {
  label: string;
  href: string;
}

interface ExternalProfile {
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
    { label: 'Résumé', href: '/resume' },
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
  headline: 'Ali Alfridawi',
} as const;
