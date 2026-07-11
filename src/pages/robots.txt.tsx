import type { GetServerSideProps } from 'next';
import { SITE_URL } from '@/lib/seo';

const robotsTxt = `User-agent: *
Disallow: /admin
Disallow: /AdminService
Disallow: /AdminUsersPage
Disallow: /api
Disallow: /embed
Disallow: /LoginPage
Disallow: /RegisterPage
Disallow: /UserProfile
Disallow: /artist-signup
Disallow: /EditEventPage
Disallow: /events/edit
Disallow: /artists/edit
Disallow: /forgot-password
Disallow: /profile
Disallow: /reset-password
Disallow: /unsubscribe
Disallow: /upgrade
Disallow: /venue-signup

Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.setHeader('Content-Type', 'text/plain');
  res.write(robotsTxt);
  res.end();

  return { props: {} };
};

export default function RobotsTxt() {
  return null;
}
