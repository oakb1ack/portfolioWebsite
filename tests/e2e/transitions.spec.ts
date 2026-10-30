import { expect, test } from '@playwright/test';

test('chapters reveal, restore keyboard focus, and reverse on return', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  for (const chapter of ['About', 'Experience', 'Blog']) {
    const link = page.getByRole('link', { name: chapter, exact: true });
    await link.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`/${chapter.toLowerCase()}$`));
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
    await expect(page.locator('.chapter-curtain')).toBeHidden();
    await expect(page.locator('.title-screen')).toHaveAttribute('data-transition-direction', 'forward');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('link', { name: 'Return to the house' }).click();
    await expect(page.getByRole('link', { name: chapter, exact: true })).toBeFocused();
    await expect(page.locator('.title-screen')).toHaveAttribute('data-transition-direction', 'backward');
  }
  expect(errors).toEqual([]);
});

test('reduced motion skips the curtain and keeps navigation accessible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.evaluate(() => {
    const curtain = document.querySelector('.chapter-curtain')!;
    new MutationObserver(() => {
      if (getComputedStyle(curtain).visibility === 'visible') document.documentElement.dataset.curtainShown = 'true';
    }).observe(curtain, { attributes: true });
  });
  await page.getByRole('link', { name: 'Experience', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Experience', exact: true })).toBeFocused();
  await expect(page.locator('.chapter-curtain')).toBeHidden();
  await expect(page.locator('html')).not.toHaveAttribute('data-curtain-shown');
  await page.goBack();
  await expect(page.getByRole('link', { name: 'Experience', exact: true })).toBeFocused();
});

test('rapid browser history changes settle on the latest destination', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'About', exact: true }).click();
  await page.goBack();
  await page.goForward();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.locator('#about-name')).toBeFocused();
  await expect(page.locator('.chapter-curtain')).toBeHidden();
  await expect(page.locator('.title-screen')).not.toHaveAttribute('inert');
});

test('changing motion preference during a wipe finishes navigation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Experience', exact: true }).click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.getByRole('heading', { name: 'Experience', exact: true })).toBeFocused();
  await expect(page.locator('.chapter-curtain')).toBeHidden();
  await page.getByRole('link', { name: 'Return to the house' }).click();
  await expect(page.getByRole('link', { name: 'Experience', exact: true })).toBeFocused();
});

test('navigation still works when browser animation cannot start', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const original = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      if (this.classList.contains('chapter-curtain')) throw new Error('Animation unavailable');
      return original.apply(this, args);
    };
  });
  await page.getByRole('link', { name: 'Blog', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Blog', exact: true })).toBeFocused();
  await expect(page.locator('.chapter-curtain')).toBeHidden();
});
