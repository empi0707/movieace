import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadEnv } from 'vite';

const root = process.cwd();
const env = loadEnv('production', root, '');

const normalizeSiteUrl = (value) => {
    if (!value?.trim()) {
        throw new Error('VITE_SITE_URL is required to generate sitemap.xml.');
    }

    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('VITE_SITE_URL must use http or https.');
    }

    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/+$/, '');
};

const siteUrl = normalizeSiteUrl(env.VITE_SITE_URL);
const outputDir = resolve(root, 'dist');
const apiKey = env.VITE_API_KEY?.trim();
const accessToken = env.VITE_API_ACCESS_TOKEN?.trim();
const apiVersion = env.VITE_API_VERSION?.trim() || '3';
const apiOrigin = (env.VITE_API_BASE_URL?.trim() || 'https://api.themoviedb.org')
    .replace(/\/+$/, '');
const apiBase = (env.VITE_API_URL?.trim() || `${apiOrigin}/${apiVersion}`)
    .replace(/\/+$/, '');
const requestedPages = Number.parseInt(env.SITEMAP_TMDB_PAGES || '10', 10);
const tmdbPages = Number.isFinite(requestedPages)
    ? Math.min(Math.max(requestedPages, 1), 100)
    : 10;

const staticPaths = ['/', '/movies', '/tv-shows', '/actors'];
const movieIds = new Set();
const tvIds = new Set();
const personIds = new Set();

const endpoints = [
    { path: 'discover/movie', target: movieIds },
    { path: 'discover/tv', target: tvIds },
    { path: 'person/popular', target: personIds }
];

const fetchPage = async ({ path, target }, page) => {
    const url = new URL(`${apiBase}/${path}`);
    url.searchParams.set('page', String(page));
    if (apiKey) url.searchParams.set('api_key', apiKey);

    const headers = { Accept: 'application/json' };
    if (!apiKey && accessToken) headers.Authorization = `Bearer ${accessToken}`;

    const response = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(12_000)
    });

    if (!response.ok) {
        throw new Error(`${path} page ${page} returned HTTP ${response.status}`);
    }

    const payload = await response.json();
    for (const item of payload.results || []) {
        if (Number.isInteger(item.id) && item.id > 0) target.add(item.id);
    }
};

if (apiKey || accessToken) {
    for (let page = 1; page <= tmdbPages; page += 1) {
        const results = await Promise.allSettled(
            endpoints.map((endpoint) => fetchPage(endpoint, page))
        );

        for (const result of results) {
            if (result.status === 'rejected') {
                console.warn(`[sitemap] ${result.reason?.message || 'TMDB request failed'}`);
            }
        }
    }
} else {
    console.warn('[sitemap] No TMDB credentials found; generating static URLs only.');
}

const numericSort = (a, b) => a - b;
const paths = [
    ...staticPaths,
    ...[...movieIds].sort(numericSort).map((id) => `/movie/${id}`),
    ...[...tvIds].sort(numericSort).map((id) => `/tv-show/${id}`),
    ...[...personIds].sort(numericSort).map((id) => `/actor/${id}`)
];

const escapeXml = (value) => value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...paths.map((path) => `  <url><loc>${escapeXml(`${siteUrl}${path}`)}</loc></url>`),
    '</urlset>',
    ''
].join('\n');

const robots = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /search',
    'Disallow: /watchlist',
    'Disallow: /stream/',
    'Disallow: /watch/',
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    ''
].join('\n');

await mkdir(outputDir, { recursive: true });
await Promise.all([
    writeFile(resolve(outputDir, 'sitemap.xml'), sitemap, 'utf8'),
    writeFile(resolve(outputDir, 'robots.txt'), robots, 'utf8')
]);

console.log(`[sitemap] Generated ${paths.length} URLs for ${siteUrl}`);
