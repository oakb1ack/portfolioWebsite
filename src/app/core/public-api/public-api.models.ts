export interface PageResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface PageQuery {
  limit?: number;
  offset?: number;
}

export interface TaxonomyQuery {
  tag?: string;
  category?: string;
}

export type ContentListQuery = PageQuery & TaxonomyQuery;

export interface ApiProblem {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string>;
}

export type ProjectStage = 'current' | 'completed' | 'archived';
export type ProjectAvailability = 'public' | 'private';

export interface ProjectLink {
  kind: string;
  label: string;
  url: string;
  sort_order: number;
}

export interface PublicProject {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body_html: string;
  published_at?: string;
  featured_media_id?: string;
  featured: boolean;
  tags: string[];
  categories: string[];
  outcome: string;
  role: string;
  technologies?: string[];
  stage: ProjectStage;
  availability: ProjectAvailability;
  links?: ProjectLink[];
  sort_order: number;
}

export interface PublicPost {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body_html: string;
  published_at?: string;
  featured_media_id?: string;
  featured: boolean;
  tags: string[];
  categories: string[];
  reading_time_minutes: number;
}

export interface PublicProfile {
  id: string;
  name: string;
  headline: string;
  education: string;
  current_role: string;
  statement: string;
  bio_html: string;
  resume_media_id?: string;
}

export type ContactLinkKind = 'external' | 'email';

export interface PublicContactLink {
  id: string;
  label: string;
  kind: ContactLinkKind;
  url: string;
  icon_key: string;
  sort_order: number;
}
