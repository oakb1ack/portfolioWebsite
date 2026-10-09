import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // Allow every play request so browser autoplay policy cannot mask a regression.
    const playing = new WeakSet<HTMLMediaElement>();
    Object.defineProperty(HTMLMediaElement.prototype, 'paused', {
      configurable: true,
      get() { return !playing.has(this); },
    });
    HTMLMediaElement.prototype.play = function () {
      const root = document.documentElement;
      root.dataset.musicStarts = String(Number(root.dataset.musicStarts ?? 0) + 1);
      playing.add(this);
      this.dispatchEvent(new Event('playing'));
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function () {
      if (playing.delete(this)) this.dispatchEvent(new Event('pause'));
    };
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Play background music' })).toBeVisible();
  await expect(page.locator('html')).not.toHaveAttribute('data-music-starts');
});

for (const chapter of ['About', 'Experience', 'Blog']) {
  test(`clicking ${chapter} navigates without starting music`, async ({ page }) => {
    await page.getByRole('link', { name: chapter, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${chapter.toLowerCase()}$`));
    await expect(page.locator('html')).not.toHaveAttribute('data-music-starts');
    await expect(page.getByRole('button', { name: 'Play background music' })).toHaveAttribute('aria-pressed', 'false');
  });
}

test('keyboard navigation does not start music', async ({ page }) => {
  await page.getByRole('link', { name: 'About', exact: true }).focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/experience$/);
  await expect(page.locator('html')).not.toHaveAttribute('data-music-starts');
  await expect(page.getByRole('button', { name: 'Play background music' })).toHaveAttribute('aria-pressed', 'false');
});

test('explicit playback starts once and stays paused after navigation', async ({ page }) => {
  await page.getByRole('button', { name: 'Play background music' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-music-starts', '1');
  await expect(page.getByRole('button', { name: 'Pause background music' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('link', { name: 'About', exact: true }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole('button', { name: 'Pause background music' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('link', { name: 'Return to the house' }).click();
  await page.getByRole('button', { name: 'Pause background music' }).click();
  await expect(page.getByRole('button', { name: 'Play background music' })).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('link', { name: 'About', exact: true }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole('button', { name: 'Play background music' })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('html')).toHaveAttribute('data-music-starts', '1');
});

test('reloading after explicit playback starts with music paused', async ({ page }) => {
  await page.getByRole('button', { name: 'Play background music' }).click();
  await expect(page.getByRole('button', { name: 'Pause background music' })).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Play background music' })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('html')).not.toHaveAttribute('data-music-starts');
});
