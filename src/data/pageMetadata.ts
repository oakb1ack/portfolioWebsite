import type { BlogPost } from './blog.ts';
import { site } from './site.ts';
import { normalizedPath, pageFor } from './routes.ts';

export function pageMetadata(pathname: string, posts: BlogPost[], origin: string = site.url) {
  const path = normalizedPath(pathname);
  const slug = path.startsWith('/blog/') ? path.slice('/blog/'.length) : undefined;
  const post = posts.find(item => item.slug === slug);
  const isBlog = path === '/blog';
  const missingArticle = slug !== undefined && !post;
  const missingPage = pageFor(path) === 'not-found';
  const missing = missingArticle || missingPage;
  const label = post?.title ?? (missingPage ? 'Page not found' : missingArticle ? 'Article not found' : isBlog ? 'Blog' : path === '/about' ? 'About' : path === '/experience' ? 'Experience' : undefined);
  return {
    title: label ? `${label} — ${site.name}` : site.name,
    description: post?.description ?? (missingPage ? 'This page could not be found. Return to the portfolio to continue.' : missingArticle ? 'This article could not be found. Browse the notebook for more notes.' : isBlog ? 'Notes on mathematics, engineering, and things learned along the way by Ali Alfridawi.' : site.description),
    canonical: `${origin}${path === '/' ? '/' : path}`,
    type: post ? 'article' : 'website',
    robots: missing || post?.draft ? 'noindex, nofollow' : 'index, follow',
    published: post?.date,
  };
}

export function updatePageMetadata(path: string, posts: BlogPost[], origin?: string) {
  const metadata = pageMetadata(path, posts, origin);
  document.title = metadata.title;
  const values = [
    ['name', 'description', metadata.description],
    ['name', 'robots', metadata.robots],
    ['property', 'og:title', metadata.title],
    ['property', 'og:description', metadata.description],
    ['property', 'og:url', metadata.canonical],
    ['property', 'og:type', metadata.type],
    ['property', 'og:site_name', site.name],
    ['name', 'twitter:card', 'summary'],
    ['name', 'twitter:title', metadata.title],
    ['name', 'twitter:description', metadata.description],
  ];
  for (const [attribute, key, value] of values) {
    let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(attribute, key);
      document.head.append(tag);
    }
    tag.content = value;
  }
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.append(canonical);
  }
  canonical.href = metadata.canonical;
  const published = document.head.querySelector<HTMLMetaElement>('meta[property="article:published_time"]');
  if (metadata.published) {
    const tag = published ?? document.createElement('meta');
    tag.setAttribute('property', 'article:published_time');
    tag.content = `${metadata.published}T00:00:00Z`;
    if (!published) document.head.append(tag);
  } else published?.remove();
}
