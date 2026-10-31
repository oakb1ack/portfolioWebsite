import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { drawChapterCrest } from './chapter-artwork.mjs';

const require = createRequire(import.meta.url);
const output = new URL('../src/assets/crests/', import.meta.url);
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.setContent('<!doctype html><html><body></body></html>');
  await page.addScriptTag({ path: require.resolve('paper/dist/paper-core.min.js') });
  await mkdir(output, { recursive: true });
  for (const kind of ['home', 'about', 'experience', 'blog', 'uncharted']) {
    const exported = await page.evaluate(drawChapterCrest, kind);
    // Keep exported IDs unique if several symbols share a document.
    const prefix = `crest-${kind}-`;
    const svg = exported.replace(/\bid="([^"]+)"/g, (_, id) => `id="${prefix}${id}"`)
      .replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${prefix}${id})`)
      .replace(/href="#([^"]+)"/g, (_, id) => `href="#${prefix}${id}"`);
    const file = new URL(`${kind}.svg`, output);
    await writeFile(file, `${svg}\n`);
    console.log(`Generated ${fileURLToPath(file)} (${Buffer.byteLength(svg)} bytes)`);
  }
} finally {
  await browser.close();
}
