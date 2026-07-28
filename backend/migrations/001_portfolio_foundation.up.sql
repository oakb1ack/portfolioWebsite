CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TYPE user_role AS ENUM ('admin', 'editor');
CREATE TYPE user_status AS ENUM ('active', 'disabled');
CREATE TYPE content_status AS ENUM ('draft', 'scheduled', 'published', 'archived');
CREATE TYPE project_stage AS ENUM ('current', 'completed', 'archived');
CREATE TYPE project_availability AS ENUM ('public', 'private');
CREATE TYPE project_link_kind AS ENUM ('github', 'live_demo', 'related_blog', 'paper', 'other');
CREATE TYPE contact_link_kind AS ENUM ('external', 'email');
CREATE TYPE taxonomy_kind AS ENUM ('tag', 'category');
CREATE TYPE redirect_content_type AS ENUM ('project', 'post');

CREATE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext NOT NULL UNIQUE,
  password_hash text NOT NULL,
  display_name text NOT NULL,
  role user_role NOT NULL DEFAULT 'admin',
  status user_status NOT NULL DEFAULT 'active',
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (length(trim(display_name)) BETWEEN 1 AND 160),
  CHECK (length(password_hash) >= 20)
);

CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_id_hash bytea NOT NULL UNIQUE,
  csrf_token_hash bytea NOT NULL,
  expires_at timestamptz NOT NULL,
  idle_expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  ip_address inet,
  user_agent text,
  CHECK (octet_length(token_id_hash) = 32),
  CHECK (octet_length(csrf_token_hash) = 32),
  CHECK (expires_at > created_at),
  CHECK (idle_expires_at > created_at),
  CHECK (idle_expires_at <= expires_at)
);

CREATE INDEX sessions_active_lookup_idx ON sessions (token_id_hash, expires_at, idle_expires_at)
  WHERE revoked_at IS NULL;
CREATE INDEX sessions_user_idx ON sessions (user_id, created_at DESC);

CREATE TABLE media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,
  storage_key text NOT NULL UNIQUE,
  original_filename text NOT NULL,
  mime_type text NOT NULL,
  byte_size bigint NOT NULL,
  sha256 bytea NOT NULL,
  width integer,
  height integer,
  alt_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (byte_size > 0),
  CHECK (octet_length(sha256) = 32),
  CHECK (width IS NULL OR width > 0),
  CHECK (height IS NULL OR height > 0),
  CHECK (length(trim(storage_key)) > 0),
  CHECK (length(trim(original_filename)) BETWEEN 1 AND 255),
  CHECK (length(trim(mime_type)) BETWEEN 1 AND 127)
);

CREATE TABLE taxonomy_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind taxonomy_kind NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, slug),
  UNIQUE (id, kind),
  CHECK (length(trim(name)) BETWEEN 1 AND 120),
  CHECK (slug = lower(slug) AND slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  summary text NOT NULL,
  role text NOT NULL DEFAULT '',
  technologies text[] NOT NULL DEFAULT '{}',
  outcome text NOT NULL DEFAULT '',
  body_markdown text NOT NULL DEFAULT '',
  body_html text NOT NULL DEFAULT '',
  content_status content_status NOT NULL DEFAULT 'draft',
  project_stage project_stage NOT NULL DEFAULT 'current',
  availability project_availability NOT NULL DEFAULT 'public',
  publish_at timestamptz,
  published_at timestamptz,
  archived_at timestamptz,
  slug_locked_at timestamptz,
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  hero_media_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (length(trim(title)) BETWEEN 1 AND 200),
  CHECK (length(trim(slug)) BETWEEN 1 AND 200 AND slug = lower(slug)),
  CHECK (length(trim(summary)) BETWEEN 1 AND 500),
  CHECK (length(role) <= 240),
  CHECK (length(outcome) <= 2000),
  CHECK (array_position(technologies, NULL) IS NULL),
  CHECK (content_status <> 'draft' OR (publish_at IS NULL AND published_at IS NULL AND archived_at IS NULL)),
  CHECK (content_status <> 'scheduled' OR (publish_at IS NOT NULL AND published_at IS NULL AND archived_at IS NULL)),
  CHECK (content_status <> 'published' OR (publish_at IS NOT NULL AND published_at IS NOT NULL AND archived_at IS NULL)),
  CHECK (content_status <> 'archived' OR (publish_at IS NULL AND archived_at IS NOT NULL))
);

