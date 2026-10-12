import { writeFile } from 'node:fs/promises';

const siteUrl = process.env.SITE_URL;
if (!siteUrl) {
    throw new Error('Set SITE_URL to the production HTTPS origin before generating the sitemap.');
}

const origin = new URL(siteUrl);
if (origin.protocol !== 'https:' || origin.pathname !== '/' || origin.search || origin.hash || origin.username || origin.password) {
    throw new Error('SITE_URL must be an HTTPS origin only, for example https://www.example.com');
}

const pages = ['', 'privacy.html', 'terms.html'];
const urls = pages.map((page) => {
    const location = new URL(page, origin).href;
    return `  <url>\n    <loc>${location}</loc>\n  </url>`;
});
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
const robots = `User-agent: *\nAllow: /\nSitemap: ${new URL('sitemap.xml', origin).href}\n`;

await Promise.all([
    writeFile(new URL('../sitemap.xml', import.meta.url), sitemap),
    writeFile(new URL('../robots.txt', import.meta.url), robots)
]);

console.log(`Generated sitemap.xml and robots.txt for ${origin.origin}`);
