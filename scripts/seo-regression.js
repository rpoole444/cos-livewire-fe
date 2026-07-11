#!/usr/bin/env node

const BASE_URL = (process.env.SEO_BASE_URL || 'https://app.alpinegrooveguide.com').replace(/\/$/, '');
const CANONICAL_BASE_URL = (process.env.SEO_CANONICAL_BASE_URL || 'https://app.alpinegrooveguide.com').replace(/\/$/, '');

const failures = [];

const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

const fetchText = async (pathOrUrl) => {
  const url = /^https?:\/\//i.test(pathOrUrl) ? pathOrUrl : `${BASE_URL}${pathOrUrl}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'AGG SEO regression test',
    },
  });
  const text = await response.text();
  return { url, status: response.status, contentType: response.headers.get('content-type') || '', text };
};

const extractSitemapLocs = (xml) => {
  const locs = [];
  const locPattern = /<loc>(.*?)<\/loc>/g;
  let match = locPattern.exec(xml);
  while (match) {
    locs.push(match[1]);
    match = locPattern.exec(xml);
  }
  return locs;
};

const hasCanonical = (html, expectedUrl) => {
  const canonicalPattern = new RegExp(
    `<link[^>]+rel=["']canonical["'][^>]+href=["']${expectedUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`,
    'i'
  );
  const reversedPattern = new RegExp(
    `<link[^>]+href=["']${expectedUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]+rel=["']canonical["'][^>]*>`,
    'i'
  );
  return canonicalPattern.test(html) || reversedPattern.test(html);
};

const run = async () => {
  console.log(`Running SEO regression checks against ${BASE_URL}`);

  const robots = await fetchText('/robots.txt');
  assert(robots.status === 200, 'robots.txt should return 200');
  assert(/text\/plain/i.test(robots.contentType), 'robots.txt should be served as text/plain');
  assert(/Disallow:\s*\/admin/i.test(robots.text), 'robots.txt should disallow /admin');
  assert(
    robots.text.includes(`Sitemap: ${CANONICAL_BASE_URL}/sitemap.xml`) ||
      robots.text.includes(`Sitemap: ${BASE_URL}/sitemap.xml`),
    'robots.txt should include the sitemap URL'
  );

  const sitemap = await fetchText('/sitemap.xml');
  assert(sitemap.status === 200, 'sitemap.xml should return 200');
  assert(/xml/i.test(sitemap.contentType), 'sitemap.xml should be served as XML');
  assert(/<urlset/i.test(sitemap.text), 'sitemap.xml should contain a urlset');

  const locs = extractSitemapLocs(sitemap.text);
  assert(locs.includes(`${CANONICAL_BASE_URL}/`) || locs.includes(`${BASE_URL}/`), 'sitemap should include the homepage');
  assert(locs.some((loc) => loc.endsWith('/this-week')), 'sitemap should include /this-week');
  assert(!locs.some((loc) => /\/admin|\/AdminService|\/LoginPage|\/artists\/edit/i.test(loc)), 'sitemap should exclude private/admin/auth/edit routes');

  const regional = await fetchText('/events/colorado-springs');
  assert(regional.status === 200, '/events/colorado-springs should return 200');
  assert(hasCanonical(regional.text, `${CANONICAL_BASE_URL}/events/colorado-springs`), '/events/colorado-springs should include a canonical URL');
  assert(/<meta[^>]+name=["']robots["'][^>]+content=["'](?:index|noindex),follow["']/i.test(regional.text), '/events/colorado-springs should declare indexability');
  assert(/"@type":"ItemList"/.test(regional.text), '/events/colorado-springs should include ItemList JSON-LD');

  const eventLoc = locs.find((loc) => loc.includes('/eventRouter/'));
  if (eventLoc) {
    const event = await fetchText(eventLoc);
    assert(event.status === 200, `${eventLoc} should return 200`);
    assert(hasCanonical(event.text, eventLoc), `${eventLoc} should include a canonical URL`);
    assert(/"@type":"MusicEvent"/.test(event.text), `${eventLoc} should include MusicEvent JSON-LD`);
    assert(/"@type":"BreadcrumbList"/.test(event.text), `${eventLoc} should include breadcrumb JSON-LD`);
  } else {
    console.warn('No event URLs found in sitemap; skipping event JSON-LD check for this environment.');
  }

  const profileLoc = locs.find((loc) => /\/artists\/[^/]+$/.test(loc));
  if (profileLoc) {
    const profile = await fetchText(profileLoc);
    assert(profile.status === 200, `${profileLoc} should return 200`);
    assert(hasCanonical(profile.text, profileLoc), `${profileLoc} should include a canonical URL`);
    assert(
      /"@type":"(?:MusicGroup|MusicVenue|Organization)"/.test(profile.text),
      `${profileLoc} should include artist/venue structured data`
    );
  }

  if (failures.length) {
    console.error('\nSEO regression failures:');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log('SEO regression checks passed.');
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
