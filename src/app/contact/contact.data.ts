export type ContactLink =
  | {
      label: 'GitHub' | 'LinkedIn';
      kind: 'external';
      url: string;
    }
  | {
      label: 'Email';
      kind: 'email';
    };

export const CONTACT_EMAIL = 'ali.muhsin.alfridawi@gmail.com';

export const contactLinks = [
  {
    label: 'GitHub',
    kind: 'external',
    url: 'https://github.com/AliAlfridawi',
  },
  {
    label: 'LinkedIn',
    kind: 'external',
    url: 'https://www.linkedin.com/in/alialfridawi/',
  },
  {
    label: 'Email',
    kind: 'email',
  },
] as const satisfies readonly ContactLink[];