CREATE INDEX projects_public_idx ON projects (publish_at DESC, sort_order, created_at DESC)
  WHERE content_status IN ('scheduled', 'published') AND availability = 'public';
CREATE INDEX projects_admin_status_idx ON projects (content_status, project_stage, updated_at DESC);

CREATE TABLE blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text NOT NULL,
  body_markdown text NOT NULL DEFAULT '',
  body_html text NOT NULL DEFAULT '',
  content_status content_status NOT NULL DEFAULT 'draft',
  publish_at timestamptz,
  published_at timestamptz,
  archived_at timestamptz,
  slug_locked_at timestamptz,
  reading_time_minutes integer NOT NULL DEFAULT 1,
  featured boolean NOT NULL DEFAULT false,
  featured_media_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (length(trim(title)) BETWEEN 1 AND 240),
  CHECK (length(trim(slug)) BETWEEN 1 AND 240 AND slug = lower(slug)),
  CHECK (length(trim(excerpt)) BETWEEN 1 AND 1000),
  CHECK (reading_time_minutes > 0),
  CHECK (content_status <> 'draft' OR (publish_at IS NULL AND published_at IS NULL AND archived_at IS NULL)),
  CHECK (content_status <> 'scheduled' OR (publish_at IS NOT NULL AND published_at IS NULL AND archived_at IS NULL)),
  CHECK (content_status <> 'published' OR (publish_at IS NOT NULL AND published_at IS NOT NULL AND archived_at IS NULL)),
  CHECK (content_status <> 'archived' OR (publish_at IS NULL AND archived_at IS NOT NULL))
);

CREATE INDEX blog_posts_public_idx ON blog_posts (publish_at DESC, created_at DESC)
  WHERE content_status IN ('scheduled', 'published');
CREATE INDEX blog_posts_admin_status_idx ON blog_posts (content_status, updated_at DESC);

CREATE TABLE project_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  label text NOT NULL,
  url text NOT NULL,
  link_kind project_link_kind NOT NULL DEFAULT 'other',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, url),
  CHECK (length(trim(label)) BETWEEN 1 AND 120),
  CHECK (url ~* '^https?://')
);
CREATE INDEX project_links_public_idx ON project_links (project_id, sort_order, label);

CREATE TABLE project_tags (
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  term_id uuid NOT NULL REFERENCES taxonomy_terms(id) ON DELETE CASCADE,
  term_kind taxonomy_kind NOT NULL DEFAULT 'tag' CHECK (term_kind = 'tag'),
  PRIMARY KEY (project_id, term_id),
  FOREIGN KEY (term_id, term_kind) REFERENCES taxonomy_terms(id, kind) ON DELETE CASCADE
);
CREATE TABLE project_categories (
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  term_id uuid NOT NULL REFERENCES taxonomy_terms(id) ON DELETE CASCADE,
  term_kind taxonomy_kind NOT NULL DEFAULT 'category' CHECK (term_kind = 'category'),
  PRIMARY KEY (project_id, term_id),
  FOREIGN KEY (term_id, term_kind) REFERENCES taxonomy_terms(id, kind) ON DELETE CASCADE
);
CREATE TABLE post_tags (
  post_id uuid NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  term_id uuid NOT NULL REFERENCES taxonomy_terms(id) ON DELETE CASCADE,
  term_kind taxonomy_kind NOT NULL DEFAULT 'tag' CHECK (term_kind = 'tag'),
  PRIMARY KEY (post_id, term_id),
  FOREIGN KEY (term_id, term_kind) REFERENCES taxonomy_terms(id, kind) ON DELETE CASCADE
);
CREATE TABLE post_categories (
  post_id uuid NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  term_id uuid NOT NULL REFERENCES taxonomy_terms(id) ON DELETE CASCADE,
  term_kind taxonomy_kind NOT NULL DEFAULT 'category' CHECK (term_kind = 'category'),
  PRIMARY KEY (post_id, term_id),
  FOREIGN KEY (term_id, term_kind) REFERENCES taxonomy_terms(id, kind) ON DELETE CASCADE
);

