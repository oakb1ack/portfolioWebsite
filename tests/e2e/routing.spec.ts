import { expect, test } from '@playwright/test';

test('legacy URLs permanently redirect to the resume and About', async ({ page, request }) => {
  for (const [route, destination] of [['/resume', '/resume.pdf'], ['/resume/', '/resume.pdf'], ['/contact', '/about'], ['/contact/', '/about']]) {
    const response = await request.get(route, { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe(destination);
  }
  await page.goto('/contact/');
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole('link', { name: 'Say hello' })).toHaveAttribute('href', /^mailto:/);
});

test('missing pages return 404, stay out of search, and offer navigation', async ({ page }) => {
  for (const route of ['/does-not-exist', '/does-not-exist/', '/missing/file.svg', '/404.html', '/blog/404/', '/blog/404/index.html', '/blog/missing.svg']) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('A missing page.');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.goto('/does-not-exist');
  await page.getByRole('link', { name: 'Return to the house' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('.menu-item')).toHaveCount(3);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
});

test('static assets, crawler files, and valid routes keep their response types', async ({ request }) => {
  for (const route of ['/', '/about', '/about/', '/experience', '/experience/', '/blog', '/blog/portfolio']) {
    expect((await request.get(route)).status(), route).toBe(200);
  }
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(robots.headers()['content-type']).toContain('text/plain');
  expect(await robots.text()).toMatch(/User-agent: \*\nAllow: \/\n/);
  expect(await robots.text()).toMatch(/Sitemap: https?:\/\/[^\s]+\/sitemap.xml/);
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).not.toMatch(/\/contact|\/resume\/|\/404/);
  const pdf = await request.get('/resume.pdf');
  expect(pdf.headers()['content-type']).toContain('application/pdf');
  expect((await pdf.body()).subarray(0, 5).toString()).toBe('%PDF-');
  const favicon = await request.get('/favicon.svg');
  expect(favicon.headers()['content-type']).toContain('image/svg+xml');
});

test('the missing-page explanation is readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    const response = await page.goto('http://127.0.0.1:4175/does-not-exist');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('A missing page.');
    await expect(page.getByRole('link', { name: 'Return to the house' })).toHaveAttribute('href', '/');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  } finally {
    await context.close();
  }
});
