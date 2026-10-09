import path from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Plugin, ResolvedConfig } from 'vite';
import { BlogPage } from '../src/components/BlogPage.tsx';
import type { BlogPost } from '../src/data/blog.ts';
import { pageMetadata } from '../src/data/pageMetadata.ts';
import { site } from '../src/data/site.ts';
import { escapeXml, readPosts, rssFeed } from './blog-content.mjs';

const moduleId = 'virtual:blog-posts';
const resolvedId = `\0${moduleId}`;

export function blogPlugin(): Plugin {
  let config: ResolvedConfig;
  let directory: string;
  let origin: string;
  let postsPromise: Promise<BlogPost[]> | undefined;
  const posts = () => postsPromise ??= readPosts(directory, { includeDrafts: config.command === 'serve' });

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
        if (request.url?.split('?')[0] !== '/rss.xml') return next();
        try {
          response.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
          response.end(rssFeed(await posts(), origin, site.name));
        } catch (error) { next(error as Error); }
      });
    },
    configurePreviewServer(server) {
      // Vite's SPA preview otherwise serves the home shell for extensionless URLs.
      server.middlewares.use(async (request, response, next) => {
        const pathname = request.url?.split('?')[0] ?? '';
        if (!/^\/blog(?:\/|$)/.test(pathname) || /\.[a-z0-9]+$/i.test(pathname)) return next();
        const match = pathname.match(/^\/blog(?:\/([a-z0-9]+(?:-[a-z0-9]+)*))?\/?$/);
        const file = match ? `blog/${match[1] ? `${match[1]}/` : ''}index.html` : undefined;
        const output = path.resolve(config.root, config.build.outDir);
        let html: string;
        try {
          if (!file || match?.[1] === '404') throw new Error('Missing article');
          html = await readFile(path.join(output, file), 'utf8');
        } catch {
          response.statusCode = 404;
          try { html = await readFile(path.join(output, 'blog/404/index.html'), 'utf8'); }
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
      await write('index.html', documentFor(template, '/', entries));
      await write('rss.xml', rssFeed(entries, origin, site.name));
      const urls = ['/', '/about', '/experience', '/blog', ...entries.map(post => `/blog/${post.slug}`)];
      await write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url => `<url><loc>${escapeXml(origin + url)}</loc></url>`).join('')}</urlset>`);
    },
  };
}
