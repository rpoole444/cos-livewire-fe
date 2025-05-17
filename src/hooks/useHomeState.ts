import { useRouter } from 'next/router';
import { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';
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

const isBrowser = typeof window !== 'undefined';

const safeGet = (key: string): string | null =>
  isBrowser ? localStorage.getItem(key) : null;

const safeSet = (key: string, val: string) => {
  if (isBrowser) localStorage.setItem(key, val);
};

const HOURS_BEFORE_RESET = 3;

export function useHomeState(): HomeState {
  const router = useRouter();

  // Determine once whether a reset is needed
  const resetNeededRef = useRef<boolean>(false);
  if (resetNeededRef.current === false) {
    const lastReset = safeGet('agg_last_reset');
    if (!lastReset) {
      resetNeededRef.current = true;
    } else {
      const then = dayjs(lastReset);
      resetNeededRef.current = dayjs().diff(then, 'hour') >= HOURS_BEFORE_RESET;
    }
  }

  // Initial state: selectedDate
  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => {
    if (resetNeededRef.current) return dayjs();

    const qp = router.query.date;
    const qd = Array.isArray(qp) ? qp[0] : qp;
    if (isISODate(qd)) return dayjs(qd);

    const ls = safeGet('agg_date');
    if (isISODate(ls)) return dayjs(ls);

    return dayjs();
  });

  // Initial state: filterMode
  const [filterMode, setFilterMode] = useState<FilterMode>(() => {
    if (resetNeededRef.current) return 'day';

    const qp = router.query.view;
    const qv = Array.isArray(qp) ? qp[0] : qp;
    if (isFilterMode(qv)) return qv;

    const ls = safeGet('agg_view');
    if (isFilterMode(ls)) return ls;

    return 'day';
  });

  // Initial state: searchQuery
  const [searchQuery, setSearchQuery] = useState<string>(() => {
    if (resetNeededRef.current) return '';

    const qp = router.query.q;
    const qq = Array.isArray(qp) ? qp[0] : qp;
    if (typeof qq === 'string') return qq;

    return safeGet('agg_search') ?? '';
  });

  // Persist state changes to localStorage and the URL
  // Persist state changes to localStorage and the URL
useEffect(() => {
  if (!isBrowser || !router.isReady) return;

  // ⛔ pages where we must NOT touch the URL
  const isEventDetail = router.pathname.includes('[eventId]') || router.asPath.includes('/eventRouter/');
  const isEditPage    = router.pathname.includes('[editId]')  || router.asPath.includes('/events/edit/');

  if (isEventDetail || isEditPage) return;   // 👈 added isEditPage

  const formattedDate = selectedDate.format('YYYY-MM-DD');

  // save to localStorage
  safeSet('agg_date',  formattedDate);
  safeSet('agg_view',  filterMode);
  safeSet('agg_search', searchQuery);
  safeSet('agg_last_reset', dayjs().toISOString());

  // only update the URL if something actually changed
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
          q: searchQuery || undefined,
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
