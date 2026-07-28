export type ContentStatus = 'draft' | 'scheduled' | 'published' | 'archived';
export type TaxonomyKind = 'tags' | 'categories';

export interface ApiProblem {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string>;
}

export interface PageResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface SessionInfo {
  authenticated: boolean;
  expires_at?: string;
}

export interface ProjectLink {
  kind: 'github' | 'live_demo' | 'related_blog' | 'paper' | 'other';
  label: string;
  url: string;
  sort_order: number;
}

export interface ContentFields {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body_html: string;
  body_markdown: string;
  status: ContentStatus;
  publish_at?: string | null;
  published_at?: string | null;
  archived_at?: string | null;
  featured_media_id?: string | null;
  featured: boolean;
  tags: string[];
  categories: string[];
  tag_ids: string[];
  category_ids: string[];
  updated_at: string;
}

export interface AdminProject extends ContentFields {
  outcome: string;
  role: string;
  technologies: string[];
  stage: 'current' | 'completed' | 'archived';
  availability: 'public' | 'private';
  links: ProjectLink[];
  sort_order: number;
}

export interface AdminPost extends ContentFields {
  reading_time_minutes: number;
}

export interface AdminProfile {
  id: string;
  name: string;
  headline: string;
  education: string;
  current_role: string;
  statement: string;
  bio_html: string;
  bio_markdown: string;
  resume_media_id?: string | null;
  updated_at: string;
}

export interface ContactLink {
  id: string;
  label: string;
  kind: 'external' | 'email';
  url: string;
  icon_key: string;
  sort_order: number;
  is_visible: boolean;
  updated_at: string;
}

export interface TaxonomyTerm {
  id: string;
  kind: TaxonomyKind;
  name: string;
  slug: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface AdminMedia {
  id: string;
  public_url: string;
  mime_type: string;
  width?: number;
  height?: number;
  alt_text: string;
  original_name: string;
  size_bytes: number;
  created_at: string;
  updated_at: string;
}

export type ProjectInput = Omit<
  AdminProject,
  'id' | 'body_html' | 'published_at' | 'archived_at' | 'tags' | 'categories' | 'updated_at'
> & { expected_updated_at?: string };

export type PostInput = Omit<
  AdminPost,
  'id' | 'body_html' | 'published_at' | 'archived_at' | 'tags' | 'categories' | 'updated_at'
> & { expected_updated_at?: string };

export type ProfileInput = Omit<AdminProfile, 'id' | 'bio_html' | 'updated_at'> & {
  expected_updated_at: string;
};

export type ContactLinkInput = Omit<ContactLink, 'id' | 'updated_at'> & {
  expected_updated_at?: string;
};

export type TaxonomyInput = Pick<TaxonomyTerm, 'name' | 'slug' | 'description'> & {
  expected_updated_at?: string;
};
