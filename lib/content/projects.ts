import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { parseFrontmatter } from './frontmatter';
import {
  projectDisciplines,
  projectMediaKinds,
  projectStatuses,
  type Project,
  type ProjectDiscipline,
  type ProjectLink,
  type ProjectMedia,
  type ProjectMetadata,
  type ProjectStatus,
} from './types';

const projectsDirectory = path.join(process.cwd(), 'content', 'projects');
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

let projectCache: Project[] | undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function fail(source: string, field: string, expectation: string): never {
  throw new Error(`${source}: ${field} ${expectation}`);
}

function requireString(value: unknown, source: string, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    fail(source, field, 'must be a non-empty string');
  }

  return value.trim();
}

function requireBoolean(value: unknown, source: string, field: string): boolean {
  if (typeof value !== 'boolean') {
    fail(source, field, 'must be a boolean');
  }

  return value;
}

function requireStringList(value: unknown, source: string, field: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    fail(source, field, 'must be a non-empty array');
  }

  const entries = value.map((entry, index) =>
    requireString(entry, source, `${field}[${index}]`),
  );

  if (new Set(entries).size !== entries.length) {
    fail(source, field, 'must not contain duplicate values');
  }

  return entries;
}

function requireEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  source: string,
  field: string,
): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    fail(source, field, `must be one of: ${allowed.join(', ')}`);
  }

  return value as T;
}

function validateLinks(value: unknown, source: string): ProjectLink[] {
  if (!Array.isArray(value)) {
    fail(source, 'links', 'must be an array');
  }

  return value.map((link, index) => {
    if (!isRecord(link)) {
      fail(source, `links[${index}]`, 'must be an object');
    }

    const label = requireString(link.label, source, `links[${index}].label`);
    const href = requireString(link.href, source, `links[${index}].href`);

    let url: URL;
    try {
      url = new URL(href);
    } catch {
      fail(source, `links[${index}].href`, 'must be an absolute URL');
    }

    if (url.protocol !== 'https:') {
      fail(source, `links[${index}].href`, 'must use https');
    }

    return { label, href };
  });
}

function validateMedia(value: unknown, source: string): ProjectMedia[] {
  if (!Array.isArray(value)) {
    fail(source, 'media', 'must be an array');
  }

  return value.map((item, index) => {
    if (!isRecord(item)) {
      fail(source, `media[${index}]`, 'must be an object');
    }

    const src = requireString(item.src, source, `media[${index}].src`);
    if (!src.startsWith('/')) {
      fail(source, `media[${index}].src`, 'must be a root-relative path');
    }

    const media: ProjectMedia = {
      src,
      alt: requireString(item.alt, source, `media[${index}].alt`),
      kind: requireEnum(item.kind, projectMediaKinds, source, `media[${index}].kind`),
    };

    if (item.caption !== undefined) {
      media.caption = requireString(item.caption, source, `media[${index}].caption`);
    }

    return media;
  });
}

function validateMetadata(data: unknown, source: string): ProjectMetadata {
  if (!isRecord(data)) {
    fail(source, 'frontmatter', 'must be an object');
  }

  const slug = requireString(data.slug, source, 'slug');
  if (!slugPattern.test(slug)) {
    fail(source, 'slug', 'must be lower-case kebab-case');
  }

  const featured = requireBoolean(data.featured, source, 'featured');
  let featuredOrder: number | undefined;
  if (data.featuredOrder !== undefined) {
    if (!Number.isInteger(data.featuredOrder) || (data.featuredOrder as number) < 1) {
      fail(source, 'featuredOrder', 'must be a positive integer');
    }
    featuredOrder = data.featuredOrder as number;
  }
  if (featured && featuredOrder === undefined) {
    fail(source, 'featuredOrder', 'is required for featured projects');
  }
  if (!featured && featuredOrder !== undefined) {
    fail(source, 'featuredOrder', 'must be omitted for non-featured projects');
  }

  const metadata: ProjectMetadata = {
    slug,
    title: requireString(data.title, source, 'title'),
    summary: requireString(data.summary, source, 'summary'),
    period: requireString(data.period, source, 'period'),
    status: requireEnum(
      data.status,
      projectStatuses,
      source,
      'status',
    ) as ProjectStatus,
    featured,
    disciplines: requireStringList(data.disciplines, source, 'disciplines').map(
      (discipline, index) =>
        requireEnum(discipline, projectDisciplines, source, `disciplines[${index}]`),
    ) as ProjectDiscipline[],
    technologies: requireStringList(data.technologies, source, 'technologies'),
    role: requireString(data.role, source, 'role'),
    outcome: requireString(data.outcome, source, 'outcome'),
    links: validateLinks(data.links, source),
    media: validateMedia(data.media, source),
  };

  if (featuredOrder !== undefined) {
    metadata.featuredOrder = featuredOrder;
  }

  return metadata;
}

function loadProjects(): Project[] {
  const files = readdirSync(projectsDirectory)
    .filter((filename) => filename.endsWith('.mdx'))
    .sort();

  if (files.length === 0) {
    throw new Error(`No project case studies found in ${projectsDirectory}`);
  }

  const loadedProjects = files.map((filename) => {
    const sourcePath = path.join(projectsDirectory, filename);
    const source = readFileSync(sourcePath, 'utf8');
    const { data, body } = parseFrontmatter(source, sourcePath);
    const filenameSlug = filename.slice(0, -'.mdx'.length);

    return {
      project: {
        ...validateMetadata(data, sourcePath),
        body,
      },
      filenameSlug,
      sourcePath,
    };
  });

  const seenSlugs = new Set<string>();
  const seenFeaturedOrders = new Set<number>();

  for (const { project } of loadedProjects) {
    if (seenSlugs.has(project.slug)) {
      throw new Error(`Duplicate project slug: ${project.slug}`);
    }
    seenSlugs.add(project.slug);

    if (project.featuredOrder !== undefined) {
      if (seenFeaturedOrders.has(project.featuredOrder)) {
        throw new Error(`Duplicate featured project order: ${project.featuredOrder}`);
      }
      seenFeaturedOrders.add(project.featuredOrder);
    }
  }

  for (const { project, filenameSlug, sourcePath } of loadedProjects) {
    if (project.slug !== filenameSlug) {
      fail(sourcePath, 'slug', `must match the filename (${filenameSlug})`);
    }
  }

  return loadedProjects.map(({ project }) => project);
}

function getCachedProjects(): Project[] {
  projectCache ??= loadProjects();
  return projectCache;
}

export function getAllProjects(): Project[] {
  return [...getCachedProjects()].sort((a, b) => a.title.localeCompare(b.title));
}

export function getFeaturedProjects(): Project[] {
  return getCachedProjects()
    .filter((project) => project.featured)
    .sort((a, b) => (a.featuredOrder ?? Infinity) - (b.featuredOrder ?? Infinity));
}

export function getProjectBySlug(slug: string): Project | undefined {
  return getCachedProjects().find((project) => project.slug === slug);
}

export function getProjectSlugs(): string[] {
  return getCachedProjects().map((project) => project.slug);
}

/** Force all project files through validation during a build or test. */
export function validateProjectContent(): void {
  getCachedProjects();
}
