import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'yaml';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';

// Generate the contents and fragment targets from the same sanitized tree.
function articleHeadings() {
  return (tree, file) => {
    const headings = [];
    const used = new Set();
    const text = node => typeof node.value === 'string' ? node.value : (node.children ?? []).map(text).join('');
    const walk = node => {
      if (node.type === 'element' && ['h2', 'h3'].includes(node.tagName)) {
        const title = text(node).trim();
        const base = `note-${title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section'}`;
        let id = base;
        let suffix = 2;
        while (used.has(id)) id = `${base}-${suffix++}`;
        used.add(id);
        node.properties = { ...node.properties, id, tabIndex: -1 };
        headings.push({ id, title, level: Number(node.tagName.slice(1)) });
      }
      for (const child of node.children ?? []) walk(child);
    };
    walk(tree);
    file.data.headings = headings;
  };
}

// Sanitize author content before trusted KaTeX and highlighting add their markup.
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkRehype)
  .use(rehypeSanitize, {
    ...defaultSchema,
    attributes: {
      ...defaultSchema.attributes,
      code: [...(defaultSchema.attributes.code ?? []), ['className', /^language-./, 'math-inline', 'math-display']],
    },
  })
  .use(articleHeadings)
  .use(rehypeKatex, { strict: 'error', throwOnError: true, trust: false })
  .use(rehypeHighlight, { detect: false })
  .use(rehypeStringify);

export async function compilePost(source, filename, { includeDrafts = false } = {}) {
  const slug = path.basename(filename, '.md');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`${filename}: use a lowercase, hyphenated filename`);
  if (slug === '404') throw new Error(`${filename}: 404 is reserved for the missing article page`);
  const match = source.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if (!match) throw new Error(`${filename}: start the file with a YAML metadata block between --- lines`);
  const data = parse(match[1]);
  const content = match[2];
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error(`${filename}: metadata must be a mapping`);
  for (const field of ['title', 'description']) {
    if (typeof data[field] !== 'string' || !data[field].trim()) throw new Error(`${filename}: ${field} must be a nonempty string`);
  }
  const date = data.date instanceof Date ? data.date.toISOString().slice(0, 10) : data.date;
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`)) || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) {
    throw new Error(`${filename}: date must be a valid YYYY-MM-DD date`);
  }
  if (typeof data.draft !== 'boolean') throw new Error(`${filename}: draft must be true or false`);
  if (!Array.isArray(data.tags) || data.tags.some(tag => typeof tag !== 'string' || !tag.trim())) throw new Error(`${filename}: tags must be an array of nonempty strings`);
  // Never parse or include the body of a draft in a public build.
  if (data.draft && !includeDrafts) return null;
  if (!content.trim()) throw new Error(`${filename}: article body is empty`);
  const rendered = await processor.process(content);
  const html = String(rendered);
  return {
    slug, title: data.title.trim(), description: data.description.trim(), date,
    tags: [...new Set(data.tags.map(tag => tag.trim()))], draft: data.draft,
    readingMinutes: Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 200)), html,
    headings: rendered.data.headings,
  };
}

export async function readPosts(directory, options) {
  const files = (await readdir(directory)).filter(file => file.endsWith('.md')).sort();
  const posts = await Promise.all(files.map(async file => compilePost(await readFile(path.join(directory, file), 'utf8'), file, options)));
  return posts.filter(Boolean).sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

export function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char]));
}

export function rssFeed(posts, origin, name) {
  const items = posts.filter(post => !post.draft).map(post => {
    const url = `${origin}/blog/${post.slug}`;
    return `<item><title>${escapeXml(post.title)}</title><link>${escapeXml(url)}</link><guid isPermaLink="true">${escapeXml(url)}</guid><pubDate>${new Date(`${post.date}T00:00:00Z`).toUTCString()}</pubDate><description>${escapeXml(post.description)}</description>${post.tags.map(tag => `<category>${escapeXml(tag)}</category>`).join('')}</item>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${escapeXml(name)} — Notes from the journey</title><link>${escapeXml(origin)}/blog</link><description>Mathematics, engineering, and things learned along the way.</description><language>en-us</language><atom:link href="${escapeXml(origin)}/rss.xml" rel="self" type="application/rss+xml"/>${items}</channel></rss>`;
}
