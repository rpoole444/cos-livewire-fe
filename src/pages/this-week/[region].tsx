import { GetServerSideProps } from 'next';
import ThisWeekGuide from '@/components/ThisWeekGuide';
import { RegionFilterValue, isMusicRegionSlug } from '@/constants/regions';

type ThisWeekRegionPageProps = {
  region: RegionFilterValue;
};

export default function ThisWeekRegionPage({ region }: ThisWeekRegionPageProps) {
  return <ThisWeekGuide initialRegion={region} />;
}

export const getServerSideProps: GetServerSideProps<ThisWeekRegionPageProps> = async (context) => {
  const region = context.params?.region;

  if (typeof region !== 'string' || !isMusicRegionSlug(region)) {
    return { notFound: true };
  }

  return {
    props: {
      region,
    },
  };
};
