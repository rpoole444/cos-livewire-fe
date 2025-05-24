// pages/share/[slug].tsx
import { fetchEventDetailsBySlug } from "../api/route";

export const getServerSideProps = async (context: any) => {
  const slug = context.params?.slug;
  const event = await fetchEventDetailsBySlug(slug);

  if (!event) {
    return {
      notFound: true,
    };
  }

  const imageUrl = event.poster?.startsWith('http')
    ? event.poster
    : 'https://app.alpinegrooveguide.com/alpine_groove_guide_icon.png';

  const description = event.description?.slice(0, 150) || 'Live music in Colorado!';

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <title>${event.title}</title>
        <meta property="og:title" content="${event.title}" />
        <meta property="og:description" content="${description}" />
        <meta property="og:image" content="${imageUrl}" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content="https://app.alpinegrooveguide.com/share/${slug}" />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Alpine Groove Guide" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="${imageUrl}" />
        <meta name="twitter:title" content="${event.title}" />
        <meta name="twitter:description" content="${description}" />
        <meta http-equiv="refresh" content="0;url=/eventRouter/${slug}" />
      </head>
      <body>
        <p>Redirecting to event...</p>
      </body>
    </html>
  `;

  return {
    props: {},
    redirect: {
      destination: `/eventRouter/${slug}`, // fallback if HTML fails
      permanent: false,
    },
    // override Next.js default page rendering
    notFound: false,
  };

  // OR RETURN DIRECTLY AS A RESPONSE:
  // context.res.setHeader('Content-Type', 'text/html');
  // context.res.end(html);
  // return { props: {} };
};

export default function SharePage() {
  return null; // Because actual rendering is handled in getServerSideProps
}
