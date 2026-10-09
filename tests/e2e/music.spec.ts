import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // Model blocked autoplay, then successful playback during a user gesture.
    const playing = new WeakSet<HTMLMediaElement>();
    Object.defineProperty(HTMLMediaElement.prototype, 'paused', {
      configurable: true,
      get() { return !playing.has(this); },
    });
    HTMLMediaElement.prototype.play = function () {
      if (!navigator.userActivation.isActive) {
        document.documentElement.dataset.musicAutoplay = 'blocked';
        return Promise.reject(new DOMException('Autoplay blocked', 'NotAllowedError'));
      }
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
  await expect(page.locator('html')).toHaveAttribute('data-music-autoplay', 'blocked');
  await expect(page.getByRole('button', { name: 'Play background music' })).toBeVisible();
});

for (const chapter of ['About', 'Experience', 'Blog']) {
  test(`clicking ${chapter} retries blocked music and navigates`, async ({ page }) => {
    await page.getByRole('link', { name: chapter, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${chapter.toLowerCase()}$`));
    await expect(page.locator('html')).toHaveAttribute('data-music-starts', '1');
    await expect(page.getByRole('button', { name: 'Pause background music' })).toHaveAttribute('aria-pressed', 'true');
  });
}

test('explicit playback starts once and stays paused after navigation', async ({ page }) => {
  await page.getByRole('button', { name: 'Play background music' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-music-starts', '1');
  await page.getByRole('button', { name: 'Pause background music' }).click();
  await expect(page.getByRole('button', { name: 'Play background music' })).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('link', { name: 'About', exact: true }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole('button', { name: 'Play background music' })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('html')).toHaveAttribute('data-music-starts', '1');
});
