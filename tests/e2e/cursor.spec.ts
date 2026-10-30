import { expect, test } from '@playwright/test';

test('sword movement sheds embers that finish without blocking the page', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Effects are only enabled for a fine pointer with hover.');
  await page.goto('/');
  const layer = page.locator('.stygius-effects');
  await page.mouse.move(800, 300);
  await page.mouse.move(920, 380, { steps: 10 });
  await expect(layer.locator('.stygius-mote').first()).toBeAttached();
  await expect(layer).toHaveCSS('pointer-events', 'none');
  await expect(page.locator('body')).toHaveCSS('cursor', /stygius\.svg.*3 3, default/);
  await expect(layer.locator('span')).toHaveCount(0);

  // Scrolling clears particles but movement on the same element resumes them.
  await page.evaluate(() => window.dispatchEvent(new Event('scroll')));
  await page.mouse.move(1040, 400, { steps: 10 });
  await expect(layer.locator('.stygius-mote').first()).toBeAttached();
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(layer.locator('span')).toHaveCount(0);
});

test('controls pulse gold and clicking produces a slash while navigation still works', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Effects are only enabled for a fine pointer with hover.');
  await page.goto('/');
  const link = page.getByRole('link', { name: 'About', exact: true });
  await link.hover();
  await expect(page.locator('.stygius-hover-pulse')).toHaveCount(1);
  await expect(link).toHaveCSS('cursor', /stygius-hover\.svg/);
  await page.mouse.down();
  await expect(page.locator('.stygius-slash-blade')).toHaveCount(1);
  await expect(page.locator('.stygius-slash-echo')).toHaveCount(1);
  await expect(page.locator('html')).toHaveAttribute('data-cursor-pressed', '');
  await expect(link).toHaveCSS('cursor', /stygius-pressed\.svg/);
  await page.mouse.up();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await expect(page.locator('.stygius-effects span')).toHaveCount(0);
  await expect(page.locator('html')).not.toHaveAttribute('data-cursor-pressed');

  const text = page.locator('.about-dialogue p').first();
  await text.click();
  await expect(text).toHaveCSS('cursor', 'text');
  await expect(page.locator('.stygius-effects span')).toHaveCount(0);
  await expect(page.locator('html')).not.toHaveAttribute('data-cursor-pressed');
});

test('changing to reduced motion clears live effects and preserves the sword', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Effects are only enabled for a fine pointer with hover.');
  await page.goto('/');
  await page.mouse.move(850, 350);
  await page.mouse.down();
  await expect(page.locator('.stygius-slash-blade')).toHaveCount(1);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.stygius-effects')).toBeHidden();
  await expect(page.locator('.stygius-effects span')).toHaveCount(0);
  await expect(page.locator('html')).not.toHaveAttribute('data-cursor-pressed');
  await page.mouse.up();
  await page.mouse.click(850, 350);
  await expect(page.locator('.stygius-effects span')).toHaveCount(0);
  await expect(page.locator('body')).toHaveCSS('cursor', /stygius\.svg/);

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.mouse.move(980, 390, { steps: 10 });
  await expect(page.locator('.stygius-mote').first()).toBeAttached();
});

test('touch navigation creates no cursor effects', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Requires a touch device.');
  await page.goto('/');
  await expect(page.locator('.stygius-effects')).toBeHidden();
  await page.getByRole('link', { name: 'About', exact: true }).tap();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.locator('.stygius-effects span')).toHaveCount(0);
  await expect(page.locator('html')).not.toHaveAttribute('data-cursor-pressed');
});

test('quick strikes alternate direction, stay bounded, and clean up their artwork', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Effects are only enabled for a fine pointer with hover.');
  await page.goto('/');
  await page.mouse.move(850, 350);
  const blade = page.locator('.stygius-slash-blade').last();
  const swing = () => blade.evaluate(element => (element.getAnimations()[0].effect as KeyframeEffect).getKeyframes()[2].transform);
  await page.mouse.down();
  const opening = await swing();
  await page.mouse.up();
  await page.mouse.down();
  expect(await swing()).not.toBe(opening);
  await page.mouse.up();

  // Several clicks in one frame exercise overlapping gradients and eviction.
  const result = await page.evaluate(() => {
    for (let index = 0; index < 20; index++) {
      document.body.dispatchEvent(new PointerEvent('pointerdown', {
        bubbles: true, pointerType: 'mouse', button: 0, clientX: 850, clientY: 350,
      }));
    }
    const layer = document.querySelector('.stygius-effects')!;
    const gradients = [...layer.querySelectorAll('linearGradient')].map(gradient => gradient.id);
    return {
      count: layer.childElementCount,
      uniqueGradients: new Set(gradients).size === gradients.length,
      allFillsResolve: [...layer.querySelectorAll('.stygius-cut-body')].every(path => {
        const id = path.getAttribute('fill')!.slice(5, -1);
        return path.closest('svg')!.querySelector(`[id="${id}"]`) !== null;
      }),
    };
  });
  expect(result.count).toBeLessThanOrEqual(40);
  expect(result.uniqueGradients).toBe(true);
  expect(result.allFillsResolve).toBe(true);
  await expect(page.locator('.stygius-effects span')).toHaveCount(0);
  await expect(page.locator('.stygius-effects svg')).toHaveCount(0);
  await page.waitForTimeout(600);
  await page.mouse.down();
  expect(await swing()).toBe(opening);
  await page.mouse.up();
});
