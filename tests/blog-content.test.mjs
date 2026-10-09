import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, readFile, writeFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { compilePost, readPosts, rssFeed } from '../scripts/blog-content.mjs';

const source = (metadata = '', body = 'A short note.') => `---\ntitle: "A note"\ndescription: "An explanation"\ndate: "2026-10-08"\ntags: [Math]\ndraft: false\n${metadata}---\n\n${body}`;

test('drafts are excluded before body parsing, but can be previewed locally', async () => {
  const draft = source().replace('draft: false', 'draft: true');
  assert.equal(await compilePost(draft, 'private-note.md'), null);
  assert.equal((await compilePost(draft, 'private-note.md', { includeDrafts: true })).draft, true);
  const brokenDraft = source('', '$$\n\\unknowncommand\n$$').replace('draft: false', 'draft: true');
  assert.equal(await compilePost(brokenDraft, 'private-note.md'), null);
});

test('rejects invalid publication metadata and reserved paths', async () => {
  for (const date of ['2026-02-30', '2026-13-01', 'tomorrow']) {
    await assert.rejects(compilePost(source().replace('2026-10-08', date), 'note.md'), /date must be/);
  }
  await assert.rejects(compilePost(source().replace('draft: false', 'draft: "false"'), 'note.md'), /draft must be/);
  await assert.rejects(compilePost(source().replace('title: "A note"', 'title: ""'), 'note.md'), /title must be/);
  await assert.rejects(compilePost(source('', ''), 'note.md'), /body is empty/);
  await assert.rejects(compilePost(source(), '404.md'), /reserved/);
  await assert.rejects(compilePost(source(), 'Not a slug.md'), /hyphenated/);
});

test('renders code, tables, accessible math, images, and strips executable content', async () => {
  const post = await compilePost(source('', `## A signal\n\nInline $x^2$ and:\n\n$$\nx(t) = \\sin(t)\n$$\n\n\`\`\`typescript\nconst value = 5;\n\`\`\`\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n![A wave](/blog/wave.svg)\n\n<script>alert('unsafe')</script>\n\n[Unsafe](javascript:alert%281%29)`), 'signal.md');
  assert.match(post.html, /<h2[^>]*id="note-a-signal"[^>]*>A signal<\/h2>/);
  assert.match(post.html, /hljs-keyword/);
  assert.match(post.html, /<table>/);
  assert.match(post.html, /katex-display/);
  assert.match(post.html, /<math /);
  assert.match(post.html, /alt="A wave"/);
  assert.doesNotMatch(post.html, /<script|javascript:/);
});

test('section links keep unique targets for duplicate headings and formatted titles', async () => {
  const post = await compilePost(source('', '## A **signal**\n\n### Details\n\n## A signal\n\n## A signal 2\n\n## A signal\n\n## Café'), 'sections.md');
  assert.deepEqual(post.headings.map(heading => [heading.id, heading.title, heading.level]), [
    ['note-a-signal', 'A signal', 2],
    ['note-details', 'Details', 3],
    ['note-a-signal-2', 'A signal', 2],
    ['note-a-signal-2-2', 'A signal 2', 2],
    ['note-a-signal-3', 'A signal', 2],
    ['note-cafe', 'Café', 2],
  ]);
  for (const heading of post.headings) assert.ok(post.html.includes(`id="${heading.id}"`));
});

test('discovers new files, sorts newest first, and keeps drafts out of RSS', async t => {
  const directory = await mkdtemp(path.join(tmpdir(), 'portfolio-blog-test-'));
  t.after(async () => {
    assert.ok(path.resolve(directory).startsWith(path.resolve(tmpdir()) + path.sep));
    await rm(directory, { recursive: true, force: true });
  });
  await writeFile(path.join(directory, 'older.md'), source().replace('2026-10-08', '2026-10-01'));
  await writeFile(path.join(directory, 'newer.md'), source().replace('A note', 'Math & circuits'));
  await writeFile(path.join(directory, 'secret.md'), source().replace('draft: false', 'draft: true'));
  const posts = await readPosts(directory);
  assert.deepEqual(posts.map(post => post.slug), ['newer', 'older']);
  const previews = await readPosts(directory, { includeDrafts: true });
  assert.equal(previews.length, 3);
  const feed = rssFeed(previews, 'https://example.com', 'Ali');
  assert.match(feed, /Math &amp; circuits/);
  assert.match(feed, /https:\/\/example.com\/blog\/newer/);
  assert.doesNotMatch(feed, /secret/);
});

test('production HTML contains article content and sharing metadata before JavaScript runs', async () => {
  const article = await readFile(new URL('../dist/blog/portfolio/index.html', import.meta.url), 'utf8');
  const index = await readFile(new URL('../dist/blog/index.html', import.meta.url), 'utf8');
  const missing = await readFile(new URL('../dist/blog/404/index.html', import.meta.url), 'utf8');
  const feed = await readFile(new URL('../dist/rss.xml', import.meta.url), 'utf8');
  assert.match(article, /<p>Welcome to the portfolio\.<\/p>/);
  assert.match(article, /<meta property="og:type" content="article">/);
  assert.match(article, /<link rel="canonical" href="https?:\/\/[^" ]+\/blog\/portfolio">/);
  assert.match(article, /<meta property="article:published_time"/);
  assert.match(index, /href="\/blog\/portfolio"/);
  assert.match(missing, /noindex, nofollow/);
  assert.match(feed, /<item>/);
  const assets = await readdir(new URL('../dist/assets/', import.meta.url));
  const js = (await Promise.all(assets.filter(file => file.endsWith('.js')).map(file => readFile(new URL(`../dist/assets/${file}`, import.meta.url), 'utf8')))).join('\n');
  assert.doesNotMatch(js, /remarkParse|rehypeHighlight|function compilePost/);
});

test('build generates a readable general 404 and crawler instructions', async () => {
  const missing = await readFile(new URL('../dist/404.html', import.meta.url), 'utf8');
  const robots = await readFile(new URL('../dist/robots.txt', import.meta.url), 'utf8');
  const sitemap = await readFile(new URL('../dist/sitemap.xml', import.meta.url), 'utf8');
  assert.match(missing, /<h1[^>]*>A missing page\.<\/h1>/);
  assert.match(missing, /href="\/"/);
  assert.match(missing, /<meta name="robots" content="noindex, nofollow">/);
  assert.match(robots, /^User-agent: \*\nAllow: \/\n\nSitemap: https?:\/\/[^\s]+\/sitemap.xml\n$/);
  const origin = robots.match(/Sitemap: (https?:\/\/[^\s]+)\/sitemap.xml/)[1];
  assert.ok(sitemap.includes(`<loc>${origin}/</loc>`));
});
