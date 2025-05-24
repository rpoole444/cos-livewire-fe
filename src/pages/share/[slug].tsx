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
  const imageUrl = event.poster?.startsWith('http')
    ? event.poster
    : 'https://app.alpinegrooveguide.com/alpine_groove_guide_icon.png';

  return (
    <>
      <Head>
        <title>{event.title}</title>
        <meta property="og:title" content={event.title} />
        <meta property="og:description" content={event.description?.slice(0, 150) || 'Live music in Colorado!'} />
        <meta property="og:image" content={imageUrl} />
        <meta property="og:url" content={`https://app.alpinegrooveguide.com/share/${event.slug}`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={imageUrl} />
        <meta name="twitter:title" content={event.title} />
        <meta name="twitter:description" content={event.description?.slice(0, 150) || ''} />
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
