import type { GetServerSideProps } from 'next';
import Home from '@/pages/index';
import { isMusicRegionSlug, type MusicRegionSlug } from '@/constants/regions';

type EventsRegionPageProps = {
  initialRegion: MusicRegionSlug;
};

export default function EventsRegionPage({ initialRegion }: EventsRegionPageProps) {
  return <Home initialRegion={initialRegion} />;
}

export const getServerSideProps: GetServerSideProps<EventsRegionPageProps> = async (context) => {
  const region = context.params?.region;
  const slug = Array.isArray(region) ? region[0] : region;

  if (!isMusicRegionSlug(slug)) {
    return { notFound: true };
  }

  return {
    props: {
      initialRegion: slug,
    },
  };
};
