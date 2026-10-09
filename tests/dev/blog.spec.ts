import { expect, test } from '@playwright/test';
import { writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';

test('development server loads the menu and blog without import errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.locator('.menu-item[href="/blog"]').click();
  await expect(page.getByRole('heading', { name: 'Blog', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Portfolio', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Portfolio');
  await page.reload();
  await expect(page.locator('.blog-prose')).toHaveText('Welcome to the portfolio.');
  expect(errors).toEqual([]);
});

test('adding, editing, and removing a Markdown draft reloads its preview', async ({ page, request }) => {
  const slug = `dev-preview-${Date.now()}`;
  const filename = path.resolve('content/blog', `${slug}.md`);
  const article = (text: string) => `---\ntitle: "Development preview"\ndate: "2026-10-08"\ndescription: "Temporary draft for the development test."\ntags: [Test]\ndraft: true\n---\n\n${text}\n`;
  await page.goto('/blog');
  try {
    await writeFile(filename, article('The first draft body.'), { flag: 'wx' });
    await expect(page.getByRole('link', { name: 'Development preview', exact: false })).toBeVisible();
    await page.getByRole('link', { name: 'Development preview', exact: false }).click();
    await expect(page.getByText('Draft preview', { exact: true })).toBeVisible();
    await expect(page.locator('.blog-prose')).toHaveText('The first draft body.');
    await writeFile(filename, article('The revised draft body.'));
    await expect(page.locator('.blog-prose')).toHaveText('The revised draft body.');
    const feed = await request.get('/rss.xml');
    expect(await feed.text()).not.toContain(slug);
    await unlink(filename);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('A missing page.');
  } finally {
    await unlink(filename).catch(error => { if (error.code !== 'ENOENT') throw error; });
  }
});
