import { Project } from '../models/project.model';

// Projects will be added here temporarily until the API and admin workflow exist.
export const projects: Project[] = [
  {
    slug: 'portfolio-website',
    title: 'Portfolio Website',
    summary:
      'A restrained, editorial portfolio for presenting software projects, writing, and research.',
    image: {
      src: '/portfolio-homepage.png',
      alt: 'Homepage of Ali Alfridawi’s portfolio website',
    },
    outcome:
      'A responsive Angular foundation with reusable project pages and room to grow into a publishing platform.',
    role: 'Designer & developer',
    technologies: ['Angular', 'TypeScript', 'SCSS'],
    status: 'current',
    availability: 'public',
    featured: true,
    sections: [
      {
        heading: 'Overview',
        body: 'I designed and built this portfolio to give my technical work a clear, focused home. The visual system uses editorial typography, generous space, and a restrained palette so the projects remain the center of attention.',
      },
      {
        heading: 'Built to evolve',
        body: 'The frontend uses reusable Angular components and structured project data today, with routes and content models ready for a future API-backed publishing workflow.',
      },
    ],
    links: [
      {
        label: 'GitHub',
        url: 'https://github.com/AliAlfridawi/portfolioWebsite',
      },
    ],
  },
];
