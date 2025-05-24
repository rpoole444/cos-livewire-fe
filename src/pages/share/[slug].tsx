import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { fetchEventDetailsBySlug } from '@/pages/api/route'; // adjust if needed

export const getServerSideProps: GetServerSideProps = async (context) => {
  const slug = context.params?.slug as string;
  const event = await fetchEventDetailsBySlug(slug);

  if (!event) return { notFound: true };

  return {
    props: { event },
  };
};

export default function SharePreview({ event }: { event: any }) {
  const url = `https://app.alpinegrooveguide.com/share/${event.slug}`;
  const imageUrl = event.poster?.startsWith('http')
    ? event.poster
    : 'https://app.alpinegrooveguide.com/alpine_groove_guide_icon.png';
  const description = event.description?.slice(0, 150) || 'Live music in Colorado!';
  
  return (
    <>
     <Head>
  <title>{event.title}</title>
  <meta property="og:title" content={event.title} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={imageUrl} />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content={url} />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Alpine Groove Guide" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={event.title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={imageUrl} />
  <meta name="twitter:url" content={url} />

  <link rel="canonical" href={url} />
</Head>

      <p>Redirecting to event...</p>
      <script
        dangerouslySetInnerHTML={{
          __html: `window.location.href = "/eventRouter/${event.slug}"`,
        }}
      />
    </>
  );
}
