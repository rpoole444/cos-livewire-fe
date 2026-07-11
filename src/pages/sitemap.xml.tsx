import type { GetServerSideProps } from 'next';
import { MUSIC_REGIONS } from '@/constants/regions';
import { API_BASE_URL, SITE_URL } from '@/lib/seo';

type SitemapUrl = {
  loc: string;
  lastmod?: string;
  changefreq?: 'daily' | 'weekly' | 'monthly';
  priority?: number;
};

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const toIsoDate = (value?: string | null) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};

const renderSitemap = (urls: SitemapUrl[]) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    ${url.lastmod ? `<lastmod>${escapeXml(url.lastmod)}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${typeof url.priority === 'number' ? `<priority>${url.priority.toFixed(1)}</priority>` : ''}
  </url>`
  )
  .join('\n')}
</urlset>
`;

const fetchJson = async (path: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`);
    if (!response.ok) return [];
    const data = await response.json().catch(() => []);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn(`Sitemap fetch failed for ${path}`, error);
    return [];
  }
};

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const now = new Date().toISOString();
  const [events, profiles] = await Promise.all([
    fetchJson('/api/events'),
    fetchJson('/api/artists/public-list?include_gated=true'),
  ]);

  const staticUrls: SitemapUrl[] = [
    { loc: `${SITE_URL}/`, changefreq: 'daily', priority: 1.0, lastmod: now },
    { loc: `${SITE_URL}/artists`, changefreq: 'daily', priority: 0.8, lastmod: now },
    { loc: `${SITE_URL}/this-week`, changefreq: 'daily', priority: 0.8, lastmod: now },
    { loc: `${SITE_URL}/eventSubmission`, changefreq: 'monthly', priority: 0.6, lastmod: now },
    { loc: `${SITE_URL}/for-artists`, changefreq: 'monthly', priority: 0.6, lastmod: now },
    { loc: `${SITE_URL}/for-venues`, changefreq: 'monthly', priority: 0.6, lastmod: now },
    { loc: `${SITE_URL}/for-promoters`, changefreq: 'monthly', priority: 0.6, lastmod: now },
    { loc: `${SITE_URL}/about`, changefreq: 'monthly', priority: 0.5, lastmod: now },
    { loc: `${SITE_URL}/privacy`, changefreq: 'monthly', priority: 0.3, lastmod: now },
    { loc: `${SITE_URL}/terms`, changefreq: 'monthly', priority: 0.3, lastmod: now },
  ];

  const regionUrls: SitemapUrl[] = MUSIC_REGIONS.flatMap((region) => [
    { loc: `${SITE_URL}/events/${region.slug}`, changefreq: 'daily' as const, priority: 0.8, lastmod: now },
    { loc: `${SITE_URL}/venues/${region.slug}`, changefreq: 'weekly' as const, priority: 0.6, lastmod: now },
    { loc: `${SITE_URL}/this-week/${region.slug}`, changefreq: 'daily' as const, priority: 0.7, lastmod: now },
  ]);

  const eventUrls: SitemapUrl[] = events
    .filter((event: any) => event?.is_approved && event?.slug)
    .slice(0, 5000)
    .map((event: any) => ({
      loc: `${SITE_URL}/eventRouter/${event.slug}`,
      lastmod: toIsoDate(event.updated_at || event.date) || now,
      changefreq: 'weekly' as const,
      priority: 0.7,
    }));

  const profileUrls: SitemapUrl[] = profiles
    .filter((profile: any) => profile?.slug && !profile?.is_shell)
    .slice(0, 5000)
    .map((profile: any) => ({
      loc: `${SITE_URL}/artists/${profile.slug}`,
      lastmod: now,
      changefreq: 'weekly' as const,
      priority: profile.profile_type === 'venue' ? 0.6 : 0.7,
    }));

  const seen = new Set<string>();
  const urls = [...staticUrls, ...regionUrls, ...eventUrls, ...profileUrls].filter((url) => {
    if (seen.has(url.loc)) return false;
    seen.add(url.loc);
    return true;
  });

  res.setHeader('Content-Type', 'text/xml');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.write(renderSitemap(urls));
  res.end();

  return { props: {} };
};

export default function Sitemap() {
  return null;
}
