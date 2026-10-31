import { expect, test } from '@playwright/test';

test('Tartarus is the only artwork and stays mounted across navigation', async ({ page }) => {
  const requestedArt: string[] = [];
  page.on('request', request => {
    if (new URL(request.url()).pathname.startsWith('/art/')) requestedArt.push(request.url());
  });
  await page.goto('/');
  const image = page.locator('.artwork-background img');
  await expect(image).toHaveCount(1);
  await expect(image).toHaveAttribute('src', '/art/hades-tran-01.webp');
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
  await image.evaluate(element => element.setAttribute('data-original-node', 'true'));
  await expect(page.locator('.artwork-controls button')).toHaveCount(0);
  await expect(page.locator('.artwork-credit')).toContainText('Joanne Tran');
  for (const chapter of ['About', 'Experience', 'Blog']) {
    await page.getByRole('link', { name: chapter, exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
    await expect(image).toHaveAttribute('data-original-node', 'true');
    await page.getByRole('link', { name: 'Return to menu' }).click();
  }
  await expect(page.locator('.menu')).toBeVisible();
  expect(requestedArt).toHaveLength(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('an unavailable background does not block the portfolio', async ({ page }) => {
  await page.route('**/art/hades-tran-01.webp', route => route.abort());
  await page.goto('/');
  await page.getByRole('link', { name: 'Experience', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Experience', exact: true })).toBeFocused();
  await page.getByRole('link', { name: 'Return to menu' }).click();
  await expect(page.getByRole('link', { name: 'Experience', exact: true })).toBeFocused();
});
