import path from 'node:path';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Plugin, ResolvedConfig } from 'vite';
import { BlogPage } from '../src/components/BlogPage.tsx';
import { NotFoundPage } from '../src/components/NotFoundPage.tsx';
import type { BlogPost } from '../src/data/blog.ts';
import { pageMetadata } from '../src/data/pageMetadata.ts';
import { site } from '../src/data/site.ts';
import { legacyRedirect, pageFor } from '../src/data/routes.ts';
import { escapeXml, readPosts, rssFeed } from './blog-content.mjs';

const moduleId = 'virtual:blog-posts';
const resolvedId = `\0${moduleId}`;

export function blogPlugin(): Plugin {
  let config: ResolvedConfig;
  let directory: string;
  let origin: string;
  let postsPromise: Promise<BlogPost[]> | undefined;
  const posts = () => postsPromise ??= readPosts(directory, { includeDrafts: config.command === 'serve' });
  const robots = () => `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`;

  function documentFor(template: string, pathname: string, entries: BlogPost[], content?: string) {
    const metadata = pageMetadata(pathname, entries, origin);
    const head = [
      `<title>${escapeXml(metadata.title)}</title>`,
      `<meta name="description" content="${escapeXml(metadata.description)}">`,
      `<meta name="robots" content="${metadata.robots}">`,
      `<link rel="canonical" href="${escapeXml(metadata.canonical)}">`,
      `<link rel="alternate" type="application/rss+xml" title="${site.name} — Blog" href="/rss.xml">`,
      `<meta property="og:title" content="${escapeXml(metadata.title)}">`,
      `<meta property="og:description" content="${escapeXml(metadata.description)}">`,
      `<meta property="og:url" content="${escapeXml(metadata.canonical)}">`,
      `<meta property="og:type" content="${metadata.type}">`,
      `<meta property="og:site_name" content="${site.name}">`,
      '<meta name="twitter:card" content="summary">',
      `<meta name="twitter:title" content="${escapeXml(metadata.title)}">`,
      `<meta name="twitter:description" content="${escapeXml(metadata.description)}">`,
      metadata.published ? `<meta property="article:published_time" content="${metadata.published}T00:00:00Z">` : '',
    ].join('\n    ');
    let html = template.replace(/<title>[\s\S]*?<\/title>/, '').replace(/<meta\s+name="description"[\s\S]*?>/, '').replace('</head>', `${head}\n  </head>`);
    if (content) html = html.replace('<div id="root"></div>', `<div id="root"><div class="title-screen about-screen blog-screen">${content}</div></div>`);
    return html;
  }

  return {
    name: 'markdown-blog',
    configResolved(resolved) {
      config = resolved;
      directory = path.join(config.root, 'content/blog');
      const url = new URL(process.env.SITE_URL || site.url);
      if (!['https:', 'http:'].includes(url.protocol) || url.pathname !== '/' || url.search || url.hash) throw new Error('SITE_URL must be an http(s) origin without a path');
      origin = url.origin;
    },
    resolveId(id) { if (id === moduleId) return resolvedId; },
    async load(id) {
      if (id !== resolvedId) return;
      // configureServer watches this directory. addWatchFile would register it
      // as an import dependency, which Vite cannot resolve as a module in dev.
      return `export const posts = ${JSON.stringify(await posts())}; export const siteOrigin = ${JSON.stringify(origin)};`;
    },
    configureServer(server) {
      server.watcher.add(directory);
      const refresh = (file: string) => {
        if (!file.endsWith('.md') || !path.resolve(file).startsWith(`${directory}${path.sep}`)) return;
        postsPromise = undefined;
        const module = server.moduleGraph.getModuleById(resolvedId);
        if (module) server.moduleGraph.invalidateModule(module);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', refresh).on('change', refresh).on('unlink', refresh);
      server.httpServer?.once('close', () => {
        server.watcher.off('add', refresh).off('change', refresh).off('unlink', refresh);
      });
      server.middlewares.use(async (request, response, next) => {
        const url = new URL(request.url ?? '/', 'http://localhost');
        const redirect = legacyRedirect(url.pathname);
        if (redirect) {
          response.writeHead(308, { Location: redirect + url.search });
          return response.end();
        }
        if (url.pathname === '/robots.txt') {
          response.setHeader('Content-Type', 'text/plain; charset=utf-8');
          return response.end(robots());
        }
        if (url.pathname !== '/rss.xml') return next();
        try {
          response.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
          response.end(rssFeed(await posts(), origin, site.name));
        } catch (error) { next(error as Error); }
      });
    },
    configurePreviewServer(server) {
      // Match production routing before Vite's catch-all SPA fallback.
      server.middlewares.use(async (request, response, next) => {
        const url = new URL(request.url ?? '/', 'http://localhost');
        const pathname = url.pathname;
        const redirect = legacyRedirect(pathname);
        if (redirect) {
          response.writeHead(308, { Location: redirect + url.search });
          return response.end();
        }
        const output = path.resolve(config.root, config.build.outDir);
        try {
          const asset = path.resolve(output, `.${decodeURIComponent(pathname)}`);
          const reserved404 = /^\/404(?:\.html)?\/?$/.test(pathname) || /^\/blog\/404(?:\/index\.html)?\/?$/.test(pathname);
          if (!reserved404 && asset.startsWith(output + path.sep) && (await stat(asset)).isFile()) return next();
        } catch { /* Missing files continue to the page routes. */ }
        const page = pageFor(pathname);
        if (page !== 'blog' && page !== 'not-found') return next();
        const match = pathname.match(/^\/blog(?:\/([a-z0-9]+(?:-[a-z0-9]+)*))?\/?$/);
        const file = match ? `blog/${match[1] ? `${match[1]}/` : ''}index.html` : undefined;
        let html: string;
        try {
          if (!file || match?.[1] === '404') throw new Error('Missing article');
          html = await readFile(path.join(output, file), 'utf8');
        } catch {
          response.statusCode = 404;
          try { html = await readFile(path.join(output, page === 'blog' ? 'blog/404/index.html' : '404.html'), 'utf8'); }
          catch (error) { return next(error as Error); }
        }
        response.setHeader('Content-Type', 'text/html; charset=utf-8');
        response.end(html);
      });
    },
    async closeBundle() {
      if (config.command !== 'build') return;
      const entries = await posts();
      const output = path.resolve(config.root, config.build.outDir);
      const template = await readFile(path.join(output, 'index.html'), 'utf8');
      const write = async (file: string, value: string) => {
        const destination = path.join(output, file);
        await mkdir(path.dirname(destination), { recursive: true });
        await writeFile(destination, value);
      };
      const render = (slug?: string) => renderToStaticMarkup(createElement(BlogPage, { posts: entries, slug }));
      await write('blog/index.html', documentFor(template, '/blog', entries, render()));
      for (const post of entries) {
        await write(`blog/${post.slug}/index.html`, documentFor(template, `/blog/${post.slug}`, entries, render(post.slug)));
      }
      await write('blog/404/index.html', documentFor(template, '/blog/404', entries, render('404')));
      await write('404.html', documentFor(template, '/404.html', entries, renderToStaticMarkup(createElement(NotFoundPage))));
      await write('index.html', documentFor(template, '/', entries));
      await write('rss.xml', rssFeed(entries, origin, site.name));
      await write('robots.txt', robots());
      const urls = ['/', '/about', '/experience', '/blog', ...entries.map(post => `/blog/${post.slug}`)];
      await write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url => `<url><loc>${escapeXml(origin + url)}</loc></url>`).join('')}</urlset>`);
    },
  };
}
