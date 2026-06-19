import type { GetServerSideProps } from 'next';
import ArtistDirectoryPage from '@/pages/artists';
import { isMusicRegionSlug, type MusicRegionSlug } from '@/constants/regions';

type VenuesRegionPageProps = {
  initialRegion: MusicRegionSlug;
};

export default function VenuesRegionPage({ initialRegion }: VenuesRegionPageProps) {
  return <ArtistDirectoryPage initialRegion={initialRegion} initialProfileType="venue" />;
}

export const getServerSideProps: GetServerSideProps<VenuesRegionPageProps> = async (context) => {
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
