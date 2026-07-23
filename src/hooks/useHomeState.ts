import { useRouter } from 'next/router';
import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import dayjs, { Dayjs } from 'dayjs';

export type FilterMode = 'day' | 'week' | 'all';

export interface HomeState {
  selectedDate: Dayjs;
  setSelectedDate: Dispatch<SetStateAction<Dayjs>>;
  filterMode: FilterMode;
  setFilterMode: Dispatch<SetStateAction<FilterMode>>;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
}

const isFilterMode = (v: unknown): v is FilterMode =>
  v === 'day' || v === 'week' || v === 'all';

const isISODate = (v: unknown): v is string =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

const safeGet = (key: string): string | null =>
  typeof window !== 'undefined' ? localStorage.getItem(key) : null;

const safeSet = (key: string, val: string) => {
  if (typeof window !== 'undefined') localStorage.setItem(key, val);
};

const HOURS_BEFORE_RESET = 3;

type InitialHomeState = {
  date: string;
  filterMode?: FilterMode;
  searchQuery?: string;
};

export function useHomeState(initial: InitialHomeState): HomeState {
  const router = useRouter();

  // Match SSR exactly; browser-only preferences are restored after hydration.
  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => dayjs(initial.date));
  const [filterMode, setFilterMode] = useState<FilterMode>(initial.filterMode || 'day');
  const [searchQuery, setSearchQuery] = useState<string>(initial.searchQuery || '');

  useEffect(() => {
    if (!router.isReady) return;

    const lastReset = safeGet('agg_last_reset');
    const resetNeeded = !lastReset || dayjs().diff(dayjs(lastReset), 'hour') >= HOURS_BEFORE_RESET;
    if (resetNeeded) return;

    const dateQuery = Array.isArray(router.query.date) ? router.query.date[0] : router.query.date;
    const viewQuery = Array.isArray(router.query.view) ? router.query.view[0] : router.query.view;
    const searchQueryValue = Array.isArray(router.query.q) ? router.query.q[0] : router.query.q;
    const storedDate = safeGet('agg_date');
    const storedView = safeGet('agg_view');
    const nextDate = isISODate(dateQuery) ? dateQuery : storedDate;
    const nextView = isFilterMode(viewQuery) ? viewQuery : storedView;

    if (isISODate(nextDate)) setSelectedDate(dayjs(nextDate));
    if (isFilterMode(nextView)) setFilterMode(nextView);
    setSearchQuery(typeof searchQueryValue === 'string' ? searchQueryValue : safeGet('agg_search') || '');
  }, [router.isReady, router.query.date, router.query.q, router.query.view]);

  useEffect(() => {
    if (typeof window === 'undefined' || !router.isReady) return;
  
    // ✅ Only the home / calendar pages may rewrite the URL
    const isCalendarPage =
      router.pathname === '/' ||      // landing calendar
      router.pathname === '/calendar';
  
    if (!isCalendarPage) return;      // ← do nothing on detail/edit pages
  
    const formattedDate = selectedDate.format('YYYY-MM-DD');
  
    // ── persist to localStorage ────────────────────────────
    safeSet('agg_date',  formattedDate);
    safeSet('agg_view',  filterMode);
    safeSet('agg_search', searchQuery);
    safeSet('agg_last_reset', dayjs().toISOString());
  
    // ── only touch router if something changed ─────────────
    const needsUpdate =
      router.query.date !== formattedDate ||
      router.query.view !== filterMode   ||
      router.query.q    !== searchQuery;
  
    if (needsUpdate) {
      router.replace(
        {
          pathname: router.pathname,
          query: {
            ...router.query,
            date: formattedDate,
            view: filterMode,
            q: searchQuery || undefined,  // drop when empty
          },
        },
        undefined,
        { shallow: true }
      );
    }
  }, [selectedDate, filterMode, searchQuery, router]);
  
  

  return {
    selectedDate,
    setSelectedDate,
    filterMode,
    setFilterMode,
    searchQuery,
    setSearchQuery,
  };
}
