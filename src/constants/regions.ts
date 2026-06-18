export const REGION_ALL = 'all-front-range';
export const DEFAULT_REGION = 'colorado-springs';
export const PREFERRED_REGION_STORAGE_KEY = 'agg_preferred_region';

export const MUSIC_REGIONS = [
  { label: 'Colorado Springs', slug: 'colorado-springs' },
  { label: 'Pueblo Area', slug: 'pueblo-area' },
  { label: 'Trinidad / Walsenburg / Cañon City', slug: 'southern-colorado' },
  { label: 'Castle Rock', slug: 'castle-rock' },
  { label: 'Denver', slug: 'denver' },
  { label: 'Boulder', slug: 'boulder' },
  { label: 'Fort Collins', slug: 'fort-collins' },
  { label: 'Greeley', slug: 'greeley' },
  { label: 'Other Front Range', slug: 'other-front-range' },
] as const;

export type MusicRegionSlug = typeof MUSIC_REGIONS[number]['slug'];
export type RegionFilterValue = typeof REGION_ALL | MusicRegionSlug;

export const REGION_FILTER_OPTIONS = [
  { label: 'All Front Range', slug: REGION_ALL },
  ...MUSIC_REGIONS,
] as const;

const regionSlugs = new Set<string>(MUSIC_REGIONS.map((region) => region.slug));

export const isMusicRegionSlug = (value: unknown): value is MusicRegionSlug =>
  typeof value === 'string' && regionSlugs.has(value);

export const normalizeMusicRegion = (
  value: unknown,
  fallback: MusicRegionSlug = DEFAULT_REGION
): MusicRegionSlug => (isMusicRegionSlug(value) ? value : fallback);

export const normalizeRegionFilter = (value: unknown): RegionFilterValue => {
  if (value === REGION_ALL) return REGION_ALL;
  return isMusicRegionSlug(value) ? value : REGION_ALL;
};

export const getRegionLabel = (slug?: string | null): string => {
  if (!slug || slug === REGION_ALL) return 'All Front Range';
  return MUSIC_REGIONS.find((region) => region.slug === slug)?.label || slug;
};
