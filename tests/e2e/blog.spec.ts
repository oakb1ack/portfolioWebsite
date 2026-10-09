import { expect, test } from '@playwright/test';

test('menu, article navigation, history, and focus work', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.locator('.menu-item[href="/blog"]').click();
  await expect(page).toHaveURL(/\/blog$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await page.screenshot({ path: `test-results/blog-index-${testInfo.project.name}.png`, fullPage: true, animations: 'disabled' });
  await page.getByRole('link', { name: 'Portfolio', exact: true }).click();
  await expect(page).toHaveURL(/\/blog\/portfolio$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await expect(page.locator('.blog-prose')).toHaveText('Welcome to the portfolio.');
  await expect(page.locator('.blog-deck')).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'On this page' })).toHaveCount(0);
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Blog', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Return to the house' }).click();
  await expect(page.locator('.menu-item[href="/blog"]')).toBeFocused();
  expect(errors).toEqual([]);
});

test('direct links, metadata, missing articles, and mobile width', async ({ page }, testInfo) => {
  await page.goto('/blog/portfolio/');
  await expect(page).toHaveTitle('Portfolio — Ali Alfridawi');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/blog\/portfolio$/);
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Portfolio');
  await page.screenshot({ path: `test-results/blog-${testInfo.project.name}.png`, fullPage: true, animations: 'disabled' });
  const missing = await page.goto('/blog/does-not-exist');
  expect(missing?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('A missing page.');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  await page.getByRole('link', { name: 'Browse all notes' }).click();
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website');
  await expect(page.locator('meta[property="article:published_time"]')).toHaveCount(0);
});

test('copy-link feedback works', async ({ page }) => {
  await page.goto('/blog/portfolio');
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async (text: string) => { document.documentElement.dataset.copiedLink = text; },
    } });
  });
  await page.getByRole('button', { name: 'Copy link', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Link copied.');
  expect(await page.evaluate(() => document.documentElement.dataset.copiedLink)).toBe('http://127.0.0.1:4175/blog/portfolio');
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async () => { throw new Error('Clipboard access denied'); },
    } });
  });
  await page.getByRole('button', { name: 'Link copied', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Copy the address from your browser to share this note.');
});

test('articles and feed remain readable without JavaScript', async ({ browser, request }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4175/blog');
  await page.getByRole('link', { name: 'Portfolio', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Portfolio');
  await expect(page.locator('.blog-prose')).toHaveText('Welcome to the portfolio.');
  await expect(page.locator('.blog-deck')).toHaveCount(0);
  const feed = await request.get('/rss.xml');
  expect(feed.ok()).toBe(true);
  expect(await feed.text()).toContain('<title>Portfolio</title>');
  await context.close();
});
