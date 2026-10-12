import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('HTML pages have titles, descriptions, favicons, and privacy controls', async () => {
  const pages = (await readdir(root)).filter((name) => name.endsWith('.html'));

  for (const page of pages) {
    const html = await readFile(path.join(root, page), 'utf8');
    assert.match(html, /<title>[^<]+<\/title>/i, `${page} needs a title`);
    assert.match(html, /<meta\s+name="description"\s+content="[^"]+"/i, `${page} needs a description`);
    assert.match(html, /href="assets\/favicon\.svg"/i, `${page} needs the favicon`);
    assert.match(html, /src="js\/privacy\.js"/i, `${page} needs the shared privacy controls`);
  }
});

test('HTML pages only reference files that exist in the project', async () => {
  const pages = (await readdir(root)).filter((name) => name.endsWith('.html'));

  for (const page of pages) {
    const html = await readFile(path.join(root, page), 'utf8');
    const references = [...html.matchAll(/(?:href|src)="([^"]+)"/gi)];

    for (const [, reference] of references) {
      if (/^(?:[a-z]+:|#|\/)/i.test(reference)) continue;
      const relativePath = reference.split(/[?#]/, 1)[0];
      if (!relativePath) continue;
      await access(path.join(root, relativePath)).catch(() => {
        assert.fail(`${page} references missing project file: ${reference}`);
      });
    }
  }
});
