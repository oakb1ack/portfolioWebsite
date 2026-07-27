export type ProjectStatus = 'current' | 'completed' | 'archived';

export interface ProjectLink {
  label: 'GitHub' | 'Related blog post' | 'Live demo' | 'Paper';
  url: string;
}

export interface Project {
  slug: string;
  title: string;
  summary: string;
  image: {
    src: string;
    alt: string;
  };
  outcome: string;
  role: string;
  technologies: string[];
  status: ProjectStatus;
  availability?: 'public' | 'private';
  featured?: boolean;
  publishedAt?: string;
  sections: ProjectSection[];
  links: ProjectLink[];
}

export interface ProjectSection {
  heading: string;
  body: string;
}