CREATE INDEX project_tags_term_idx ON project_tags (term_id, project_id);
CREATE INDEX project_categories_term_idx ON project_categories (term_id, project_id);
CREATE INDEX post_tags_term_idx ON post_tags (term_id, post_id);
CREATE INDEX post_categories_term_idx ON post_categories (term_id, post_id);

CREATE TABLE profile (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  display_name text NOT NULL,
  headline text NOT NULL,
  education text NOT NULL DEFAULT '',
  current_position text NOT NULL DEFAULT '',
  statement text NOT NULL DEFAULT '',
  bio_markdown text NOT NULL DEFAULT '',
  bio_html text NOT NULL DEFAULT '',
  resume_media_id uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (length(trim(display_name)) BETWEEN 1 AND 160),
  CHECK (length(trim(headline)) <= 240)
);

CREATE TABLE contact_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  kind contact_link_kind NOT NULL DEFAULT 'external',
  url text NOT NULL,
  icon_key text,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (length(trim(label)) BETWEEN 1 AND 80),
  CHECK ((kind = 'external' AND url ~* '^https?://')
      OR (kind = 'email' AND url ~* '^mailto:[^@[:space:]]+@[^@[:space:]]+$')),
  UNIQUE (url)
);
CREATE INDEX contact_links_public_idx ON contact_links (sort_order, label) WHERE is_visible;

CREATE TABLE slug_redirects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type redirect_content_type NOT NULL,
  old_slug text NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  post_id uuid REFERENCES blog_posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (content_type, old_slug),
  CHECK (old_slug = lower(old_slug) AND old_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CHECK ((content_type = 'project' AND project_id IS NOT NULL AND post_id IS NULL)
      OR (content_type = 'post' AND post_id IS NOT NULL AND project_id IS NULL))
);

CREATE FUNCTION lock_published_slug() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.slug_locked_at IS NOT NULL AND NEW.slug <> OLD.slug THEN
    RAISE EXCEPTION 'published slugs are immutable';
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.content_status = 'scheduled'
     AND OLD.publish_at IS NOT NULL AND OLD.publish_at <= now()
     AND NEW.slug <> OLD.slug THEN
    RAISE EXCEPTION 'scheduled slugs are immutable once public';
  END IF;
  IF NEW.content_status = 'scheduled' AND NEW.publish_at IS NOT NULL
     AND NEW.publish_at <= now() AND TG_OP = 'UPDATE'
     AND NEW.slug <> OLD.slug THEN
    RAISE EXCEPTION 'scheduled slugs are immutable once public';
  END IF;
  IF NEW.content_status = 'scheduled' AND NEW.publish_at IS NOT NULL
     AND NEW.publish_at <= now() AND NEW.slug_locked_at IS NULL THEN
    NEW.slug_locked_at = now();
  END IF;
  IF NEW.content_status = 'published' AND NEW.slug_locked_at IS NULL THEN
    NEW.slug_locked_at = CASE WHEN TG_OP = 'UPDATE' THEN OLD.slug_locked_at ELSE NULL END;
    NEW.slug_locked_at = COALESCE(NEW.slug_locked_at, now());
  END IF;
  IF NEW.content_status = 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at = now();
  END IF;
  IF NEW.content_status = 'archived' AND NEW.archived_at IS NULL THEN
    NEW.archived_at = now();
  ELSIF NEW.content_status <> 'archived' THEN
    NEW.archived_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER taxonomy_terms_updated_at BEFORE UPDATE ON taxonomy_terms FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER media_assets_updated_at BEFORE UPDATE ON media_assets FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER projects_slug_lock BEFORE INSERT OR UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION lock_published_slug();
CREATE TRIGGER blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER blog_posts_slug_lock BEFORE INSERT OR UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION lock_published_slug();
CREATE TRIGGER project_links_updated_at BEFORE UPDATE ON project_links FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER profile_updated_at BEFORE UPDATE ON profile FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER contact_links_updated_at BEFORE UPDATE ON contact_links FOR EACH ROW EXECUTE FUNCTION set_updated_at();
