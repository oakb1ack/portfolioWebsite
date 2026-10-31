import { expect, test } from '@playwright/test';

test('Tartarus replaces the gallery and survives chapter navigation', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  const enter = page.getByRole('button', { name: /Enter Tartarus/ });
  await expect(enter).toBeEnabled();
  await enter.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.title-screen')).toHaveAttribute('data-region', 'tartarus');
  await expect(page.locator('.region-curtain')).toBeHidden();
  await expect(page.getByRole('button', { name: /Return to the House/ })).toBeFocused();
  await expect(page.locator('.artwork-image.active')).toHaveAttribute('src', '/art/hades-tran-01.webp');
  await expect(page.locator('.artwork-credit')).toContainText('Joanne Tran');
  await page.getByRole('link', { name: 'Experience', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Experience', exact: true })).toBeFocused();
  await expect(page.locator('.title-screen')).toHaveAttribute('data-region', 'tartarus');
  await page.getByRole('button', { name: /Return to the House/ }).click();
  await expect(page.locator('.region-curtain')).toBeHidden();
  await expect(page.locator('.title-screen')).toHaveAttribute('data-region', 'house');
  await expect(page.getByRole('button', { name: 'Enter Tartarus', exact: true })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Return to the House', exact: true })).toHaveCount(0);
  await expect(page.locator('.artwork-image.active')).toHaveAttribute('src', '/art/hades-house.webp');
  await expect(page).toHaveURL(/\/experience$/);
  await expect(page.locator('.artwork-credit')).toContainText('Supergiant Games');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`round trips update the next destination with ${reducedMotion} motion`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto('/');
    for (let trip = 0; trip < 2; trip++) {
      await page.getByRole('button', { name: 'Enter Tartarus', exact: true }).click();
      await expect(page.locator('.region-curtain')).toBeHidden();
      await expect(page.locator('.region-location')).toHaveText('Region I · Tartarus');
      // Returning from a content section means returning to the menu, not changing regions.
      await page.getByRole('link', { name: 'About', exact: true }).click();
      await page.getByRole('link', { name: 'Return to menu' }).click();
      await expect(page.locator('.title-screen')).toHaveAttribute('data-region', 'tartarus');
      await page.getByRole('button', { name: 'Return to the House', exact: true }).click();
      await expect(page.locator('.region-curtain')).toBeHidden();
      await expect(page.locator('.region-location')).toHaveText('The House');
      await expect(page.getByRole('button', { name: 'Enter Tartarus', exact: true })).toBeFocused();
      await expect(page.locator('.region-interlude')).toBeHidden();
    }
  });
}

test('region travel preserves reading position and leaves music paused', async ({ page }) => {
  await page.goto('/experience');
  await page.evaluate(() => document.fonts.ready);
  const enter = page.getByRole('button', { name: /Enter Tartarus/ });
  await enter.scrollIntoViewIfNeeded();
  await enter.focus();
  const before = await page.evaluate(() => scrollY);
  await page.keyboard.press('Enter');
  await expect(page.locator('.region-curtain')).toBeHidden();
  await expect(page.locator('.title-screen')).toHaveAttribute('data-region', 'tartarus');
  expect(await page.evaluate(() => scrollY)).toBeCloseTo(before, 0);
  await expect(page.getByRole('button', { name: 'Play background music' })).toHaveAttribute('aria-pressed', 'false');
  expect(await page.locator('[data-transition-sound]').evaluate((audio: HTMLAudioElement) => audio.paused)).toBe(true);
});

test('reduced motion changes region immediately without a curtain', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: /Enter Tartarus/ }).click();
  await expect(page.locator('.title-screen')).toHaveAttribute('data-region', 'tartarus');
  await expect(page.locator('.region-curtain')).toHaveAttribute('data-phase', 'idle');
  await expect(page.locator('.region-interlude')).toBeHidden();
  await expect(page.getByRole('button', { name: /Return to the House/ })).toBeFocused();
});

test('Escape finishes a pending region change and restores focus', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const curtain = document.querySelector('.region-curtain')!;
    new MutationObserver(() => {
      if (curtain.getAttribute('data-phase') === 'covering') curtain.getAnimations().forEach(animation => animation.pause());
    }).observe(curtain, { attributes: true });
  });
  await page.getByRole('button', { name: /Enter Tartarus/ }).click();
  await expect(page.locator('.title-screen')).toHaveAttribute('inert');
  await page.keyboard.press('Escape');
  await expect(page.locator('.title-screen')).toHaveAttribute('data-region', 'tartarus');
  await expect(page.locator('.title-screen')).not.toHaveAttribute('inert');
  await expect(page.locator('.region-curtain')).toBeHidden();
  await expect(page.getByRole('button', { name: /Return to the House/ })).toBeFocused();
});

test('failed artwork keeps the House usable and shows an explanation', async ({ page }) => {
  await page.route('**/art/hades-tran-01.webp', route => route.abort());
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Enter Tartarus/ })).toBeDisabled();
  await expect(page.getByText('Tartarus is unavailable.', { exact: false })).toBeVisible();
  await page.getByRole('link', { name: 'About', exact: true }).click();
  await expect(page.locator('#about-name')).toBeFocused();
});

test('animation failure still reveals the requested region', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const original = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      if (this.classList.contains('region-curtain')) throw new Error('Animation unavailable');
      return original.apply(this, args);
    };
  });
  await page.getByRole('button', { name: /Enter Tartarus/ }).click();
  await expect(page.locator('.title-screen')).toHaveAttribute('data-region', 'tartarus');
  await expect(page.locator('.title-screen')).not.toHaveAttribute('inert');
  await expect(page.locator('.region-curtain')).toBeHidden();
});
