export const projectDisciplines = [
  'software',
  'systems',
  'infrastructure',
  'electronics',
  'mathematics',
  'research',
] as const;

export type ProjectDiscipline = (typeof projectDisciplines)[number];

export const projectStatuses = ['complete', 'ongoing'] as const;

export type ProjectStatus = (typeof projectStatuses)[number];

export const projectMediaKinds = [
  'screenshot',
  'photograph',
  'diagram',
  'plot',
  'schematic',
] as const;

export type ProjectMediaKind = (typeof projectMediaKinds)[number];

export interface ProjectLink {
  label: string;
  href: string;
}

export interface ProjectMedia {
  src: string;
  alt: string;
  kind: ProjectMediaKind;
  caption?: string;
}

export interface ProjectMetadata {
  slug: string;
  title: string;
  summary: string;
  period: string;
  status: ProjectStatus;
  featured: boolean;
  featuredOrder?: number;
  disciplines: ProjectDiscipline[];
  technologies: string[];
  role: string;
  outcome: string;
  links: ProjectLink[];
  media: ProjectMedia[];
}

export interface Project extends ProjectMetadata {
  body: string;
}
